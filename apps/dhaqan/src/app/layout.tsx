import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'DHAQAN — Somali Stories, Streaming',
  description:
    'A home for Somali diaspora movies, TV shows, documentaries, comedy, storytelling, podcasts, and cultural content. Finally, Somali stories have a home.',
  keywords: ['Somali', 'diaspora', 'streaming', 'film', 'documentary', 'culture', 'Somalia'],
  openGraph: {
    title: 'DHAQAN — Somali Stories, Streaming',
    description: 'Finally, Somali stories have a home.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="so" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-dhaqan-bg text-dhaqan-text antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
