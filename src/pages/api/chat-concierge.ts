import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, message } = req.body;

  if (!leadId || !message) {
    return res.status(400).json({ error: 'Missing leadId or message payload' });
  }

  try {
    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead profile not found' });
    }

    // 2. Fetch Realtor
    const { data: realtor, error: realtorError } = await supabase
      .from('realtors')
      .select('*')
      .eq('id', lead.realtor_id)
      .single();

    const realtorName = realtor?.name || 'Walt Wensel';
    const realtorPhone = realtor?.phone || '(717) 555-0199';

    // 3. Fetch Communities
    const { data: communities } = await supabase
      .from('communities')
      .select('*')
      .eq('realtor_id', lead.realtor_id);

    const activeCommunities = communities || [];

    // 4. Intent Evaluation (Takeover Trigger)
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
      'appointment',
      'view a home'
    ];
    const isTakeoverIntent = takeoverKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isTakeoverIntent) {
      await supabase
        .from('leads')
        .update({ is_live_takeover_requested: true })
        .eq('id', leadId);
    }

    // 5. Check if LLM Keys are set. If not, run our Smart Rule-Based Fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    let aiReplyText = '';

    if (geminiKey) {
      // Execute Gemini API call
      aiReplyText = await callGeminiAPI(geminiKey, lead, realtorName, activeCommunities, message, isTakeoverIntent);
    } else if (openAiKey) {
      // Execute OpenAI API call
      aiReplyText = await callOpenAI(openAiKey, lead, realtorName, activeCommunities, message, isTakeoverIntent);
    } else {
      // Local Smart Mock Reply Generator
      aiReplyText = generateSmartMockResponse(lead, realtorName, activeCommunities, message, isTakeoverIntent);
    }

    // 6. Write AI Response to Database
    await supabase.from('chat_messages').insert({
      lead_id: leadId,
      sender: 'ai',
      message: aiReplyText
    });

    return res.status(200).json({ reply: aiReplyText });
  } catch (err: any) {
    console.error('Concierge completion handler error:', err);
    return res.status(500).json({ error: 'Internal handler failure' });
  }
}

// Smart Mock Response Generator based on Community attributes
function generateSmartMockResponse(
  lead: any,
  realtorName: string,
  communities: any[],
  userMessage: string,
  isTakeoverIntent: boolean
): string {
  const lowerMsg = userMessage.toLowerCase();
  const firstName = realtorName.split(' ')[0];
  const botName = `${firstName}55`;

  if (isTakeoverIntent) {
    return `Hi ${lead.name}! I would be thrilled to help you schedule a golf-cart tour or consultation. I have flagged this request directly for ${realtorName} and set your dashboard to "Live Agent" mode. They are being notified on their mobile device and will reach out to you directly, or jump right into this chat screen!`;
  }

  // Answer about HOA costs
  if (lowerMsg.includes('hoa') || lowerMsg.includes('cost') || lowerMsg.includes('fee') || lowerMsg.includes('monthly')) {
    const feeInfo = communities.slice(0, 4).map(c => `**${c.name}** features a ${c.hoa_frequency} fee of $${c.hoa_fee} which includes: ${c.hoa_inclusions.slice(0, 3).join(', ')}${c.hoa_inclusions.length > 3 ? ' etc' : ''}.`).join('\n\n');
    return `Hi ${lead.name}! Monthly costs and what they cover are super important when active-adult planning. Here is the exact HOA information from our directory:\n\n${feeInfo}\n\nWould you like me to have ${realtorName} confirm if there are any upcoming rate changes or assessments?`;
  }

  // Answer about Pickleball or Sports
  if (lowerMsg.includes('pickleball') || lowerMsg.includes('tennis') || lowerMsg.includes('sport') || lowerMsg.includes('active')) {
    const pickleballComms = communities.filter(c => c.amenities.some((a: string) => a.toLowerCase().includes('pickleball') || a.toLowerCase().includes('tennis')));
    if (pickleballComms.length > 0) {
      const names = pickleballComms.slice(0, 2).map(c => c.name).join(' and ');
      return `Hi ${lead.name}! If you enjoy active tennis or pickleball, you are in luck! Both ${names} offer dedicated court facilities. In fact, ${pickleballComms[0].name} has a wonderful setup for active sports. Should I have ${realtorName} email you their weekly social calendar?`;
    }
    return `Hi ${lead.name}! While not all communities feature dedicated tennis or pickleball courts, they all offer active walking trails and clubhouse facilities. Would you like me to check if there are public courts nearby?`;
  }

  // Answer about Pets
  if (lowerMsg.includes('pet') || lowerMsg.includes('dog') || lowerMsg.includes('cat')) {
    const petComms = communities.filter(c => c.amenities.some((a: string) => a.toLowerCase().includes('pet') || a.toLowerCase().includes('dog') || a.toLowerCase().includes('trail') || a.toLowerCase().includes('park')));
    const highlight = petComms.length > 0 ? petComms.slice(0, 2).map(c => c.name).join(' and ') : (communities[0]?.name || 'these neighborhoods');
    return `Hi ${lead.name}! Standard active-adult communities are highly pet-friendly, though some have guidelines on weight limits or number of pets (usually max 2). ${highlight} are very popular with dog owners because of their trails and open spaces. Would you like ${realtorName} to verify the exact covenants for your specific pet details?`;
  }

  // Default grounding answer highlighting matches
  const matchNames = communities.slice(0, 2).map(c => c.name).join(' and ');
  const firstComm = communities[0]?.name || 'our featured inventory';
  const secondComm = communities[1]?.name || 'the surrounding neighborhoods';
  const regionText = communities[0]?.region || 'the area';

  return `Hi ${lead.name}! I'm ${botName}, your active-adult concierge. Based on your preference for a "${lead.preferred_style}" lifestyle, I highly recommend checking out **${matchNames}**. 

${firstComm} features a fantastic location in ${regionText}, while ${secondComm} offers a peaceful, low-maintenance environment that fits your layout preferences perfectly.

What aspect of these communities can I explain further? (e.g. HOA fee inclusions, home sizes, or scheduling a visit?)`;
}

// Call Gemini API completion
async function callGeminiAPI(
  apiKey: string,
  lead: any,
  realtorName: string,
  communities: any[],
  userMessage: string,
  isTakeoverIntent: boolean
): Promise<string> {
  const prompt = compileGroundingPrompt(lead, realtorName, communities, userMessage, isTakeoverIntent);
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        })
      }
    );

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || generateSmartMockResponse(lead, realtorName, communities, userMessage, isTakeoverIntent);
  } catch (err) {
    console.error('Gemini API call failed, falling back:', err);
    return generateSmartMockResponse(lead, realtorName, communities, userMessage, isTakeoverIntent);
  }
}

// Call OpenAI API completion
async function callOpenAI(
  apiKey: string,
  lead: any,
  realtorName: string,
  communities: any[],
  userMessage: string,
  isTakeoverIntent: boolean
): Promise<string> {
  const prompt = compileGroundingPrompt(lead, realtorName, communities, userMessage, isTakeoverIntent);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3
      })
    });

    const json = await response.json();
    return json.choices?.[0]?.message?.content || generateSmartMockResponse(lead, realtorName, communities, userMessage, isTakeoverIntent);
  } catch (err) {
    console.error('OpenAI API call failed, falling back:', err);
    return generateSmartMockResponse(lead, realtorName, communities, userMessage, isTakeoverIntent);
  }
}

// Helper to construct the system prompt
function compileGroundingPrompt(
  lead: any,
  realtorName: string,
  communities: any[],
  userMessage: string,
  isTakeoverIntent: boolean
): string {
  const firstName = realtorName.split(' ')[0];
  const botName = `${firstName}55`;
  return `You are ${botName}, an elite AI Concierge working directly on behalf of ${realtorName}, the premier local 55+ lifestyle real estate expert. 

The user you are assisting is named ${lead.name}. They completed a survey with these preferences:
- Moving Timeline: ${lead.moving_timeline}
- Preferred Layout: ${lead.preferred_style}
- Key Priorities: ${lead.must_have_amenities?.join(', ') || 'None selected'}

You have access to a verified database of local neighborhoods for this Realtor. Ground your responses strictly in this asset data:
${JSON.stringify(communities, null, 2)}

CONVERSATION INSTRUCTIONS:
1. Warmly greet the user using their name. Highlight the 2-3 specific communities from the data that align with their preferences.
2. Weave in the custom insider knowledge found in the 'realtor_notes' field naturally (e.g., "The social committee at Traditions is incredibly active...").
3. Your ultimate goal is a soft conversion: offer to have ${realtorName} put together a direct list of active home inventory, calculate accurate monthly costs, or schedule a personalized neighborhood golf-cart tour.
4. Never hallucinate or guess real estate structural facts. If information (like exact model pricing or tax variations) is missing, say: "${realtorName} has direct access to that. Let me look that up for you—should I have them text you that info?"
5. Keep your response brief and easy to read (use formatting like bullet points or bold text where appropriate). Keep text sizing readable.

${isTakeoverIntent ? `NOTICE: The user has indicated they want to contact a human, tour a home, or schedule a call. Reassure them that you have flagged their request for ${realtorName} and that they will be in touch shortly!` : ''}
`;
}
