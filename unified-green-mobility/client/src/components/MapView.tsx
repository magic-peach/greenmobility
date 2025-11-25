'use client';

/**
 * MapView Component
 * 
 * A reusable Leaflet map component using MapTiler tiles.
 * 
 * Usage:
 * ```tsx
 * import MapView from '@/components/MapView';
 * 
 * <MapView 
 *   center={[40.7128, -74.0060]} 
 *   zoom={13}
 *   markers={[
 *     { lat: 40.7128, lng: -74.0060, label: 'New York' }
 *   ]}
 * />
 * ```
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Marker = {
  lat: number;
  lng: number;
  label?: string;
};

export interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: Marker[];
  className?: string;
  height?: string;
}

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export default function MapView({
  center,
  zoom = 13,
  markers = [],
  className = '',
  height = '400px',
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    
    if (!mapTilerKey) {
      console.warn('NEXT_PUBLIC_MAPTILER_API_KEY is not set. Map will not load.');
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">MapTiler API key not configured</div>';
      }
      return;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add MapTiler tile layer
    const tileUrl = `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${mapTilerKey}`;
    L.tileLayer(tileUrl, {
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Cleanup
    return () => {
      map.remove();
    };
  }, [center, zoom]);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(({ lat, lng, label }) => {
      const marker = L.marker([lat, lng]).addTo(mapRef.current!);
      
      if (label) {
        marker.bindPopup(label);
      }
      
      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{
        width: '100%',
        height,
        minHeight: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

