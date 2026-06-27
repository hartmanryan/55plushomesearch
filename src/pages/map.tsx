import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Building,
  Phone,
  ArrowLeft,
  Search,
  Loader2,
  MapPin
} from 'lucide-react';
import { getTenantSubdomain, fetchRealtorBySubdomain, fetchCommunitiesByRealtor, Realtor, Community } from '../utils/tenant';
import { DEFAULT_REALTOR } from '../utils/supabaseClient';
import dynamic from 'next/dynamic';

const CommunityMap = dynamic(() => import('../components/Map/CommunityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#FAF9F5] flex items-center justify-center border border-border-custom rounded-2xl">
      <p className="text-slate-400 font-bold text-base animate-pulse">Loading interactive map...</p>
    </div>
  )
});

export default function MapPage() {
  const router = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState('york');
  const [regionName, setRegionName] = useState('York County');

  // Registration Access State
  const [isRegistered, setIsRegistered] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [searchZoom, setSearchZoom] = useState<number | undefined>(undefined);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSearchCenter([lat, lon]);
        setSearchZoom(12);
      } else {
        // Fallback local search
        const lowerQuery = searchQuery.toLowerCase();
        const foundLocal = communities.find(c => 
          c.region.toLowerCase().includes(lowerQuery) || 
          c.name.toLowerCase().includes(lowerQuery)
        );
        if (foundLocal && foundLocal.latitude && foundLocal.longitude) {
          setSearchCenter([foundLocal.latitude, foundLocal.longitude]);
          setSearchZoom(12);
        } else {
          setSearchError('Location not found. Try entering a city and state (e.g. York, PA).');
        }
      }
    } catch (err) {
      // Fallback local search
      const lowerQuery = searchQuery.toLowerCase();
      const foundLocal = communities.find(c => 
        c.region.toLowerCase().includes(lowerQuery) || 
        c.name.toLowerCase().includes(lowerQuery)
      );
      if (foundLocal && foundLocal.latitude && foundLocal.longitude) {
        setSearchCenter([foundLocal.latitude, foundLocal.longitude]);
        setSearchZoom(12);
      } else {
        setSearchError('Search failed. Please try again.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    async function loadTenant() {
      const activeSubdomain = getTenantSubdomain();
      setSubdomain(activeSubdomain);
      
      const data = await fetchRealtorBySubdomain(activeSubdomain);
      let activeRealtor = data;
      if (!activeRealtor) {
        activeRealtor = DEFAULT_REALTOR;
      }
      setRealtor(activeRealtor);

      const comms = await fetchCommunitiesByRealtor(activeRealtor.id);
      setCommunities(comms);

      // Check registration
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const leadIdParam = urlParams.get('leadId');
        const storedLeadId = localStorage.getItem('registered_lead_id');
        if (leadIdParam || storedLeadId) {
          setIsRegistered(true);
        }
      }
      
      setLoading(false);
    }
    loadTenant();
  }, []);

  useEffect(() => {
    const activeSubdomain = getTenantSubdomain();
    const defaultRegion = realtor?.default_area || (activeSubdomain === 'york' ? 'York County' : 'Tampa Bay');
    
    if (router.isReady) {
      if (router.query.area) {
        setRegionName(router.query.area as string);
      } else {
        setRegionName(defaultRegion);
      }
    } else {
      setRegionName(defaultRegion);
    }
  }, [router.isReady, router.query.area, subdomain, realtor]);

  // Setup tenant configurations on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl font-medium text-slate-600 font-serif">Loading Map View...</p>
        </div>
      </div>
    );
  }

  if (!realtor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-md text-center">
          <p className="text-xl font-bold text-red-600 mb-2">Service Configuration Error</p>
          <p className="text-slate-600">Could not resolve advisor configuration. Please check the URL.</p>
        </div>
      </div>
    );
  }

  const tenantParam = subdomain !== 'york' ? `?id=${subdomain}` : '';
  const surveyUrl = `/${tenantParam}`;

  return (
    <>
      <Head>
        <title>Interactive Community Map | 55+ Home Search</title>
        <meta 
          name="description" 
          content={`Browse our interactive map of active-adult 55+ communities in the ${regionName} area.`} 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
        {/* Navigation Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-border-custom py-4 px-6 sticky top-0 z-40 relative shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo and Back Button */}
            <div className="flex items-center space-x-4">
              <Link
                href={surveyUrl}
                className="flex items-center gap-1.5 text-sm font-bold text-foreground/75 hover:text-primary transition-colors border border-border-custom py-2 px-3.5 rounded-lg bg-white shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Survey</span>
              </Link>
              <div className="h-6 w-px bg-border-custom hidden sm:block" />
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-white p-2 rounded-lg shadow-2xs">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-lg font-serif font-black tracking-tight text-foreground leading-none">55+ HOME SEARCH</span>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-foreground/45 mt-0.5">Community Explorer Map</span>
                </div>
              </div>
            </div>

            {/* Realtor Host Badge */}
            <div className="flex items-center gap-3 bg-white/95 py-1.5 px-3.5 rounded-xl border border-border-custom shadow-2xs">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                {realtor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left">
                <p className="text-[8px] font-extrabold text-primary uppercase tracking-wider">Your Local Advisor</p>
                <p className="text-sm font-black text-foreground leading-none mt-0.5">{realtor.name}</p>
              </div>
              <a 
                href={`tel:${realtor.phone}`}
                className="ml-1 bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors flex items-center justify-center focus:ring-4 focus:ring-primary/20"
                aria-label={`Call Realtor ${realtor.name} at ${realtor.phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Map Container - fills the viewport height */}
        <main className="flex-1 w-full p-4 md:p-6 bg-slate-50 relative flex flex-col space-y-4">
          {/* Geocoding Search Bar */}
          <div className="w-full max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2 bg-white p-2 rounded-xl border-2 border-border-custom focus-within:border-primary transition-all shadow-2xs">
              <div className="flex-1 flex items-center px-2">
                <Search className="w-5 h-5 text-foreground/45 mr-2" />
                <input
                  type="text"
                  placeholder="Zoom to city & state... (e.g. York, PA)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-base focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-serif font-bold py-2 px-5 rounded-lg text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                {searchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </form>
            {searchError && (
              <p className="text-red-600 text-xs mt-1.5 px-3 font-semibold">{searchError}</p>
            )}
          </div>

          <div className="w-full h-[calc(100vh-190px)] sm:h-[calc(100vh-170px)] rounded-2xl overflow-hidden shadow-sm border border-border-custom bg-white">
            {communities.length > 0 ? (
              <CommunityMap 
                communities={communities} 
                highlightedId={null} 
                isRegistered={isRegistered}
                onRequestRegistration={(url) => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('pending_community_redirect', url);
                  }
                  const tenantParam = subdomain !== 'york' ? `?id=${subdomain}` : '';
                  router.push(`/register${tenantParam}`);
                }}
                searchCenter={searchCenter}
                searchZoom={searchZoom}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-slate-400 font-bold font-serif text-lg">No active communities found for this region.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
