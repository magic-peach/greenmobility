import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unified Green Mobility Platform',
  description: 'Discover parking, share rides, and track your CO₂ savings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {children}
      </body>
    </html>
  )
}
