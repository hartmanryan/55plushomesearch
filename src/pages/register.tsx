import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Phone, Building, ArrowLeft } from 'lucide-react';
import { getTenantSubdomain, fetchRealtorBySubdomain, Realtor } from '../utils/tenant';
import { DEFAULT_REALTOR } from '../utils/supabaseClient';
import SurveyFlow from '../components/Survey/SurveyFlow';
import dynamic from 'next/dynamic';

const BackgroundMapLazy = dynamic(() => import('../components/Map/BackgroundMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#FAF9F5]" />
});

export default function Register() {
  const router = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
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
        activeRealtor = DEFAULT_REALTOR;
      }
      setRealtor(activeRealtor);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl font-medium text-slate-600 font-serif">Loading lifestyle survey...</p>
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
  const homeUrl = `/${tenantParam}`;

  return (
    <>
      <Head>
        <title>Unlock 55+ Details | Active-Adult Community Matcher</title>
        <meta 
          name="description" 
          content="Register to unlock pricing, HOA coverages, layouts, and interactive mapping details." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
        {/* Background Satellite Map Overlay */}
        <div className="fixed inset-0 z-0 opacity-[0.70] pointer-events-none filter brightness-70 contrast-[1.2] grayscale-[15%]">
          <BackgroundMapLazy subdomain={subdomain} zip={router.query.zip as string} />
          <div className="absolute inset-0 bg-[#FAF9F5]/12 z-10" />
        </div>

        {/* Navigation Bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-border-custom py-4 px-6 sticky top-0 z-40 relative shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href={homeUrl}
                className="flex items-center gap-1.5 text-sm font-bold text-foreground/75 hover:text-primary transition-colors border border-border-custom py-2 px-3.5 rounded-lg bg-white shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <div className="h-6 w-px bg-border-custom hidden sm:block" />
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-white p-2 rounded-lg shadow-2xs">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-lg font-serif font-black tracking-tight text-foreground leading-none">55+ HOME SEARCH</span>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-foreground/45 mt-0.5">Active-Adult Community Matcher</span>
                </div>
              </div>
            </div>

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
                className="ml-1 bg-primary hover:bg-primary-hover text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                aria-label={`Call Realtor ${realtor.name} at ${realtor.phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Main Content Area containing the Questionnaire */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center relative z-10">
          <div className="w-full">
            <SurveyFlow realtor={realtor} />
          </div>
        </main>
      </div>
    </>
  );
}
