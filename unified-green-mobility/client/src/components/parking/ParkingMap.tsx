'use client';

/**
 * ParkingMap Component
 * 
 * Interactive MapTiler map for parking locations in Mumbai.
 * Uses MapLibre GL for rendering.
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  total_spots: number;
}

interface ParkingMapProps {
  lots: ParkingLot[];
  selectedLotId?: string | null;
  onLotSelect?: (lot: ParkingLot) => void;
  className?: string;
  height?: string;
}

export default function ParkingMap({
  lots,
  selectedLotId,
  onLotSelect,
  className = '',
  height = '100%',
}: ParkingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    if (!mapTilerKey) {
      console.warn('NEXT_PUBLIC_MAPTILER_API_KEY not configured');
      return;
    }

    // Initialize map centered on Mumbai
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${mapTilerKey}`,
      center: [72.8777, 19.0760], // Mumbai center
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add/update markers when lots change
  useEffect(() => {
    if (!map.current || !lots.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each lot
    lots.forEach(lot => {
      const isSelected = selectedLotId === lot.id;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'parking-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        background: ${isSelected ? '#3b82f6' : '#10b981'};
        border: 3px solid ${isSelected ? '#60a5fa' : '#34d399'};
        border-radius: 50%;
        cursor: pointer;
        box-shadow: ${isSelected ? '0 0 20px rgba(59, 130, 246, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)'};
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 18px;
      `;
      el.innerHTML = 'P';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lot.lng, lot.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onLotSelect?.(lot);
      });

      markersRef.current.push(marker);
    });
  }, [lots, selectedLotId, onLotSelect]);

  // Fly to selected lot
  useEffect(() => {
    if (!map.current || !selectedLotId) return;

    const selectedLot = lots.find(lot => lot.id === selectedLotId);
    if (selectedLot) {
      map.current.flyTo({
        center: [selectedLot.lng, selectedLot.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedLotId, lots]);

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{
        width: '100%',
        height,
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

