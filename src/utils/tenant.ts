import { supabase } from './supabaseClient';

export interface Realtor {
  id: string;
  name: string;
  email: string;
  phone: string;
  target_subdomain: string;
  default_area?: string;
  facebook_pixel_id?: string;
  ref_id?: number;
  created_at: string;
}

export interface Community {
  id: string;
  realtor_id: string;
  name: string;
  region: string;
  price_min: number;
  price_max: number;
  hoa_fee: number;
  hoa_frequency: string;
  hoa_inclusions: string[];
  amenities: string[];
  home_types: string[];
  realtor_notes: string;
  community_url: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

/**
 * Extracts the tenant subdomain from the current hostname or URL parameters.
 * E.g., york.55plushomesearch.com -> "york"
 * Localhost fallback uses ?tenant=... query parameter, defaulting to "york".
 */
export function getTenantRef(): string {
  if (typeof window === 'undefined') return '1';

  // 1. Check id, ref, or tenant query parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const queryRef = urlParams.get('id') || urlParams.get('ref') || urlParams.get('tenant');
  if (queryRef) {
    localStorage.setItem('active_tenant_ref', queryRef);
    return queryRef;
  }

  // 2. Check localStorage next to persist tenant across page transitions
  const storedRef = localStorage.getItem('active_tenant_ref');
  if (storedRef) {
    return storedRef;
  }

  // 3. Fallback support for subdomains mapped to numeric ref IDs
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const sub = parts[0].toLowerCase();
      if (sub === 'tampa') return '2';
      if (sub === 'york') return '1';
    }
  }

  return '1'; // fallback default (Walt Wensel, ref = 1)
}

export async function fetchRealtorByRef(ref: string): Promise<Realtor | null> {
  try {
    const refId = parseInt(ref, 10);
    if (isNaN(refId)) {
      // Compatibility fallback if old subdomain names are passed
      if (ref === 'york') return fetchRealtorByRef('1');
      if (ref === 'tampa') return fetchRealtorByRef('2');
      return null;
    }

    const { data, error } = await supabase
      .from('realtors')
      .select('*')
      .eq('ref_id', refId)
      .single();

    if (error) {
      console.error('Error fetching realtor by ref:', error);
      return null;
    }

    return data as Realtor;
  } catch (err) {
    console.error('Failed to fetch realtor by ref:', err);
    return null;
  }
}

/**
 * Backward compatibility wrappers
 */
export function getTenantSubdomain(): string {
  return getTenantRef();
}

export async function fetchRealtorBySubdomain(subdomain: string): Promise<Realtor | null> {
  return fetchRealtorByRef(subdomain);
}

/**
 * Fetches all communities linked to a specific Realtor ID.
 */
export async function fetchCommunitiesByRealtor(realtorId: string): Promise<Community[]> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('realtor_id', realtorId);

    if (error) {
      console.error('Error fetching communities:', error);
      return [];
    }

    return (data || []) as Community[];
  } catch (err) {
    console.error('Failed to fetch communities:', err);
    return [];
  }
}
