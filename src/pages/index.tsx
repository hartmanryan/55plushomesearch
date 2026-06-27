import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Phone, 
  MapPin, 
  Shield, 
  Sparkles, 
  ThumbsUp, 
  Building,
  Lock,
  ChevronDown
} from 'lucide-react';
import { getTenantSubdomain, fetchRealtorBySubdomain, fetchCommunitiesByRealtor, Realtor, Community } from '../utils/tenant';
import { DEFAULT_REALTOR } from '../utils/supabaseClient';
import SurveyFlow from '../components/Survey/SurveyFlow';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const BackgroundMapLazy = dynamic(() => import('../components/Map/BackgroundMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#FAF9F5]" />
});

export default function Home() {
  const router = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState('york');
  const [regionName, setRegionName] = useState('York County');

  useEffect(() => {
    async function loadTenant() {
      const activeSubdomain = getTenantSubdomain();
      setSubdomain(activeSubdomain);
      
      const data = await fetchRealtorBySubdomain(activeSubdomain);
      let activeRealtor = data;
      if (!activeRealtor) {
        // Fallback to seeded default realtor for zero-config local testing
        activeRealtor = DEFAULT_REALTOR;
      }
      setRealtor(activeRealtor);

      // Fetch communities for active realtor
      const comms = await fetchCommunitiesByRealtor(activeRealtor.id);
      setCommunities(comms);
      
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

  const handleLockClick = (commName: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pending_community_redirect', `/portal?leadId=pending`);
    }
    const tenantParam = subdomain !== 'york' ? `?id=${subdomain}` : '';
    router.push(`/register${tenantParam}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-slate-600">Loading custom portal...</p>
        </div>
      </div>
    );
  }

  // Fallback state if realtor fails to load (should not happen with default fallback)
  if (!realtor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-md text-center">
          <p className="text-xl font-bold text-red-600 mb-2">Service Configuration Error</p>
          <p className="text-slate-600">This subdomain could not be verified. Please check the URL or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>55+ Home Search | Active-Adult Community Matcher</title>
        <meta 
          name="description" 
          content={`Find the perfect low-maintenance 55+ neighborhood in ${regionName}. Complete our quick, click-based lifestyle survey to match with communities today.`} 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 relative overflow-hidden">
        {/* Background Satellite Map Overlay */}
        <div className="fixed inset-0 z-0 opacity-[0.70] pointer-events-none filter brightness-70 contrast-[1.2] grayscale-[15%]">
          <BackgroundMapLazy subdomain={subdomain} zip={router.query.zip as string} />
          {/* Subtle uniform tint overlay to warm the satellite map without fading it at the bottom */}
          <div className="absolute inset-0 bg-[#FAF9F5]/12 z-10" />
        </div>

        {/* Navigation Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-border-custom py-5 px-6 sticky top-0 z-40 transition-colors relative">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-white p-2.5 rounded-xl shadow-xs">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <span className="block text-2xl font-serif font-black tracking-tight text-foreground">55+ HOME SEARCH</span>
                <span className="block text-xs uppercase tracking-wider font-extrabold text-foreground/50">Active-Adult Community Matcher</span>
              </div>
            </div>

            {/* Realtor Host Badge & View on Map Button */}
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
              <Link
                href={`/map${subdomain !== 'york' ? `?id=${subdomain}` : ''}`}
                className="text-sm font-serif font-bold text-foreground/75 hover:text-primary transition-all border-2 border-border-custom hover:border-primary/45 py-2 px-3.5 rounded-xl bg-white shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <MapPin className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>View On Map</span>
              </Link>

              <div className="flex items-center gap-4 bg-white/95 py-2.5 px-4 rounded-xl border border-border-custom shadow-2xs">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                  {realtor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider">Local Expert Advisor</p>
                  <p className="text-lg font-black text-foreground">{realtor.name}</p>
                </div>
                <a 
                  href={`tel:${realtor.phone}`}
                  className="ml-2 bg-primary hover:bg-primary-hover text-white p-2.5 rounded-lg transition-colors flex items-center justify-center focus:ring-4 focus:ring-primary/20"
                  aria-label={`Call Realtor ${realtor.name} at ${realtor.phone}`}
                >
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 lg:py-16 flex flex-col items-center justify-center text-center space-y-10 relative z-10">
          <div className="glass-panel py-8 px-8 sm:py-12 sm:px-12 rounded-2xl border border-border-custom shadow-md w-full max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-foreground tracking-tight leading-tight">
              Find your perfect 55+ lifestyle in <span className="text-primary underline decoration-primary/30 decoration-wavy underline-offset-8">{regionName}</span>
            </h1>

            <div className="pt-4">
              <Link
                href={`/register${subdomain !== 'york' ? `?id=${subdomain}` : ''}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-serif font-bold text-lg py-4 px-8 rounded-xl shadow-md transition-all scale-100 hover:scale-102 cursor-pointer focus:ring-4 focus:ring-primary/20"
              >
                <Sparkles className="w-5 h-5" />
                <span>Try Our Community Matching Wizard</span>
              </Link>
            </div>
          </div>
        </main>

        {/* Preview Catalog Section */}
        {communities.length > 0 && (
          <section className="max-w-7xl w-full mx-auto px-6 py-16 border-t border-border-custom/50 relative z-10 space-y-12">


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((comm) => (
                <div 
                  key={comm.id}
                  className="bg-card border border-border-custom rounded-2xl overflow-hidden relative editorial-shadow flex flex-col group hover:border-primary/40 hover:shadow-md transition-all duration-300"
                >
                  {/* Image Header with Blur Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-background border-b border-border-custom shrink-0">
                    {comm.image_url ? (
                      <img 
                        src={comm.image_url} 
                        alt={comm.name} 
                        className="w-full h-full object-cover transform group-hover:scale-103 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                        55+ Neighborhood
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/25 transition-colors duration-300" />
                    
                    {/* Locked Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-border-custom text-foreground font-serif font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-md">
                      <Lock className="w-3.5 h-3.5 text-primary" />
                      <span>Details Locked</span>
                    </div>

                    <div className="absolute bottom-4 left-4 text-white font-extrabold text-[10px] tracking-wider uppercase bg-foreground/80 py-1.5 px-3 rounded-lg border border-white/10 shadow-xs backdrop-blur-xs">
                      {comm.home_types[0] || 'Active-Adult'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-tight">{comm.name}</h3>
                        <p className="text-sm text-foreground/50 flex items-center font-medium mt-1">
                          <MapPin className="w-4 h-4 mr-1 text-primary/60" />
                          {comm.region}
                        </p>
                      </div>

                      {/* Locked Content placeholders */}
                      <div className="space-y-2 pt-2 border-t border-border-custom/50">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-foreground/50">Price Range</span>
                          <span className="font-semibold text-foreground">
                            ${(comm.price_min / 1000).toFixed(0)}k - ${(comm.price_max / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm filter blur-[2px] select-none opacity-60">
                          <span className="text-foreground/50">HOA Fee</span>
                          <span className="font-semibold text-foreground">$150/mo</span>
                        </div>
                        <div className="flex justify-between items-center text-sm filter blur-[2px] select-none opacity-60">
                          <span className="text-foreground/50">HOA Coverage</span>
                          <span className="font-semibold text-foreground">Lawn care, Snow removal</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLockClick(comm.name)}
                      className="w-full mt-6 bg-white hover:bg-primary/5 text-primary border-2 border-primary/20 hover:border-primary/50 font-serif font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer focus:ring-4 focus:ring-primary/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Unlock Details & Learn More</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Area with Real Estate Licensing Information */}
        <footer className="bg-white/95 backdrop-blur-md border-t border-border-custom mt-16 py-12 px-6 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div>
                <p className="text-lg font-serif font-bold text-foreground">55plushomesearch.com</p>
                <p className="text-sm text-foreground/80 mt-2">
                  An independent lead generation and property matching service powered by Antigravity AI.
                </p>
              </div>

              <div className="text-left md:text-right text-xs text-foreground/80 space-y-2">
                <p className="font-extrabold text-foreground text-sm">Real Estate Brokerage Disclosure</p>
                <p>
                  Hosted by {realtor.name}. All real estate transactions, tours, and pricing consultations are handled directly by {realtor.name}, a licensed real estate professional.
                </p>
                <p>
                  Information is deemed reliable but not guaranteed. Monthly HOA fees, amenities lists, and property values are subject to change.
                </p>
              </div>
            </div>

            <div className="border-t border-border-custom pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-foreground/60">
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                <span className="inline-block border border-border-custom px-2 py-0.5 rounded font-bold uppercase">Equal Housing Opportunity</span>
                <span className="inline-block border border-border-custom px-2 py-0.5 rounded font-bold uppercase">REALTOR®</span>
                <span className="text-foreground/30">|</span>
                <Link href="/login" className="hover:text-primary transition-colors font-bold uppercase cursor-pointer">
                  Agent Login
                </Link>
              </div>
              <p>© {new Date().getFullYear()} 55+ Home Search. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
