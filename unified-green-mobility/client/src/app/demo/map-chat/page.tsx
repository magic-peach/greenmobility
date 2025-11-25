'use client';

/**
 * Demo Page: Map and Chat Integration
 * 
 * This is an optional demo page showcasing the MapView and ChatWidget components.
 * You can safely delete this page if not needed.
 * 
 * Access at: /demo/map-chat
 */

import { useState } from 'react';
import MapView from '@/components/MapView';
import ChatWidget from '@/components/ChatWidget';

export default function MapChatDemoPage() {
  const [center, setCenter] = useState<[number, number]>([40.7128, -74.0060]);
  const [markers, setMarkers] = useState([
    { lat: 40.7128, lng: -74.0060, label: 'New York City' },
    { lat: 40.7589, lng: -73.9851, label: 'Times Square' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Map & Chat Demo</h1>
        <p className="text-gray-400 mb-8">
          This page demonstrates the MapView component with MapTiler tiles and the ChatWidget component.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Map Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Interactive Map</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <MapView
                center={center}
                zoom={13}
                markers={markers}
                height="500px"
                className="border border-gray-700"
              />
            </div>
            <div className="text-sm text-gray-400">
              <p>• Click markers to see labels</p>
              <p>• Drag to pan, scroll to zoom</p>
              <p>• Powered by MapTiler</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Components</h2>
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">MapView Component</h3>
                <p className="text-gray-300 text-sm">
                  A reusable Leaflet map component using MapTiler tiles. Supports custom markers,
                  center points, and zoom levels.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">ChatWidget Component</h3>
                <p className="text-gray-300 text-sm">
                  A floating chat widget powered by Google Gemini. Click the chat button in the
                  bottom-right corner to start a conversation.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold mb-2">Usage</h3>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                  <code>{`import MapView from '@/components/MapView';
import ChatWidget from '@/components/ChatWidget';

<MapView center={[lat, lng]} markers={[...]} />
<ChatWidget />`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Widget - Floating */}
        <ChatWidget />
      </div>
    </div>
  );
}

