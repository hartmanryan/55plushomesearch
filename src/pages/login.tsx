import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Building, Mail, Sparkles, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isMockClient, SUPERADMIN_EMAILS } from '../utils/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Mock simulation states
  const [isMockSent, setIsMockSent] = useState(false);
  const [mockRealtor, setMockRealtor] = useState<any | null>(null);

  // Clear states when input changes
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsMockSent(false);
    setMockRealtor(null);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    setLoading(true);

    try {
      // 1. Fetch realtors to see if this email exists in our records
      const { data: realtors, error: rError } = await supabase
        .from('realtors')
        .select('*');

      if (rError) throw rError;

      const isSuperadmin = SUPERADMIN_EMAILS.includes(targetEmail);
      let matched = (realtors || []).find((r: any) => r.email.toLowerCase() === targetEmail);

      if (!matched && isSuperadmin) {
        // Virtual realtor object for Superadmin login
        matched = {
          id: 'superadmin-ryan-hartman-id',
          name: 'Ryan Hartman',
          email: targetEmail,
          target_subdomain: 'york', // Default landing subdomain
          role: 'superadmin'
        };
      }

      if (!matched) {
        setErrorMsg('This email is not registered as an active advisor.');
        setLoading(false);
        return;
      }

      // 2. Dispatch OTP / Magic Link
      if (isMockClient) {
        // Mock Mode: Show simulation option
        setIsMockSent(true);
        setMockRealtor(matched);
        setSuccessMsg(`Mock Magic Link successfully sent to ${targetEmail}!`);
      } else {
        // Production Mode: Trigger real Supabase Magic Link email
        const { error } = await supabase.auth.signInWithOtp({
          email: targetEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`
          }
        });

        if (error) throw error;
        setSuccessMsg(`Magic Link successfully sent to ${targetEmail}! Check your inbox.`);
      }

    } catch (err: any) {
      console.error('Failed to request magic link login:', err);
      setErrorMsg('An error occurred while sending your login link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateClick = () => {
    if (!mockRealtor) return;

    // Simulate callback auth session registration
    const mockSession = {
      access_token: mockRealtor.role === 'superadmin'
        ? 'mock-session-jwt-token-id-55plus-superadmin'
        : 'mock-session-jwt-token-id-55plus',
      user: {
        id: mockRealtor.id,
        email: mockRealtor.email,
        user_metadata: {
          name: mockRealtor.name,
          role: mockRealtor.role || 'realtor'
        }
      }
    };

    localStorage.setItem('55plus_auth_session', JSON.stringify(mockSession));
    router.push(`/admin?ref=${mockRealtor.ref_id || 1}`);
  };

  return (
    <>
      <Head>
        <title>Broker Console Login | 55+ Home Search</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] aspect-square rounded-full bg-primary/3 filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[65%] aspect-square rounded-full bg-primary/4 filter blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Logo Heading */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-primary text-white p-3.5 rounded-2xl shadow-md">
              <Building className="w-9 h-9" />
            </div>
            <div>
              <span className="block text-3xl font-serif font-black tracking-tight text-foreground">BROKER CONSOLE</span>
              <span className="block text-sm uppercase tracking-wider font-extrabold text-foreground/45 mt-1">55plushomesearch.com</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card border border-border-custom rounded-2xl p-8 sm:p-10 space-y-6 editorial-shadow">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-serif font-bold text-foreground">Advisor Login</h1>
              <p className="text-base text-foreground/60 leading-relaxed font-light">Enter your email address to receive a secure, passwordless Magic Link to enter your console.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-extrabold text-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-foreground/40">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. walt@retiretopa.com"
                    className="w-full border-2 border-border-custom pl-11 pr-4 py-3.5 rounded-xl text-base bg-[#FAF9F5]/30 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                    disabled={loading || isMockSent}
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200/50 text-red-800 p-4 rounded-xl text-sm font-semibold flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {!isMockSent && (
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-serif font-bold py-4 px-6 rounded-xl text-base flex items-center justify-center gap-2 transition-colors interactive-target shadow-xs cursor-pointer focus:ring-4 focus:ring-primary/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* Simulated Email Client Inbox for Mock Simulation testing */}
            <AnimatePresence>
              {isMockSent && mockRealtor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-2 border-dashed border-primary/30 bg-primary/3 p-5 rounded-xl space-y-4 text-center overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>Mock Email Simulator</span>
                  </div>
                  
                  <div className="text-sm text-foreground/80 leading-relaxed font-light">
                    You are in **Local Demo Mode** (no Supabase keys). We simulated dispatching a magic link email to **{mockRealtor.email}**. Click below to mock checking your mail:
                  </div>

                  <button
                    onClick={handleSimulateClick}
                    className="w-full bg-white hover:bg-primary/5 text-primary border-2 border-primary/20 hover:border-primary/50 font-serif font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer focus:ring-4 focus:ring-primary/20"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-primary" />
                    <span>Simulate Login Link Click & Enter Console</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
