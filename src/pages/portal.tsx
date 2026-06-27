import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare,
  Phone,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Map,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import { fetchRealtorBySubdomain, fetchCommunitiesByRealtor, Realtor, Community } from '../utils/tenant';
import ChatFeed from '../components/Chat/ChatFeed';

// Dynamically load Map component to prevent SSR hydration crashes (since Leaflet reads 'window' variables)
const CommunityMap = dynamic(() => import('../components/Map/CommunityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-100 animate-pulse rounded-2xl flex flex-col items-center justify-center border border-slate-200 gap-3">
      <Compass className="w-8 h-8 text-indigo-500 animate-spin" />
      <p className="text-slate-400 font-bold text-base">Loading interactive map...</p>
    </div>
  )
});

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  moving_timeline: string;
  budget_min?: number;
  budget_max?: number;
  preferred_style: string;
  must_have_amenities: string[];
  bedrooms?: number;
  bathrooms?: number;
  is_live_takeover_requested: boolean;
  realtor_id: string;
  current_residence?: string;
}

export default function Portal() {
  const router = useRouter();
  const { leadId } = router.query;

  const [lead, setLead] = useState<Lead | null>(null);
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [matchedCommunities, setMatchedCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<string>('');
  
  // Custom design interactive states
  const [highlightedCommunityId, setHighlightedCommunityId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'list' | 'map'>('list');

  // Fetch lead, realtor, and communities
  useEffect(() => {
    if (!leadId) return;

    async function loadPortalData() {
      try {
        // 1. Fetch Lead
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (leadError || !leadData) {
          console.error('Lead not found');
          setLoading(false);
          return;
        }

        const resolvedLead = leadData as Lead;
        setLead(resolvedLead);

        // 2. Fetch Realtor
        const { data: realtorData } = await supabase
          .from('realtors')
          .select('*')
          .eq('id', resolvedLead.realtor_id)
          .single();

        if (realtorData) {
          setRealtor(realtorData as Realtor);
        }

        // 3. Fetch Communities
        const commData = await fetchCommunitiesByRealtor(resolvedLead.realtor_id);
        setCommunities(commData);

        // 4. Calculate matches
        scoreAndMatchCommunities(resolvedLead, commData);

      } catch (err) {
        console.error('Failed to load portal assets:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, [leadId]);

  // Scoring algorithm for custom matches
  const scoreAndMatchCommunities = (userLead: Lead, allComms: Community[]) => {
    const scored = allComms.map((comm) => {
      let score = 0;
      const matchingAmenities: string[] = [];

      // 1. Style Match (High weight)
      const hasStyleMatch = comm.home_types.some(
        (type) => type.toLowerCase() === userLead.preferred_style.toLowerCase()
      );
      if (hasStyleMatch) score += 30;

      // 2. Amenities Match
      userLead.must_have_amenities.forEach((pref) => {
        // Flexible inclusion checking
        const isMatched = comm.amenities.some(
          (amenity) => amenity.toLowerCase().includes(pref.toLowerCase()) || 
                       pref.toLowerCase().includes(amenity.toLowerCase())
        );
        if (isMatched) {
          score += 15;
          matchingAmenities.push(pref);
        }
      });

      return {
        ...comm,
        score,
        matchingAmenities,
        hasStyleMatch
      };
    });

    // Sort by highest score first
    scored.sort((a, b) => b.score - a.score);
    setMatchedCommunities(scored);
  };

  // Demo simulator for taking over the chat session
  const simulateTakeover = async () => {
    if (!lead) return;
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ is_live_takeover_requested: true })
        .eq('id', lead.id)
        .select()
        .single();
      
      if (!error && data) {
        setLead(data as Lead);
        // Add a mock realtor takeover message
        await supabase.from('chat_messages').insert({
          lead_id: lead.id,
          sender: 'realtor',
          message: `Hi ${lead.name}! This is ${realtor?.name || 'Walt'}. I noticed you looking at these communities. I'm active on the line now—how can I help you find your dream home?`
        });
      }
    } catch (err) {
      console.error('Failed to simulate takeover:', err);
    }
  };

  const handleAskWaltAboutCommunity = (commName: string) => {
    setActiveQuestion(`What details can you give me about ${commName}?`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-xl font-serif font-bold text-foreground">Matching your lifestyle...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card rounded-2xl p-8 border border-border-custom editorial-shadow text-center">
          <p className="text-2xl font-serif font-bold text-red-600 mb-3">No Active Session Found</p>
          <p className="text-foreground/70 mb-8 leading-relaxed">Please complete the survey on the home page first to access your custom match portal.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary hover:bg-primary-hover text-white font-serif font-bold py-4 px-6 rounded-xl text-lg transition-colors focus:ring-4 focus:ring-primary/20 shadow-xs cursor-pointer"
          >
            Go to Survey
          </button>
        </div>
      </div>
    );
  }

  const defaultRealtorName = realtor?.name || 'Walt Wensel';

  return (
    <>
      <Head>
        <title>Your 55+ Custom Match Dashboard | 55+ Home Search</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20 relative overflow-x-clip">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border-custom py-5 px-6 sticky top-0 z-40 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-primary text-white p-2.5 rounded-xl shadow-xs">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-2xl font-serif font-black tracking-tight text-foreground">55+ HOME SEARCH</span>
                <span className="block text-xs uppercase tracking-wider font-extrabold text-foreground/50">Portal Matcher</span>
              </div>
            </div>

            {/* Realtor Host Badge */}
            {realtor && (
              <div className="flex items-center gap-4 bg-white/95 py-2 px-3.5 rounded-xl border border-border-custom shadow-2xs">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base shrink-0">
                  {realtor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[9px] font-extrabold text-primary uppercase tracking-wider">Local Expert Advisor</p>
                  <p className="text-base font-black text-foreground">{realtor.name}</p>
                </div>
                <a 
                  href={`tel:${realtor.phone}`}
                  className="bg-primary hover:bg-primary-hover text-white p-2.5 rounded-lg transition-colors flex items-center justify-center focus:ring-4 focus:ring-primary/20"
                  aria-label={`Call Realtor ${realtor.name} at ${realtor.phone}`}
                >
                  <Phone className="w-4.5 h-4.5" />
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Demo Takeover Bar */}
        <div className="bg-primary/5 border-b border-border-custom py-3 px-6 text-center flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm text-foreground/75 font-semibold">Demo Controls:</span>
          <button
            onClick={simulateTakeover}
            className="bg-primary hover:bg-primary-hover text-white font-serif font-bold py-1.5 px-4 rounded-lg text-xs tracking-wider uppercase transition-colors shadow-xs cursor-pointer focus:ring-2 focus:ring-primary/20"
          >
            Simulate Realtor Live Takeover Intercept
          </button>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 grid lg:grid-cols-12 gap-8">
                   {/* Left Area: Matches Feed (List View or Map View) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-foreground tracking-tight leading-tight">
                Welcome, {lead.name}!
              </h1>
              <p className="text-lg text-foreground/80 font-light">
                Based on your preference for a <span className="font-serif font-bold text-primary">{lead.preferred_style}</span> lifestyle, here are your matching active-adult communities in {realtor?.target_subdomain === 'york' ? 'York County' : 'Tampa Bay'}:
              </p>
            </div>

            {/* Sticky Left View Toggler Tabs */}
            <div className="sticky top-[89px] z-30 bg-background/95 backdrop-blur-xs py-3 border-b border-border-custom/50">
              <div className="bg-border-custom/45 p-1 rounded-xl flex gap-1 border border-border-custom max-w-[280px]">
                <button
                  type="button"
                  onClick={() => setLeftTab('list')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer interactive-target ${
                    leftTab === 'list'
                      ? 'bg-white text-primary shadow-2xs border border-border-custom'
                      : 'text-foreground/60 hover:text-foreground hover:bg-white/40'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  List View
                </button>
                <button
                  type="button"
                  onClick={() => setLeftTab('map')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer interactive-target ${
                    leftTab === 'map'
                      ? 'bg-white text-primary shadow-2xs border border-border-custom'
                      : 'text-foreground/60 hover:text-foreground hover:bg-white/40'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  Map View
                </button>
              </div>
            </div>

            {leftTab === 'list' ? (
              /* Communities Cards */
              <div className="space-y-8">
                {matchedCommunities.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-border-custom p-8 text-center space-y-4 editorial-shadow">
                    <p className="text-xl font-serif font-bold text-foreground">No direct matches</p>
                    <p className="text-foreground/70 text-base">We couldn't find exact criteria matches. Ask Walt in the sidebar to review all available inventory.</p>
                  </div>
                ) : (
                  matchedCommunities.map((comm) => (
                    <motion.div 
                      key={comm.id}
                      id={`comm-card-${comm.id}`}
                      onMouseEnter={() => setHighlightedCommunityId(comm.id)}
                      onMouseLeave={() => setHighlightedCommunityId(null)}
                      onClick={() => {
                        setHighlightedCommunityId(comm.id);
                      }}
                      whileHover={{ y: -3 }}
                      className={`bg-card rounded-2xl border-2 p-0 overflow-hidden relative editorial-shadow hover:shadow-md transition-all duration-300 ${
                        highlightedCommunityId === comm.id 
                          ? 'border-primary ring-2 ring-primary/10' 
                          : 'border-border-custom hover:border-primary/40'
                      }`}
                    >
                      {/* Visual Card Header Banner */}
                      {comm.image_url && (
                        <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] overflow-hidden bg-background border-b border-border-custom">
                          <img 
                            src={comm.image_url} 
                            alt={`${comm.name} visual preview`} 
                            className="w-full h-full object-cover transform hover:scale-103 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          
                          {/* Overlay home types */}
                          <div className="absolute bottom-4 left-4 bg-foreground/80 text-white font-extrabold text-[10px] tracking-wider uppercase py-1.5 px-3 rounded-lg border border-white/10 shadow-xs backdrop-blur-xs">
                            {comm.home_types[0] || 'Active-Adult'}
                          </div>
                        </div>
                      )}

                      {/* Top match score badge */}
                      <div className="absolute top-4 right-4 bg-primary text-white font-serif font-bold px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1 shadow-md z-10">
                        <Sparkles className="w-3.5 h-3.5 fill-white/25 text-white" />
                        <span>{comm.score > 40 ? 'Best Match' : 'Strong Match'}</span>
                      </div>

                      <div className="p-6 sm:p-8 space-y-6">
                        {/* Community Title */}
                        <div className="space-y-1">
                          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground leading-tight">{comm.name}</h2>
                          <p className="text-base text-foreground/60 flex items-center font-medium">
                            <MapPin className="w-4.5 h-4.5 mr-1 text-primary/60" />
                            {comm.region}
                          </p>
                        </div>

                        {/* Financial Specs Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-background p-4 rounded-xl border border-border-custom">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-foreground/50 font-extrabold">Price Range</span>
                            <span className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                              ${(comm.price_min / 1000).toFixed(0)}k - ${(comm.price_max / 1000).toFixed(0)}k
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-foreground/50 font-extrabold">HOA Inclusions</span>
                            <span className="text-xl sm:text-2xl font-serif font-bold text-primary">
                              ${comm.hoa_fee}
                              <span className="text-sm font-sans font-medium text-foreground/50">/{comm.hoa_frequency === 'monthly' ? 'mo' : comm.hoa_frequency}</span>
                            </span>
                          </div>
                        </div>

                        {/* HOA Coverages */}
                        <div className="space-y-2">
                          <span className="block text-xs uppercase tracking-wider font-extrabold text-foreground/45">Included in HOA Fee:</span>
                          <div className="flex flex-wrap gap-2">
                            {comm.hoa_inclusions.map((inc: string, idx: number) => (
                              <span 
                                key={idx}
                                className="bg-emerald-50/60 border border-emerald-200/50 text-emerald-800 text-sm font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                {inc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Amenities Checklist */}
                        <div className="space-y-2">
                          <span className="block text-xs uppercase tracking-wider font-extrabold text-foreground/45">Neighborhood Amenities:</span>
                          <div className="flex flex-wrap gap-2">
                            {comm.amenities.map((am: string, idx: number) => {
                              const isMatched = lead.must_have_amenities.includes(am);
                              return (
                                <span 
                                  key={idx}
                                  className={`text-sm font-semibold py-1.5 px-3 rounded-lg border ${
                                    isMatched 
                                      ? 'bg-primary/5 border-primary/20 text-primary ring-1 ring-primary/10' 
                                      : 'bg-background border-border-custom text-foreground/60'
                                  }`}
                                >
                                  {am} {isMatched && '⭐'}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Realtor Insider Notes */}
                        {comm.realtor_notes && (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4.5 space-y-2">
                            <span className="block text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Insider Notes from {defaultRealtorName}:
                            </span>
                            <p className="text-base text-foreground/85 leading-relaxed italic font-serif">
                              "{comm.realtor_notes}"
                            </p>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-4 border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
                          <a
                            href={comm.community_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:text-primary-hover text-base font-bold flex items-center gap-1 hover:underline py-2 focus:ring-2 focus:ring-primary/20 rounded"
                          >
                            View Listings & Floorplans
                            <ChevronRight className="w-5 h-5" />
                          </a>

                          <button
                            onClick={() => handleAskWaltAboutCommunity(comm.name)}
                            className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-serif font-bold py-3 px-6 rounded-xl text-base flex items-center justify-center gap-2 transition-colors interactive-target shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-white/80" />
                            Ask Walt about {comm.name}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              /* Map View */
              <div className="h-[750px] relative">
                <CommunityMap 
                  communities={matchedCommunities}
                  highlightedId={highlightedCommunityId}
                  onSelectCommunity={(id) => {
                    setHighlightedCommunityId(id);
                    setLeftTab('list');
                    setTimeout(() => {
                      const cardElement = document.getElementById(`comm-card-${id}`);
                      if (cardElement) {
                        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 150);
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Area: AI Sidebar Chat */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="h-[750px] relative">
                <ChatFeed 
                  leadId={lead.id} 
                  realtorName={defaultRealtorName} 
                  initialQuestion={activeQuestion}
                  lead={lead}
                  communities={communities}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
