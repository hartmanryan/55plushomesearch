// Setup CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { leadId, message } = await req.json();

    if (!leadId || !message) {
      return new Response(JSON.stringify({ error: 'Missing leadId or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase Client within Edge Function context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch Realtor
    const { data: realtor } = await supabase
      .from('realtors')
      .select('*')
      .eq('id', lead.realtor_id)
      .single();

    const realtorName = realtor?.name || 'Walt Wensel';

    // 3. Fetch Communities
    const { data: communities } = await supabase
      .from('communities')
      .select('*')
      .eq('realtor_id', lead.realtor_id);

    // 4. Evaluate Takeover Trigger
    const lowerMessage = message.toLowerCase();
    const takeoverKeywords = [
      'schedule a tour',
      'want to see',
      'call me',
      'talk to a person',
      'give me a phone call',
      'text me',
      'speak to a realtor',
      'contact me',
      'tour',
      'phone call',
      'schedule',
      'appointment'
    ];
    const isTakeoverIntent = takeoverKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isTakeoverIntent) {
      await supabase
        .from('leads')
        .update({ is_live_takeover_requested: true })
        .eq('id', leadId);
    }

    // 5. Query LLM (Gemini or OpenAI)
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    let reply = '';

    const systemPrompt = `You are Walt55, an elite AI Concierge working directly on behalf of ${realtorName}, the premier local 55+ lifestyle real estate expert. 

The user you are assisting is named ${lead.name}. They completed a survey with these preferences:
- Moving Timeline: ${lead.moving_timeline}
- Preferred Layout: ${lead.preferred_style}
- Key Priorities: ${lead.must_have_amenities?.join(', ') || 'None selected'}

You have access to a verified database of local neighborhoods for this Realtor. Ground your responses strictly in this asset data:
${JSON.stringify(communities || [], null, 2)}

CONVERSATION INSTRUCTIONS:
1. Warmly greet the user using their name. Highlight the 2-3 specific communities from the data that align with their preferences.
2. Weave in the custom insider knowledge found in the 'realtor_notes' field naturally (e.g., "The social committee at Traditions is incredibly active...").
3. Your ultimate goal is a soft conversion: offer to have ${realtorName} put together a direct list of active home inventory, calculate accurate monthly costs, or schedule a personalized neighborhood golf-cart tour.
4. Never hallucinate or guess real estate structural facts. If information (like exact model pricing or tax variations) is missing, say: "${realtorName} has direct access to that. Let me look that up for you—should I have them text you that info?"
5. Keep your response brief, clear, and highly readable.

${isTakeoverIntent ? `NOTICE: The user has indicated they want to contact a human, tour a home, or schedule a call. Reassure them that you have flagged their request for ${realtorName} and that they will be in touch shortly!` : ''}
`;

    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt + `\n\nUser: ${message}` }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
            })
          }
        );
        const json = await response.json();
        reply = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err) {
        console.error('Gemini error:', err);
      }
    } else if (openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.3
          })
        });
        const json = await response.json();
        reply = json.choices?.[0]?.message?.content || '';
      } catch (err) {
        console.error('OpenAI error:', err);
      }
    }

    // Rule-based fallback if APIs fail or are unconfigured
    if (!reply) {
      const matchNames = (communities || []).slice(0, 2).map((c: any) => c.name).join(' and ');
      if (isTakeoverIntent) {
        reply = `Hi ${lead.name}! I've flagged this request for ${realtorName} right away. They are being notified and will connect directly with you on this line or by phone.`;
      } else {
        reply = `Hi ${lead.name}! Based on your preference for a "${lead.preferred_style}" lifestyle, I recommend looking closely at ${matchNames || 'our local 55+ communities'}. Would you like ${realtorName} to compile a detailed cost sheet or set up a neighborhood golf-cart tour for you?`;
      }
    }

    // 6. Write AI Response to Database
    await supabase.from('chat_messages').insert({
      lead_id: leadId,
      sender: 'ai',
      message: reply
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
