import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Helper to create a custom gold home icon for the background
const createBackgroundHomeIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-11 h-11">
        <!-- Luminous pulsing gold radar ring -->
        <span class="absolute inset-0 rounded-full bg-[#E5C158] opacity-75 animate-ping"></span>
        <!-- Shiny premium gold marker -->
        <div class="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-[#E5C158] border-2 border-white shadow-lg shadow-black/35 hover:scale-110 transition-transform duration-300">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        </div>
      </div>
    `,
    className: 'bg-home-marker-container',
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

// Dynamic viewport zoom/center updates
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, {
      animate: true,
      duration: 0.8
    });
  }, [center, zoom, map]);
  return null;
}

// Zip Code coordinate mapping table for primary active-adult target areas
const ZIP_COORDINATES: Record<string, [number, number]> = {
  // York County, PA
  '17401': [39.9626, -76.7277],
  '17402': [39.9691, -76.6853],
  '17403': [39.9458, -76.7196],
  '17404': [39.9839, -76.7554],
  '17406': [40.0076, -76.6713],
  '17325': [39.8300, -77.2300],
  '17331': [39.8000, -76.9800],
  '17315': [40.0017, -76.8483],
  '17356': [39.8989, -76.6067],
  '17361': [39.7711, -76.6806],
  '17322': [39.7936, -76.7303],
  '17408': [39.9400, -76.8200],

  // Tampa Bay, FL
  '33602': [27.9506, -82.4572],
  '33603': [27.9818, -82.4578],
  '33604': [28.0125, -82.4593],
  '33606': [27.9392, -82.4646],
  '33607': [27.9624, -82.4975],
  '33647': [28.1400, -82.3500],
  '33701': [27.7731, -82.6400],
  '33702': [27.8347, -82.6345],
  '34698': [28.0197, -82.7718],
  '33511': [27.9378, -82.2858],
  '33573': [27.7136, -82.3562], // Sun City Center
  '34689': [28.1461, -82.7568],
  '33755': [27.9811, -82.7939],
  '33756': [27.9575, -82.7844]
};

const getCenterFromZipOrSubdomain = (zip: string | undefined, subdomain: string): [number, number] => {
  // Defaults
  const defaultYork: [number, number] = [39.9626, -76.7277];
  const defaultTampa: [number, number] = [27.9506, -82.4572];

  if (!zip) {
    return subdomain === 'york' ? defaultYork : defaultTampa;
  }

  const cleanedZip = zip.trim();
  if (ZIP_COORDINATES[cleanedZip]) {
    return ZIP_COORDINATES[cleanedZip];
  }

  // Fallback pattern matching
  if (cleanedZip.startsWith('17')) {
    return defaultYork;
  }
  if (cleanedZip.startsWith('33') || cleanedZip.startsWith('34') || cleanedZip.startsWith('27') || cleanedZip.startsWith('28')) {
    return defaultTampa;
  }

  return subdomain === 'york' ? defaultYork : defaultTampa;
};

interface BackgroundMapProps {
  subdomain: string;
  zip?: string;
}

export default function BackgroundMap({ subdomain, zip }: BackgroundMapProps) {
  // Resolve center
  const center = getCenterFromZipOrSubdomain(zip, subdomain);

  // Responsive zoom level state
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    const handleResize = () => {
      // For mobile devices, zoom out to bring the wider markers on the left and right into the viewport margins
      if (window.innerWidth < 768) {
        setZoom(10.5);
      } else {
        setZoom(12);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate 15 scattered coordinates relative to center (guarantees dynamic positioning)
  const offsets = [
    // Left (West) margin offsets
    [0.0174, -0.0623],
    [-0.0176, -0.0573],
    [-0.0026, -0.0823],
    [-0.0426, -0.0923],
    [0.0324, -0.1023],
    [-0.0276, -0.0723],
    // Right (East) margin offsets
    [0.0074, 0.0877],
    [-0.0226, 0.0777],
    [0.0274, 0.0677],
    [-0.0126, 0.0577],
    [-0.0376, 0.0977],
    [0.0224, 0.1077],
    // TOP Gaps (between Nav and Headline)
    [0.0194, -0.0073],
    [0.0254, 0.0077],
    [0.0224, -0.0173]
  ];

  const markers = offsets.map(([latOff, lngOff]) => [center[0] + latOff, center[1] + lngOff]);

  return (
    <div className="w-full h-full bg-[#FAF9F5]">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
        className="w-full h-full pointer-events-none"
      >
        <MapController center={center} zoom={zoom} />
        
        {/* Google Satellite view */}
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution="&copy; Google Maps"
        />

        {markers.map((pos, idx) => (
          <Marker
            key={idx}
            position={pos as [number, number]}
            icon={createBackgroundHomeIcon()}
          />
        ))}
      </MapContainer>
    </div>
  );
}
