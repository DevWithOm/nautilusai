import { useState, useEffect } from 'react';
import Map, { NavigationControl, Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Zone } from '../store/useNautilusStore';

interface MapLayerProps {
  zones: Zone[];
  onZoneClick?: (zone: Zone) => void;
}

const INITIAL_VIEW_STATE = {
  longitude: 78.0,
  latitude: 15.0,
  zoom: 4.5,
  pitch: 45,
  bearing: 0
};

export default function MapLayer({ zones, onZoneClick }: MapLayerProps) {
  const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY || ''; 
  const MAP_STYLE = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_API_KEY}`;

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hasFlown, setHasFlown] = useState(false);

  useEffect(() => {
    if (zones.length > 0 && !hasFlown) {
      setHasFlown(true);
      setViewState({
         longitude: 78.0,
         latitude: 15.0,
         zoom: 4.5,
         pitch: 45,
         bearing: 0
      });
    }
  }, [zones, hasFlown]);

  // Trajectory path for AS-07
  const trajectoryGeoJSON: any = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [69.2, 16.5], // roughly AS-07
        [69.8, 17.2],
        [70.5, 18.0]
      ]
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-[var(--color-reef-dark)]">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        interactive={true}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Trajectory Line */}
        <Source type="geojson" data={trajectoryGeoJSON}>
          <Layer
            id="trajectory-line"
            type="line"
            paint={{
              'line-color': '#FFB020',
              'line-width': 2,
              'line-dasharray': [2, 4],
              'line-opacity': 0.8
            }}
          />
        </Source>

        {zones.map((zone) => {
          let ringColor = 'bg-blue-300';
          let textColor = 'text-blue-300';
          let sizeClass = 'w-2.5 h-2.5'; // radius 5 (10px)
          let opacityClass = 'opacity-30';
          
          const t = String(zone.tier).toLowerCase();
          
          if (t === 'critical') {
            ringColor = 'bg-[#FF4D4D] shadow-[0_0_15px_#FF4D4D]';
            textColor = 'text-[#FF4D4D]';
            sizeClass = 'w-7 h-7'; // radius 14 (28px)
            opacityClass = 'opacity-100';
          } else if (t === 'advisory') {
            ringColor = 'bg-[#FFB020] shadow-[0_0_10px_#FFB020]';
            textColor = 'text-[#FFB020]';
            sizeClass = 'w-[18px] h-[18px]'; // radius 9 (18px)
            opacityClass = 'opacity-90';
          } else if (t === 'watch') {
            ringColor = 'bg-[#448AFF]';
            textColor = 'text-[#448AFF]';
            sizeClass = 'w-3.5 h-3.5'; // radius 7 (14px)
            opacityClass = 'opacity-70';
          }

          const isMonitored = (zone.score || 0) > 0;

          return (
            <Marker 
              key={zone.zone_id} 
              longitude={zone.lng} 
              latitude={zone.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onZoneClick) onZoneClick(zone);
              }}
            >
              <div className={`relative group cursor-pointer flex items-center justify-center ${opacityClass}`}>
                {/* CSS Pulse Animation Ring for Critical */}
                {t === 'critical' && (
                  <div className={`absolute w-[60px] h-[60px] rounded-full border border-[#FF4D4D] animate-[pulse-ring_2s_infinite]`} />
                )}
                
                {/* Core Dot (Leaflet CircleMarker approximation) */}
                <div className={`relative ${sizeClass} rounded-full border border-black/50 ${ringColor}`} />

                {/* Hover Tooltip (Glassmorphism) */}
                <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col items-center z-50">
                  <div className="bg-[var(--color-reef-dark)]/90 backdrop-blur-xl border border-[var(--color-reef-accent)]/30 text-white text-xs whitespace-nowrap px-4 py-3 rounded-xl shadow-2xl flex flex-col items-center gap-2 pointer-events-auto min-w-[210px]">
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className={`font-bold tracking-widest uppercase text-base ${textColor}`}>{zone.zone_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isMonitored ? ringColor : 'bg-white/10 text-white/50'}`}>
                        {isMonitored ? `${Math.round(zone.score || 0)}/100` : 'NOMINAL'}
                      </span>
                    </div>
                    
                    <div className="text-[9px] text-[#6B8CAE] w-full border-b border-white/10 pb-2 mb-1 text-center">
                      {Number(zone.lat).toFixed(1)}°N {Number(zone.lng).toFixed(1)}°E · {zone.region || 'Indian EEZ'}
                    </div>

                    <div className="w-full flex justify-between text-[10px]">
                      <span className="text-[#6B8CAE]">Status</span>
                      <span className={`uppercase font-semibold opacity-80 ${textColor}`}>
                        {isMonitored ? zone.tier : 'MONITORING'}
                      </span>
                    </div>
                    
                    <div className="w-full flex justify-between text-[10px]">
                      <span className="text-[#6B8CAE]">Agents</span>
                      <span className="text-[var(--color-reef-accent)] uppercase">
                        {isMonitored ? '4/4 flagging' : 'Nominal'}
                      </span>
                    </div>

                    <button 
                      className={`mt-2 w-full font-semibold text-[10px] uppercase px-3 py-1.5 rounded transition-colors ${
                        isMonitored 
                          ? 'bg-[#FFB020] hover:brightness-110 text-black' 
                          : 'bg-[var(--color-reef-accent)]/20 hover:bg-[var(--color-reef-accent)]/40 text-[var(--color-reef-text)]'
                      }`}
                      onClick={(e) => {
                         e.stopPropagation();
                         if (onZoneClick) onZoneClick(zone);
                      }}
                    >
                      {isMonitored ? 'View Intelligence Feed →' : 'Zone Nominal · Monitor Active'}
                    </button>
                  </div>
                  <div className="w-3 h-3 bg-[var(--color-reef-dark)]/90 border-r border-b border-[var(--color-reef-accent)]/30 transform rotate-45 -translate-y-[6px]" />
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}
