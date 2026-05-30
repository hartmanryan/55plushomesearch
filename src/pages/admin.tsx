import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { 
  Building, 
  Users, 
  MapPin, 
  Plus, 
  MessageSquare,
  Trash2,
  Send,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getTenantSubdomain, fetchRealtorBySubdomain, fetchCommunitiesByRealtor, Realtor, Community } from '../utils/tenant';
import { DEFAULT_REALTOR } from '../utils/supabaseClient';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  moving_timeline: string;
  budget_max: number;
  preferred_style: string;
  must_have_amenities: string[];
  bedrooms?: number;
  bathrooms?: number;
  is_live_takeover_requested: boolean;
  current_residence?: string;
  created_at: string;
}

export default function Admin() {
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'communities'>('leads');

  // Takeover chat console state
  const [activeTakeoverLead, setActiveTakeoverLead] = useState<Lead | null>(null);
  const [takeoverMessages, setTakeoverMessages] = useState<any[]>([]);
  const [takeoverInput, setTakeoverInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // New community form state
  const [isAddingCommunity, setIsAddingCommunity] = useState(false);
  const [newCommName, setNewCommName] = useState('');
  const [newCommRegion, setNewCommRegion] = useState('');
  const [newCommPriceMin, setNewCommPriceMin] = useState(250000);
  const [newCommPriceMax, setNewCommPriceMax] = useState(500000);
  const [newCommHoaFee, setNewCommHoaFee] = useState(200);
  const [newCommHoaFreq, setNewCommHoaFreq] = useState('monthly');
  const [newCommHoaInclusions, setNewCommHoaInclusions] = useState<string[]>(['Lawn care', 'Snow removal']);
  const [newCommAmenities, setNewCommAmenities] = useState<string[]>(['Clubhouse & Social Calendar', 'Pool & Fitness Facility']);
  const [newCommHomeTypes, setNewCommHomeTypes] = useState<string[]>(['Single-Family Detached']);
  const [newCommNotes, setNewCommNotes] = useState('');
  const [newCommUrl, setNewCommUrl] = useState('#');
  const [newCommImageUrl, setNewCommImageUrl] = useState('');
  const [newCommLatitude, setNewCommLatitude] = useState<number | ''>('');
  const [newCommLongitude, setNewCommLongitude] = useState<number | ''>('');

  // Load all assets
  const loadAdminData = async () => {
    try {
      const subdomain = getTenantSubdomain();
      let activeRealtor = await fetchRealtorBySubdomain(subdomain);
      
      if (!activeRealtor) {
        // Fallback for zero-config local development
        activeRealtor = DEFAULT_REALTOR;
      }
      setRealtor(activeRealtor);

      // Fetch Communities
      const comms = await fetchCommunitiesByRealtor(activeRealtor.id);
      setCommunities(comms);

      // Fetch Leads
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('realtor_id', activeRealtor.id)
        .order('created_at', { ascending: false });
      
      if (!leadError && leadData) {
        setLeads(leadData as Lead[]);
      }

    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    // Poll for lead and message updates to keep live takeover synchronized
    const interval = setInterval(loadAdminData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync takeover messages when active lead changes or updates
  const fetchTakeoverMessages = async () => {
    if (!activeTakeoverLead) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('lead_id', activeTakeoverLead.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setTakeoverMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat logs for takeover:', err);
    }
  };

  useEffect(() => {
    fetchTakeoverMessages();
    const interval = setInterval(fetchTakeoverMessages, 3000);
    return () => clearInterval(interval);
  }, [activeTakeoverLead]);

  // Handle Realtor Live Message dispatch
  const handleSendTakeoverMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTakeoverLead || !takeoverInput.trim()) return;

    setSendingMessage(true);
    const text = takeoverInput.trim();
    setTakeoverInput('');

    try {
      // 1. Insert Realtor message to DB logs
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          lead_id: activeTakeoverLead.id,
          sender: 'realtor',
          message: text
        });

      if (error) throw error;

      // 2. Explicitly flag lead as taken over
      await supabase
        .from('leads')
        .update({ is_live_takeover_requested: true })
        .eq('id', activeTakeoverLead.id);

      fetchTakeoverMessages();
    } catch (err) {
      console.error('Failed to insert takeover message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Terminate takeover, hand back to AI
  const handleReleaseTakeover = async () => {
    if (!activeTakeoverLead) return;
    try {
      await supabase
        .from('leads')
        .update({ is_live_takeover_requested: false })
        .eq('id', activeTakeoverLead.id);
      
      setActiveTakeoverLead(null);
      loadAdminData();
    } catch (err) {
      console.error('Failed to release takeover:', err);
    }
  };

  // Add community asset
  const handleAddCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realtor) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('communities')
        .insert({
          realtor_id: realtor.id,
          name: newCommName,
          region: newCommRegion,
          price_min: newCommPriceMin,
          price_max: newCommPriceMax,
          hoa_fee: newCommHoaFee,
          hoa_frequency: newCommHoaFreq,
          hoa_inclusions: newCommHoaInclusions,
          amenities: newCommAmenities,
          home_types: newCommHomeTypes,
          realtor_notes: newCommNotes,
          community_url: newCommUrl,
          image_url: newCommImageUrl || undefined,
          latitude: newCommLatitude !== '' ? newCommLatitude : undefined,
          longitude: newCommLongitude !== '' ? newCommLongitude : undefined
        });

      if (!error) {
        setIsAddingCommunity(false);
        // Clear fields
        setNewCommName('');
        setNewCommRegion('');
        setNewCommNotes('');
        setNewCommImageUrl('');
        setNewCommLatitude('');
        setNewCommLongitude('');
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to add community:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete community asset
  const handleDeleteCommunity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community asset?')) return;
    setLoading(true);
    try {
      await supabase
        .from('communities')
        .delete()
        .eq('id', id);
      loadAdminData();
    } catch (err) {
      console.error('Failed to delete community:', err);
      setLoading(false);
    }
  };

  // Amenities and inclusions available
  const availableAmenities = [
    'Clubhouse & Social Calendar',
    'Pickleball & Tennis Courts',
    'Pool & Fitness Facility',
    'Lawn Care & Snow Removal Included'
  ];

  const availableInclusions = [
    'Lawn care',
    'Snow removal',
    'Exterior building maintenance',
    'Common area maintenance',
    'Roof repair',
    'Insurance'
  ];

  const availableHomeStyles = [
    'Single-Family Detached',
    'Low-Maintenance Townhome / Villa',
    'Condo / Penthouse Layout'
  ];

  if (loading && !realtor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl font-serif font-bold text-foreground">Loading Broker Panel...</p>
        </div>
      </div>
    );
  }

  const takeoverRequests = leads.filter(l => l.is_live_takeover_requested);

  return (
    <>
      <Head>
        <title>Subscriber Admin Dashboard | 55+ Home Search</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-primary/20">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-border-custom py-5 px-6 sticky top-0 z-40 relative">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-white p-2.5 rounded-xl shadow-xs">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-2xl font-serif font-black tracking-tight text-foreground">BROKER CONSOLE</span>
                <span className="block text-xs uppercase tracking-wider font-extrabold text-foreground/50">55plushomesearch.com</span>
              </div>
            </div>

            {realtor && (
              <div className="flex items-center gap-4 bg-white/95 py-2 px-3.5 rounded-xl border border-border-custom shadow-2xs">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base shrink-0">
                  {realtor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[9px] font-extrabold text-primary uppercase tracking-wider">Local Advisor Account</p>
                  <p className="text-base font-black text-foreground">{realtor.name}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stats and Layout */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border-custom editorial-shadow flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-foreground/50">Total Leads Captured</span>
                <span className="text-3xl font-serif font-black text-foreground mt-1 block">{leads.length}</span>
              </div>
              <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                <Users className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border-custom editorial-shadow flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-foreground/50">Takeover Requests</span>
                <span className="text-3xl font-serif font-black text-amber-700 mt-1 block flex items-center gap-2">
                  {takeoverRequests.length}
                  {takeoverRequests.length > 0 && (
                    <span className="w-3.5 h-3.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                  )}
                </span>
              </div>
              <div className="p-4 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl">
                <MessageSquare className="w-7 h-7" />
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border-custom editorial-shadow flex items-center justify-between">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-foreground/50">Community Assets</span>
                <span className="text-3xl font-serif font-black text-foreground mt-1 block">{communities.length}</span>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-xl">
                <Building className="w-7 h-7" />
              </div>
            </div>
          </div>

          {/* Action Tabs selector like on portal */}
          <div className="bg-border-custom/40 p-1.5 rounded-2xl flex gap-1.5 border border-border-custom max-w-md">
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex-1 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer interactive-target ${
                activeTab === 'leads'
                  ? 'bg-white text-primary shadow-2xs border border-border-custom'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/40'
              }`}
            >
              <Users className="w-5 h-5" />
              Lead Stream
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`flex-1 py-3 px-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all cursor-pointer interactive-target ${
                activeTab === 'communities'
                  ? 'bg-white text-primary shadow-2xs border border-border-custom'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/40'
              }`}
            >
              <Building className="w-5 h-5" />
              Community Directory
            </button>
          </div>

          {/* TAB 1: Leads Directory */}
          {activeTab === 'leads' && (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Leads Table */}
              <div className={`space-y-4 ${activeTakeoverLead ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
                <div className="bg-card rounded-2xl border border-border-custom editorial-shadow overflow-hidden">
                  <div className="p-6 border-b border-border-custom bg-[#FAF9F5]/50 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-foreground">Active Contacts</h3>
                  </div>

                  {leads.length === 0 ? (
                    <div className="p-8 text-center text-foreground/50 font-light">No leads captured yet. Run your Google Ads campaigns to test pipeline!</div>
                  ) : (
                    <div className="divide-y divide-border-custom overflow-x-auto">
                      {leads.map((lead) => (
                        <div 
                          key={lead.id}
                          className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                            lead.is_live_takeover_requested ? 'bg-amber-50/30' : 'hover:bg-[#FAF9F5]/40'
                          } ${activeTakeoverLead?.id === lead.id ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xl font-serif font-bold text-foreground">{lead.name}</span>
                              {lead.is_live_takeover_requested && (
                                <span className="bg-amber-50 text-amber-800 text-xs font-black uppercase tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1.5 border border-amber-200/50 animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Takeover Request
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-foreground/60 flex flex-wrap gap-x-4">
                              <span>Email: {lead.email}</span>
                              <span>Phone: {lead.phone}</span>
                            </div>

                            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold">
                              <span className="bg-primary/10 text-primary border border-primary/20 py-1 px-2.5 rounded">Timeline: {lead.moving_timeline}</span>
                              <span className="bg-foreground/5 text-foreground/80 border border-border-custom py-1 px-2.5 rounded">Style: {lead.preferred_style}</span>
                              {lead.current_residence && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200/50 py-1 px-2.5 rounded">Residence: {lead.current_residence}</span>
                              )}
                              {lead.bedrooms && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/50 py-1 px-2.5 rounded">Beds: {lead.bedrooms}</span>
                              )}
                              {lead.bathrooms && (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/50 py-1 px-2.5 rounded">Baths: {lead.bathrooms}</span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex gap-2">
                            <button
                              onClick={() => setActiveTakeoverLead(lead)}
                              className={`py-2 px-4 rounded-lg font-serif font-bold text-sm flex items-center gap-1.5 shadow-xs transition-colors focus:ring-4 ${
                                lead.is_live_takeover_requested
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-200'
                                  : 'bg-primary hover:bg-primary-hover text-white focus:ring-primary/20'
                              }`}
                            >
                              <MessageSquare className="w-4.5 h-4.5" />
                              Intercept Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Intercept Terminal */}
              {activeTakeoverLead && (
                <div className="lg:col-span-6 bg-card border border-border-custom rounded-2xl editorial-shadow overflow-hidden flex flex-col h-[650px] sticky top-24">
                  {/* Console Header */}
                  <div className="bg-foreground text-white p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                        <span>Live Session Intercept:</span>
                        <span className="text-primary">{activeTakeoverLead.name}</span>
                      </h3>
                      <p className="text-sm text-white/50">Timeline: {activeTakeoverLead.moving_timeline} • Style: {activeTakeoverLead.preferred_style}</p>
                    </div>
                    <button
                      onClick={handleReleaseTakeover}
                      className="bg-red-600 hover:bg-red-700 text-white font-serif font-bold py-1.5 px-3 rounded-lg text-xs transition-colors focus:ring-2 focus:ring-red-300"
                    >
                      Release to AI
                    </button>
                  </div>

                  {/* Messages Stream */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF9F5]/40">
                    {takeoverMessages.map((msg, idx) => {
                      const isRealtor = msg.sender === 'realtor';
                      const isUser = msg.sender === 'user';
                      
                      return (
                        <div
                          key={idx}
                          className={`flex ${isRealtor ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`p-3.5 rounded-xl max-w-[85%] text-base leading-relaxed ${
                              isRealtor
                                ? 'bg-primary text-white rounded-br-none shadow-xs'
                                : isUser
                                ? 'bg-foreground text-white rounded-bl-none shadow-xs'
                                : 'bg-white border border-border-custom text-foreground rounded-bl-none shadow-xs'
                            }`}
                          >
                            <span className={`block text-xs uppercase font-extrabold mb-1 ${
                              isRealtor || isUser ? 'text-white/60' : 'text-foreground/50'
                            }`}>
                              {isRealtor ? 'You (Realtor)' : isUser ? 'Lead (Customer)' : 'Walt55 (AI)'}
                            </span>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input Form */}
                  <form 
                    onSubmit={handleSendTakeoverMessage}
                    className="p-4 border-t border-border-custom bg-white flex gap-3"
                  >
                    <input
                      type="text"
                      value={takeoverInput}
                      onChange={(e) => setTakeoverInput(e.target.value)}
                      placeholder={`Reply directly to ${activeTakeoverLead.name}...`}
                      className="flex-1 border border-border-custom py-3 px-4 rounded-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-[#FAF9F5]/30 text-base text-foreground placeholder:text-foreground/40"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !takeoverInput.trim()}
                      className="bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white p-3 px-5 rounded-xl transition-colors font-serif font-bold flex items-center gap-1.5 shadow-xs focus:ring-4 focus:ring-primary/20"
                    >
                      <span>Send</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Communities Manager */}
          {activeTab === 'communities' && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border-custom editorial-shadow">
                <h3 className="text-xl font-serif font-bold text-foreground">Community Asset Curations</h3>
                <button
                  onClick={() => setIsAddingCommunity(!isAddingCommunity)}
                  className="bg-primary hover:bg-primary-hover text-white font-serif font-bold py-2.5 px-5 rounded-lg text-base flex items-center gap-1.5 shadow-xs transition-colors focus:ring-4 focus:ring-primary/20"
                >
                  <Plus className="w-5 h-5" />
                  Add Community Asset
                </button>
              </div>

              {/* Add Community Form Block */}
              {isAddingCommunity && (
                <form 
                  onSubmit={handleAddCommunitySubmit}
                  className="bg-card rounded-2xl border border-border-custom p-6 sm:p-8 space-y-6 editorial-shadow"
                >
                  <h4 className="text-2xl font-serif font-bold text-foreground border-b border-border-custom pb-3">New Community Asset Configuration</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Community Name</label>
                      <input
                        type="text"
                        value={newCommName}
                        onChange={(e) => setNewCommName(e.target.value)}
                        placeholder="e.g. Traditions at York"
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Region/Location</label>
                      <input
                        type="text"
                        value={newCommRegion}
                        onChange={(e) => setNewCommRegion(e.target.value)}
                        placeholder="e.g. York County"
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Minimum Price ($)</label>
                      <input
                        type="number"
                        value={newCommPriceMin}
                        onChange={(e) => setNewCommPriceMin(Number(e.target.value))}
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Maximum Price ($)</label>
                      <input
                        type="number"
                        value={newCommPriceMax}
                        onChange={(e) => setNewCommPriceMax(Number(e.target.value))}
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">HOA Fee ($)</label>
                      <input
                        type="number"
                        value={newCommHoaFee}
                        onChange={(e) => setNewCommHoaFee(Number(e.target.value))}
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">HOA Frequency</label>
                      <select
                        value={newCommHoaFreq}
                        onChange={(e) => setNewCommHoaFreq(e.target.value)}
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-white focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Image URL</label>
                      <input
                        type="text"
                        value={newCommImageUrl}
                        onChange={(e) => setNewCommImageUrl(e.target.value)}
                        placeholder="e.g. /traditions_york_exterior.png"
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCommLatitude}
                        onChange={(e) => setNewCommLatitude(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 39.980"
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newCommLongitude}
                        onChange={(e) => setNewCommLongitude(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. -76.710"
                        className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                      />
                    </div>
                  </div>

                  {/* Home styles checkboxes */}
                  <div className="space-y-2">
                    <label className="block text-base font-bold text-foreground">Home Styles Offered</label>
                    <div className="flex flex-wrap gap-4">
                      {availableHomeStyles.map((style) => (
                        <label key={style} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCommHomeTypes.includes(style)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCommHomeTypes([...newCommHomeTypes, style]);
                              } else {
                                setNewCommHomeTypes(newCommHomeTypes.filter(s => s !== style));
                              }
                            }}
                            className="w-5 h-5 text-primary rounded cursor-pointer accent-primary"
                          />
                          <span className="text-base text-foreground/80">{style}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* HOA Inclusions checklist */}
                  <div className="space-y-2">
                    <label className="block text-base font-bold text-foreground">HOA Inclusions</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {availableInclusions.map((inclusion) => (
                        <label key={inclusion} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCommHoaInclusions.includes(inclusion)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCommHoaInclusions([...newCommHoaInclusions, inclusion]);
                              } else {
                                setNewCommHoaInclusions(newCommHoaInclusions.filter(i => i !== inclusion));
                              }
                            }}
                            className="w-5 h-5 text-primary rounded cursor-pointer accent-primary"
                          />
                          <span className="text-base text-foreground/80">{inclusion}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Amenities checklist */}
                  <div className="space-y-2">
                    <label className="block text-base font-bold text-foreground">Amenities Offered</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {availableAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCommAmenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCommAmenities([...newCommAmenities, amenity]);
                              } else {
                                setNewCommAmenities(newCommAmenities.filter(a => a !== amenity));
                              }
                            }}
                            className="w-5 h-5 text-primary rounded cursor-pointer accent-primary"
                          />
                          <span className="text-base text-foreground/80">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-foreground mb-1">Qualitative Realtor Insights (Grounded AI Context)</label>
                    <textarea
                      value={newCommNotes}
                      onChange={(e) => setNewCommNotes(e.target.value)}
                      placeholder="Explain neighborhood culture, resident demographics, golf-cart friendliness, social committee calendar context, or special access facts..."
                      rows={4}
                      className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-foreground mb-1">Listing URL</label>
                    <input
                      type="text"
                      value={newCommUrl}
                      onChange={(e) => setNewCommUrl(e.target.value)}
                      className="w-full border border-border-custom p-3 rounded-lg text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                    />
                  </div>

                  <div className="flex justify-end gap-3 border-t border-border-custom pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingCommunity(false)}
                      className="py-2.5 px-5 rounded-lg border border-border-custom font-serif font-bold text-foreground hover:bg-[#FAF9F5] text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white font-serif font-bold text-base shadow-xs focus:ring-4 focus:ring-primary/20"
                    >
                      Save Asset
                    </button>
                  </div>
                </form>
              )}

              {/* Communities Directory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {communities.map((comm) => (
                  <div key={comm.id} className="bg-card border border-border-custom rounded-2xl overflow-hidden editorial-shadow hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col">
                    {comm.image_url && (
                      <div className="relative h-48 w-full bg-[#FAF9F5] border-b border-border-custom shrink-0 overflow-hidden">
                        <img 
                          src={comm.image_url} 
                          alt={comm.name} 
                          className="w-full h-full object-cover transform hover:scale-103 transition-transform duration-700 ease-out"
                        />
                      </div>
                    )}
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xl font-serif font-bold text-foreground leading-tight">{comm.name}</h4>
                          <div className="text-sm text-foreground/60 font-semibold flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1 text-primary/60" />
                              {comm.region}
                            </span>
                            {comm.latitude && comm.longitude && (
                              <span className="text-xs text-primary font-bold bg-primary/10 border border-primary/20 py-0.5 px-2 rounded">
                                GPS: {comm.latitude.toFixed(4)}, {comm.longitude.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCommunity(comm.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors focus:ring-2 focus:ring-red-200"
                          title="Delete community asset"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-[#FAF9F5] p-3 rounded-xl border border-border-custom text-sm">
                        <div>
                          <span className="block text-[10px] uppercase text-foreground/50 font-extrabold">Price Spectrum</span>
                          <span className="font-serif font-bold text-foreground">${(comm.price_min / 1000).toFixed(0)}k - ${(comm.price_max / 1000).toFixed(0)}k</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-foreground/50 font-extrabold">HOA Inclusions</span>
                          <span className="font-serif font-bold text-primary">${comm.hoa_fee}/{comm.hoa_frequency === 'monthly' ? 'mo' : comm.hoa_frequency}</span>
                        </div>
                      </div>

                      {/* Expose Realtor qualitative notes directly on the card */}
                      <div className="text-sm border-t border-border-custom pt-3 flex-1">
                        <span className="block font-extrabold text-foreground/45 uppercase tracking-wider text-xs mb-1">Qualitative AI Grounding Notes:</span>
                        <p className="text-foreground/80 italic font-serif leading-relaxed">
                          &quot;{comm.realtor_notes || 'No qualitative notes provided. Add comments to help Walt55 answer community specific questions.'}&quot;
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {comm.amenities.map((am: string, idx: number) => (
                          <span key={idx} className="bg-[#FAF9F5] text-foreground/60 border border-border-custom py-1 px-2.5 rounded text-xs font-semibold">
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
