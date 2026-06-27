import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, ShieldAlert, Phone } from 'lucide-react';
import { supabase, isMockClient } from '../../utils/supabaseClient';

interface Message {
  id?: string;
  sender: 'user' | 'ai' | 'realtor';
  message: string;
  created_at?: string;
}

interface ChatFeedProps {
  leadId: string;
  realtorName: string;
  initialQuestion?: string;
  lead?: any;
  communities?: any[];
}

export default function ChatFeed({ leadId, realtorName, initialQuestion, lead, communities }: ChatFeedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTakeoverRequested, setIsTakeoverRequested] = useState(false);
  const [takeoverStatusMessage, setTakeoverStatusMessage] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions for 55+ demographic (quick clicks)
  const suggestions = [
    'What are the monthly HOA costs?',
    'Which community is best for pickleball?',
    'I want to schedule a golf-cart tour',
    'Are pets allowed in these communities?'
  ];

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages((prev) => {
          if (prev.length !== data.length) {
            return data as Message[];
          }
          const hasDifference = data.some((msg: any, idx: number) => {
            return prev[idx].message !== msg.message || prev[idx].sender !== msg.sender;
          });
          return hasDifference ? (data as Message[]) : prev;
        });
      }

      // Check takeover status
      const { data: leadData } = await supabase
        .from('leads')
        .select('is_live_takeover_requested')
        .eq('id', leadId)
        .single();
      
      if (leadData) {
        setIsTakeoverRequested(leadData.is_live_takeover_requested);
        if (leadData.is_live_takeover_requested) {
          // Check if realtor has responded
          const hasRealtorSentMsg = data?.some((m: any) => m.sender === 'realtor');
          setTakeoverStatusMessage(
            hasRealtorSentMsg
              ? `Connected! You are now chatting live with ${realtorName}.`
              : `Alert sent to ${realtorName}. Connecting you to a live line...`
          );
        }
      }
    } catch (err) {
      console.error('Error fetching chat logs:', err);
    }
  };

  // Poll for new messages every 3 seconds (helps with Realtor takeover live chat sync)
  useEffect(() => {
    fetchChatHistory();
    const interval = setInterval(fetchChatHistory, 3000);
    return () => clearInterval(interval);
  }, [leadId]);

  // Handle prefilled/external questions (like clicking a match CTA)
  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage(initialQuestion);
    }
  }, [initialQuestion]);

  // Scroll to bottom of chat feed only
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    setLoading(true);
    if (textToSend === inputValue) {
      setInputValue('');
    }

    try {
      // 1. Insert user message to DB
      const userMsg: Message = { sender: 'user', message: text };
      const { error: insError } = await supabase
        .from('chat_messages')
        .insert({ lead_id: leadId, sender: 'user', message: text });

      if (insError) throw insError;

      // Update UI immediately
      setMessages((prev) => [...prev, userMsg]);

      // 2. Post payload to API Concierge completion route
      const response = await fetch('/api/chat-concierge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          message: text,
          lead,
          communities
        })
      });

      if (!response.ok) {
        throw new Error('Completion server error');
      }

      const resData = await response.json();
      if (resData.reply && isMockClient) {
        // In local mock client mode, manually write AI response to client local database
        await supabase.from('chat_messages').insert({
          lead_id: leadId,
          sender: 'ai',
          message: resData.reply
        });
      }

      // Refresh chat to show AI response
      await fetchChatHistory();
    } catch (err) {
      console.error('Failed to dispatch message:', err);
      // Fallback message local insert in case endpoint is not running
      const firstName = realtorName.split(' ')[0];
      const fallbackAiMsg: Message = { 
        sender: 'ai', 
        message: `Hi there! I'm ${firstName}55, your active-adult concierge. I'm having trouble connecting to my brain right now, but I've logged your request. ${realtorName} can assist you directly with that! Would you like them to give you a call?` 
      };
      await supabase.from('chat_messages').insert({
        lead_id: leadId,
        sender: 'ai',
        message: fallbackAiMsg.message
      });
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border-custom rounded-2xl overflow-hidden editorial-shadow">
      {/* Chat Header */}
      <div className="bg-foreground text-white p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2.5 rounded-xl text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold">{realtorName.split(' ')[0]}55 AI Concierge</h3>
            <p className="text-xs text-white/70">Assisting on behalf of {realtorName}</p>
          </div>
        </div>
      </div>

      {/* Takeover Request Notice */}
      {isTakeoverRequested && (
        <div className="bg-primary/5 border-b border-primary/20 p-4 flex items-center gap-3 animate-pulse">
          <Phone className="w-5 h-5 text-primary shrink-0" />
          <p className="text-base font-bold text-foreground leading-tight">
            {takeoverStatusMessage}
          </p>
        </div>
      )}

      {/* Message Feed Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-background">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-serif font-bold text-foreground">Ask {realtorName.split(' ')[0]} Anything!</h4>
            <p className="text-base text-foreground/60 max-w-sm mx-auto font-light leading-relaxed">
              Ask about home inventory, HOA fee inclusions, pet rules, or request a golf-cart tour.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const isRealtor = msg.sender === 'realtor';
          
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-serif font-bold text-sm ${
                  isRealtor ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/15 text-primary'
                }`}>
                  {isRealtor ? 'R' : realtorName[0]}
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[80%] text-base leading-relaxed ${
                  isUser
                    ? 'bg-foreground text-white rounded-br-none'
                    : isRealtor
                    ? 'bg-emerald-50 border-2 border-emerald-200 text-emerald-950 rounded-bl-none'
                    : 'bg-white border border-border-custom text-foreground rounded-bl-none shadow-2xs'
                }`}
              >
                {isRealtor && (
                  <span className="block text-[10px] uppercase font-extrabold text-emerald-700 mb-1">
                    Live Chat Takeover: {realtorName}
                  </span>
                )}
                {msg.message}
              </div>

              {isUser && (
                <div className="w-9 h-9 rounded-full bg-foreground/10 text-foreground/75 flex items-center justify-center shrink-0 font-serif font-bold text-sm">
                  U
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 font-serif font-bold text-sm">
              {realtorName[0]}
            </div>
            <div className="bg-white border border-border-custom p-4 rounded-2xl rounded-bl-none shadow-2xs">
              <div className="flex space-x-2">
                <div className="w-2.5 h-2.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      {messages.length < 5 && (
        <div className="p-3 bg-white border-t border-border-custom flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s)}
              className="bg-background hover:bg-primary/5 border border-border-custom hover:border-primary/30 text-foreground/80 hover:text-primary text-xs font-semibold py-2 px-3 rounded-lg transition-all interactive-target text-left cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-4 bg-white border-t border-border-custom flex items-center gap-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask ${realtorName.split(' ')[0]} about communities...`}
          className="flex-1 border-2 border-border-custom py-3 px-4 rounded-xl text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-background/50"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="bg-primary hover:bg-primary-hover disabled:bg-primary/45 text-white p-4 rounded-xl transition-colors interactive-target shadow-2xs shrink-0 cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
