import { supabase } from './supabaseClient';

export interface Realtor {
  id: string;
  name: string;
  email: string;
  phone: string;
  target_subdomain: string;
  default_area?: string;
  facebook_pixel_id?: string;
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
export function getTenantSubdomain(): string {
  if (typeof window === 'undefined') return 'york';

  // 1. Check query parameter first (great for testing/debugging)
  const urlParams = new URLSearchParams(window.location.search);
  const queryTenant = urlParams.get('tenant');
  if (queryTenant) return queryTenant.toLowerCase();

  // 2. Parse hostname
  const hostname = window.location.hostname;
  
  // Localhost or IP check
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'york'; // default local tenant
  }

  // Parse domain (subdomain.domain.com or subdomain.domain.co.uk)
  const parts = hostname.split('.');
  
  if (parts.length > 2) {
    // If it's something like york.55plushomesearch.com, parts is ["york", "55plushomesearch", "com"]
    // The subdomain is the first part.
    return parts[0].toLowerCase();
  }

  return 'york'; // fallback default
}

/**
 * Fetches Realtor details by subdomain.
 */
export async function fetchRealtorBySubdomain(subdomain: string): Promise<Realtor | null> {
  try {
    const { data, error } = await supabase
      .from('realtors')
      .select('*')
      .eq('target_subdomain', subdomain)
      .single();

    if (error) {
      console.error('Error fetching realtor:', error);
      return null;
    }

    return data as Realtor;
  } catch (err) {
    console.error('Failed to fetch realtor:', err);
    return null;
  }
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
