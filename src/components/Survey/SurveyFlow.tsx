import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Home, 
  Building2, 
  Building, 
  Users, 
  Activity, 
  Waves, 
  ShieldCheck, 
  ArrowRight,
  ChevronLeft,
  Calendar,
  Lock,
  Loader2,
  ChevronDown,
  Compass,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../utils/supabaseClient';
import { Realtor, getTenantSubdomain } from '../../utils/tenant';

interface SurveyFlowProps {
  realtor: Realtor;
  onStepChange?: (step: number) => void;
  onComplete?: (leadId: string) => void;
}

// Slide animations based on stepping forward or backward
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0
  })
};

export default function SurveyFlow({ realtor, onStepChange, onComplete }: SurveyFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showWhatsIncluded, setShowWhatsIncluded] = useState(false);

  // Survey state
  const [currentResidence, setCurrentResidence] = useState('');
  const [movingTimeline, setMovingTimeline] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [mustHaveAmenities, setMustHaveAmenities] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [baths, setBaths] = useState(2);
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);

  // Region name - derived from realtor, overridden by URL parameter if available
  const [regionName, setRegionName] = useState(realtor.target_subdomain === 'york' ? 'York County' : 'Tampa Bay');

  useEffect(() => {
    if (router.isReady) {
      if (router.query.area) {
        setRegionName(router.query.area as string);
      }
      if (router.query.name) {
        setName(router.query.name as string);
      }
      if (router.query.email) {
        setEmail(router.query.email as string);
      }
      if (router.query.phone) {
        setPhone(router.query.phone as string);
      }
      if (router.query.street_address) {
        setStreetAddress(router.query.street_address as string);
      } else if (router.query.street) {
        setStreetAddress(router.query.street as string);
      } else if (router.query.address) {
        setStreetAddress(router.query.address as string);
      }
      if (router.query.city) {
        setCity(router.query.city as string);
      }
      if (router.query.state) {
        setStateVal(router.query.state as string);
      }
      if (router.query.zip) {
        setZip(router.query.zip as string);
      }
    }
  }, [
    router.isReady,
    router.query.area,
    router.query.name,
    router.query.email,
    router.query.phone,
    router.query.street_address,
    router.query.street,
    router.query.address,
    router.query.city,
    router.query.state,
    router.query.zip
  ]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Auto-submit step 5 when all required parameters exist
  useEffect(() => {
    if (step === 5 && name.trim() && email.trim() && phone.trim() && !loading) {
      const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(dummyEvent);
    }
  }, [step, name, email, phone]);

  const handleNextStep = () => {
    setErrorMsg('');
    setDirection(1);
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    setDirection(-1);
    setStep(step - 1);
  };

  const toggleAmenity = (amenity: string) => {
    if (mustHaveAmenities.includes(amenity)) {
      setMustHaveAmenities(mustHaveAmenities.filter((a) => a !== amenity));
    } else {
      if (mustHaveAmenities.length >= 3) return;
      const updated = [...mustHaveAmenities, amenity];
      setMustHaveAmenities(updated);
      if (updated.length === 3) {
        setTimeout(() => {
          handleNextStep();
        }, 400);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please fill in your name, email, and phone to unlock your matches.');
      return;
    }

    setLoading(true);

    try {
      // Map preferences to match database requirements
      const leadData = {
        realtor_id: realtor.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        street_address: streetAddress.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        zip: zip.trim(),
        moving_timeline: movingTimeline || 'Browsing',
        budget_min: budgetMin,
        budget_max: budgetMax,
        preferred_style: preferredStyle || 'Single-Family Detached',
        must_have_amenities: mustHaveAmenities,
        bedrooms: bedrooms,
        bathrooms: baths,
        current_residence: currentResidence || 'Unknown',
        is_live_takeover_requested: false
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('registered_lead_id', data.id);
      }

      if (typeof window !== 'undefined') {
        const pendingRedirect = sessionStorage.getItem('pending_community_redirect');
        if (pendingRedirect) {
          window.open(pendingRedirect, '_blank');
          sessionStorage.removeItem('pending_community_redirect');
        }
      }

      if (onComplete) {
        onComplete(data.id);
      } else {
        // Redirect to portal with lead ID
        const activeTenant = getTenantSubdomain();
        const tenantParam = activeTenant ? `&id=${activeTenant}` : '';
        router.push(`/portal?leadId=${data.id}${tenantParam}`);
      }
    } catch (err: any) {
      console.error('Error submitting survey:', err);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress Bar percentage
  const progressPercent = ((step - 1) / 4) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-2xl editorial-shadow border border-border-custom overflow-hidden">
      {/* Progress Indicator */}
      <div className="w-full bg-background h-2 relative">
        <motion.div 
          className="bg-primary h-full rounded-r-full" 
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>

      <div className="p-8 sm:p-12 relative">
        {step > 1 && (
          <button
            type="button"
            onClick={handlePrevStep}
            className="flex items-center text-foreground/60 hover:text-foreground font-bold mb-6 text-base py-1.5 px-3 -ml-3 rounded-lg hover:bg-background transition-colors focus:ring-2 focus:ring-primary/20"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 220, damping: 24 },
              opacity: { duration: 0.15 }
            }}
            className="w-full"
          >
            {/* Step 2: Structural Property Selection */}
            {step === 2 && (
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-8 leading-tight tracking-tight">
                  Which Style Of Home Fits Your Lifestyle Best?
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPreferredStyle('Single-Family Detached');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-5 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      preferredStyle === 'Single-Family Detached' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Single-Family Detached</span>
                        <span className="block text-sm sm:text-base text-foreground/50 mt-0.5">Standalone home with maximum privacy</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPreferredStyle('Low-Maintenance Townhome / Villa');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-5 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      preferredStyle === 'Low-Maintenance Townhome / Villa' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Townhome / Villa Layout</span>
                        <span className="block text-sm sm:text-base text-foreground/50 mt-0.5">Attached layout with external maintenance included</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setPreferredStyle('Condo / Penthouse Layout');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-5 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      preferredStyle === 'Condo / Penthouse Layout' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Condo / Penthouse Layout</span>
                        <span className="block text-sm sm:text-base text-foreground/50 mt-0.5">Single-floor convenience and lock-and-go security</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 1: Must-Have Amenities */}
            {step === 1 && (
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-1 leading-tight tracking-tight text-center">
                  Select 3 Amenities Most Important to You
                </h2>
                <p className="text-base text-slate-500 mb-8 text-center">
                  Pick exactly 3 amenities to automatically continue. (Selected: {mustHaveAmenities.length}/3)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {/* Amenity 1 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Clubhouse & Social Calendar')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Clubhouse & Social Calendar')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Clubhouse & Socials</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Structured activities, classes, & groups</span>
                    </div>
                  </motion.button>

                  {/* Amenity 2 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Pickleball & Tennis Courts')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Pickleball & Tennis Courts')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Activity className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Pickleball & Tennis</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Outdoor active sports courts & leagues</span>
                    </div>
                  </motion.button>

                  {/* Amenity 3 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Pool & Fitness Facility')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Pool & Fitness Facility')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Waves className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Pool & Gym</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Heated pools, modern exercise gear</span>
                    </div>
                  </motion.button>

                  {/* Amenity 4 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Lawn Care & Snow Removal Included')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Lawn Care & Snow Removal Included')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <ShieldCheck className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Lawn & Snow Care</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Mowing, shoveling, and leaf cleanup included</span>
                    </div>
                  </motion.button>

                  {/* Amenity 5 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Gated Security & Staffed Entry')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Gated Security & Staffed Entry')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Lock className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Gated Security</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Staffed entry gates and patrol services</span>
                    </div>
                  </motion.button>

                  {/* Amenity 6 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Golf Course Access / Cart Paths')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Golf Course Access / Cart Paths')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Compass className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Golf Course Access</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Direct cart path connections and tee access</span>
                    </div>
                  </motion.button>

                  {/* Amenity 7 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Walking Trails & Nature Parks')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Walking Trails & Nature Parks')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <MapPin className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Trails & Parks</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Paved walking trails and nature reserves</span>
                    </div>
                  </motion.button>

                  {/* Amenity 8 */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Dog Park & Pet-Friendly Areas')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Dog Park & Pet-Friendly Areas')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Home className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Pet-Friendly Areas</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Fenced dog parks and wash stations</span>
                    </div>
                  </motion.button>

                  {/* Amenity 9: Single Story Living */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('Single-Story Living / First-Floor Owner Suites')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('Single-Story Living / First-Floor Owner Suites')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Home className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">Single-Story Living</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">Stair-free floorplans, main level primary suites</span>
                    </div>
                  </motion.button>

                  {/* Amenity 10: RV & Boat Storage */}
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleAmenity('RV & Boat Storage Yard')}
                    className={`p-5 rounded-xl border-2 text-left interactive-target transition-all flex items-start shadow-2xs cursor-pointer ${
                      mustHaveAmenities.includes('RV & Boat Storage Yard')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="p-2.5 bg-primary/5 text-primary rounded-lg mr-3.5 shrink-0">
                      <Compass className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <span className="block text-lg font-serif font-bold text-foreground leading-tight">RV & Boat Storage</span>
                      <span className="block text-xs sm:text-sm text-foreground/50 mt-1">On-site secure parking for travel trailers & boats</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 3: Destination & Identity Mapping (Timeline) */}
            {step === 3 && (
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-8 leading-tight tracking-tight text-center">
                  What's Your Time Line For A Move
                </h2>

                <div className="space-y-4">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMovingTimeline('Moving Soon (0-3 Months)');
                      handleNextStep();
                    }}
                    className="w-full text-left bg-white border-2 border-border-custom p-6 rounded-xl flex items-center justify-between interactive-target group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4 group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Moving Soon (0-3 Months)</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMovingTimeline('Moving in 3-12 Months');
                      handleNextStep();
                    }}
                    className="w-full text-left bg-white border-2 border-border-custom p-6 rounded-xl flex items-center justify-between interactive-target group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4 group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Moving in 3-12 Months</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setMovingTimeline('Just Exploring Options');
                      handleNextStep();
                    }}
                    className="w-full text-left bg-white border-2 border-border-custom p-6 rounded-xl flex items-center justify-between interactive-target group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4 group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-foreground">Just Exploring Options</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 4: Current Residence Situation */}
            {step === 4 && (
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-8 leading-tight tracking-tight text-center">
                  Do You Currently Live In The {regionName} Area?
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentResidence('Yes, I Own A Home Here');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-6 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      currentResidence === 'Yes, I Own A Home Here' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl font-serif font-bold text-foreground">Yes, I Own A Home Here</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentResidence('Yes, I Rent Here');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-6 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      currentResidence === 'Yes, I Rent Here' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl font-serif font-bold text-foreground">Yes, I Rent Here</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2, borderColor: '#9A7F56' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setCurrentResidence('No, I Might Be Moving From Somewhere Else');
                      handleNextStep();
                    }}
                    className={`w-full text-left p-6 rounded-xl border-2 flex items-center justify-between interactive-target group shadow-2xs cursor-pointer ${
                      currentResidence === 'No, I Might Be Moving From Somewhere Else' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border-custom bg-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="p-3 bg-primary/5 text-primary rounded-lg mr-4">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-xl font-serif font-bold text-foreground">No, I Might Be Moving From Somewhere Else</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Step 5: Secure Value-Add Contact Capture */}
            {step === 5 && (
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-black text-foreground mb-4 leading-tight tracking-tight text-center">
                  Create FREE Account & See Your Recommended Communities
                </h2>

                <div className="mb-8 text-center">
                  <button
                    type="button"
                    onClick={() => setShowWhatsIncluded(!showWhatsIncluded)}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-serif font-bold text-lg sm:text-xl transition-colors cursor-pointer border-0 bg-transparent py-1.5 px-4 rounded-lg hover:bg-primary/5 focus:outline-hidden"
                  >
                    <span>What's included?</span>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showWhatsIncluded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showWhatsIncluded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3 max-w-xl mx-auto text-left bg-slate-50 border border-border-custom rounded-xl p-5 sm:p-6 shadow-2xs"
                      >
                        <ul className="space-y-3.5 text-base sm:text-lg text-slate-700 list-none p-0 m-0">
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5 select-none font-bold">✓</span>
                            <span>Instantly See Your Best Active Adult Community Matches</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5 select-none font-bold">✓</span>
                            <span>Get Fast Answers From Our AI Concierge</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5 select-none font-bold">✓</span>
                            <span>Weekly Notification Email About Any Local Price Reductions & Special Builder Deals & Incentives</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-primary mt-0.5 select-none font-bold">✓</span>
                            <span>If you enter your address you'll receive a detailed home value report that shows what your home might sell for today, so you know the value before you make your move.</span>
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="survey-name" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="survey-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                      placeholder="e.g. Robert Smith"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="survey-email" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="survey-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                      placeholder="e.g. bob@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="survey-phone" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="survey-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                      placeholder="e.g. (717) 555-0123"
                      required
                    />
                  </div>

                  <div className="border-t border-border-custom pt-6">
                    <h3 className="text-xl font-serif font-bold text-foreground mb-1">
                      Bonus - Enter Your Address To Get A Custom Market Analysis Report For Your Current Home
                    </h3>
                    <p className="text-sm font-sans font-normal text-slate-500 mb-4">
                      (so you can know what it might sell for before you make a move)
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="survey-street" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="survey-street"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                          placeholder="e.g. 123 Main St"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label htmlFor="survey-city" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            id="survey-city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                            placeholder="e.g. York"
                          />
                        </div>

                        <div>
                          <label htmlFor="survey-state" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            id="survey-state"
                            value={stateVal}
                            onChange={(e) => setStateVal(e.target.value)}
                            className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                            placeholder="e.g. PA"
                          />
                        </div>

                        <div>
                          <label htmlFor="survey-zip" className="block text-base sm:text-lg font-serif font-bold text-foreground mb-2">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            id="survey-zip"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            className="w-full border-2 border-border-custom p-4 rounded-xl text-lg sm:text-xl focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                            placeholder="e.g. 17402"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 text-red-800 border-2 border-red-200 p-4 rounded-xl text-base sm:text-lg font-medium"
                    >
                      {errorMsg}
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold py-4.5 px-6 rounded-xl text-xl flex items-center justify-center transition-colors interactive-target shadow-xs mt-8 cursor-pointer font-serif"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Creating Dashboard...
                      </>
                    ) : (
                      <>
                        Unlock My Custom Dashboard and See My Community Matches
                        <Lock className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
