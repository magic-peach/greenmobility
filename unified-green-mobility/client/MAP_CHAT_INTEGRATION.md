# Map & Chat Integration Guide

This document explains how to use the newly integrated MapView and ChatWidget components.

## 📦 Installed Dependencies

- `leaflet` - Core mapping library
- `react-leaflet@^4.2.1` - React bindings for Leaflet (compatible with React 18)
- `@google/generative-ai` - Official Google Gemini SDK
- `@types/leaflet` - TypeScript types

## 🔑 Environment Variables

Add these to your `.env.local` file:

```env
# MapTiler API Key
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key_here

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_key_here
```

### Getting API Keys

1. **MapTiler**: 
   - Sign up at https://cloud.maptiler.com/
   - Go to Account → API Keys
   - Copy your key

2. **Gemini**:
   - Visit https://makersuite.google.com/app/apikey
   - Sign in with Google
   - Create API key
   - Copy the key

## 🗺️ MapView Component

### Location
`src/components/MapView.tsx`

### Usage

```tsx
import MapView from '@/components/MapView';

// Basic usage
<MapView 
  center={[40.7128, -74.0060]} 
  zoom={13}
/>

// With markers
<MapView 
  center={[40.7128, -74.0060]} 
  zoom={13}
  markers={[
    { lat: 40.7128, lng: -74.0060, label: 'New York' },
    { lat: 40.7589, lng: -73.9851, label: 'Times Square' }
  ]}
  height="500px"
  className="my-custom-class"
/>
```

### Props

- `center: [number, number]` - **Required**. Map center coordinates [latitude, longitude]
- `zoom?: number` - Optional. Zoom level (default: 13)
- `markers?: Marker[]` - Optional. Array of markers to display
- `className?: string` - Optional. Additional CSS classes
- `height?: string` - Optional. Map height (default: "400px")

### Marker Type

```tsx
type Marker = {
  lat: number;
  lng: number;
  label?: string; // Optional popup text
};
```

### Features

- ✅ MapTiler street tiles
- ✅ Custom markers with popups
- ✅ Responsive and SSR-safe
- ✅ Client-side only (no hydration issues)

## 💬 ChatWidget Component

### Location
`src/components/ChatWidget.tsx`

### Usage

Simply import and add to any page or layout:

```tsx
import ChatWidget from '@/components/ChatWidget';

export default function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <ChatWidget /> {/* Floating chat button */}
    </div>
  );
}
```

### Features

- ✅ Floating button (bottom-right)
- ✅ Toggleable chat window
- ✅ Connects to `/api/chat` endpoint
- ✅ Powered by Google Gemini
- ✅ Loading states and error handling
- ✅ Auto-scroll to latest message

### Behavior

- Click the floating button to open/close chat
- Type a message and press Enter or click Send
- The widget maintains conversation history
- Handles errors gracefully

## 🔌 API Route

### Location
`src/app/api/chat/route.ts`

### Endpoint
`POST /api/chat`

### Request Body

```json
{
  "message": "How does ride sharing work?",
  "context": [] // Optional context array
}
```

### Response

```json
{
  "reply": "Ride sharing allows you to..."
}
```

### Error Handling

- Returns 500 if Gemini API key is missing
- Returns 400 if message is missing or invalid
- Returns 500 with error details on API failure

## 📄 Demo Page

A demo page is available at `/demo/map-chat` showcasing both components together.

**Location**: `src/app/demo/map-chat/page.tsx`

You can safely delete this page if not needed.

## 🎨 Styling

Both components use Tailwind CSS classes that match your existing design system:

- Dark theme (gray-900, gray-800)
- Gradient accents (blue-500, purple-600)
- Responsive design
- Minimal, clean UI

## 🚀 Integration Examples

### Add ChatWidget to Root Layout

```tsx
// src/app/layout.tsx
import ChatWidget from '@/components/ChatWidget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget /> {/* Available on all pages */}
      </body>
    </html>
  );
}
```

### Add MapView to Parking Page

```tsx
// src/app/parking/page.tsx
import MapView from '@/components/MapView';

export default function ParkingPage() {
  const parkingLots = [
    { lat: 40.7128, lng: -74.0060, label: 'Parking Lot 1' },
    { lat: 40.7589, lng: -73.9851, label: 'Parking Lot 2' },
  ];

  return (
    <div>
      <h1>Parking</h1>
      <MapView 
        center={[40.7128, -74.0060]} 
        markers={parkingLots}
        height="600px"
      />
    </div>
  );
}
```

## ⚠️ Important Notes

1. **No Breaking Changes**: All existing code remains untouched
2. **Pluggable Components**: Import and use where needed
3. **SSR Safe**: MapView is client-only, no hydration issues
4. **Environment Variables**: Must be set for components to work
5. **TypeScript**: Full type safety included

## 🐛 Troubleshooting

### Map not showing
- Check `NEXT_PUBLIC_MAPTILER_API_KEY` is set
- Check browser console for errors
- Verify MapTiler key is valid

### Chat not working
- Check `GEMINI_API_KEY` is set (server-side only)
- Check browser console for API errors
- Verify Gemini API key is valid
- Check `/api/chat` route is accessible

### TypeScript errors
- Ensure `@types/leaflet` is installed
- Check `src/types/env.d.ts` is included in tsconfig

## 📚 Additional Resources

- [Leaflet Documentation](https://leafletjs.com/)
- [MapTiler Documentation](https://docs.maptiler.com/)
- [Google Gemini API](https://ai.google.dev/docs)

