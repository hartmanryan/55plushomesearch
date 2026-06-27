import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Community } from '../../utils/tenant';
import { ExternalLink } from 'lucide-react';

// Helper to construct a custom SVG pin marker with active states
const createCustomMarker = (name: string, isHighlighted: boolean) => {
  return L.divIcon({
    html: `
      <div class="flex flex-col items-center justify-center">
        <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${
          isHighlighted 
            ? 'bg-primary border-2 border-white scale-125 shadow-lg shadow-primary/50' 
            : 'bg-foreground border-2 border-white hover:bg-primary scale-100 shadow-md'
        } transition-all duration-300">
          <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          ${
            isHighlighted 
              ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                 </span>`
              : ''
          }
        </div>
        <div class="mt-1 px-2 py-0.5 bg-foreground/90 text-white rounded text-[10px] font-extrabold uppercase tracking-wider border border-white/10 whitespace-nowrap shadow-xs pointer-events-none">
          ${name}
        </div>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [40, 52],
    iconAnchor: [20, 30],
    popupAnchor: [0, -30]
  });
};

interface CommunityMapProps {
  communities: Community[];
  highlightedId?: string | null;
  onSelectCommunity?: (id: string) => void;
  isRegistered?: boolean;
  onRequestRegistration?: (url: string) => void;
  searchCenter?: [number, number] | null;
  searchZoom?: number;
}

// Centers the map viewport smoothly when highlighted community or search center changes
function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), {
      animate: true,
      duration: 0.8
    });
  }, [center, zoom, map]);
  return null;
}

export default function CommunityMap({ 
  communities, 
  highlightedId, 
  onSelectCommunity,
  isRegistered = true,
  onRequestRegistration,
  searchCenter,
  searchZoom
}: CommunityMapProps) {
  // Filter for valid coords
  const validComms = communities.filter(c => c.latitude !== undefined && c.longitude !== undefined);

  // Default coordinate center (York County, PA center)
  let center: [number, number] = [39.9626, -76.7277];

  // Recenter mapping targets
  const highlighted = validComms.find(c => c.id === highlightedId);
  if (searchCenter) {
    center = searchCenter;
  } else if (highlighted?.latitude !== undefined && highlighted?.longitude !== undefined) {
    center = [highlighted.latitude, highlighted.longitude];
  } else if (validComms.length > 0) {
    const avgLat = validComms.reduce((acc, c) => acc + (c.latitude || 0), 0) / validComms.length;
    const avgLng = validComms.reduce((acc, c) => acc + (c.longitude || 0), 0) / validComms.length;
    center = [avgLat, avgLng];
  }

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-border-custom shadow-xs bg-background">
      <MapContainer
        center={center}
        zoom={searchZoom || 10}
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController center={center} zoom={searchZoom} />

        {validComms.map((comm) => (
          <Marker
            key={comm.id}
            position={[comm.latitude!, comm.longitude!]}
            icon={createCustomMarker(comm.name, comm.id === highlightedId)}
            eventHandlers={{
              click: () => {
                if (onSelectCommunity) {
                  onSelectCommunity(comm.id);
                }
              }
            }}
          >
            <Popup>
              <div className="space-y-2 py-1 text-foreground min-w-[200px]">
                <div>
                  <p className="font-serif font-bold text-foreground text-base m-0 leading-tight">
                    {comm.name}
                  </p>
                  <p className="text-xs font-semibold text-foreground/60 m-0 mt-0.5">{comm.region}</p>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-border-custom mt-2 gap-4">
                  <span className="text-sm font-serif font-bold text-primary m-0">
                    ${(comm.price_min / 1000).toFixed(0)}k - ${(comm.price_max / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] bg-background border border-border-custom px-1.5 py-0.5 rounded font-extrabold text-foreground/70">
                    ${comm.hoa_fee}/MO
                  </span>
                </div>
                
                {comm.amenities && comm.amenities.length > 0 && (
                  <div className="pt-2 border-t border-border-custom mt-2">
                    <span className="block text-[9px] uppercase tracking-wider font-extrabold text-foreground/40 mb-1">Amenities:</span>
                    <div className="flex flex-wrap gap-1">
                      {comm.amenities.slice(0, 3).map((am: string, idx: number) => (
                        <span 
                          key={idx} 
                          className="bg-primary/5 text-primary text-[10px] font-bold py-0.5 px-2 rounded-md border border-primary/10"
                        >
                          {am}
                        </span>
                      ))}
                      {comm.amenities.length > 3 && (
                        <span className="text-foreground/45 text-[9px] font-bold py-0.5 px-1.5 bg-background border border-border-custom rounded-md">
                          +{comm.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {!isRegistered && (
                  <button
                    onClick={() => {
                      if (onRequestRegistration) {
                        onRequestRegistration(comm.community_url || '#');
                      }
                    }}
                    className="w-full mt-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-serif font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer border-0 shadow-2xs"
                  >
                    Unlock to see all community results
                  </button>
                )}
                {isRegistered && comm.community_url && comm.community_url !== '#' && (
                  <a
                    href={comm.community_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-2.5 bg-emerald-600 hover:bg-emerald-700 !text-white text-xs font-serif font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors text-center no-underline shadow-2xs"
                  >
                    View Listings & Floorplans
                    <ExternalLink className="w-3 h-3 text-white" />
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
