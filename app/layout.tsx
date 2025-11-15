import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import Header from './components/header'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem'
import { AuthProvider } from './contexts/AuthContext'
import { GoogleOneTapProvider } from './components/auth'
import AuthWrapper from './components/AuthWrapper'
import { FavoritesProvider } from '@/lib/contexts/FavoritesContext'
import CapacitorInitializer from './components/CapacitorInitializer'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
})

export const metadata: Metadata = {
  title: 'VERA - Verified Exchange & Resource Assistant',
  description: 'Sri Lanka\'s trusted marketplace for vehicles, properties, tech, and more. Verified listings powered by AI.',
  icons: {
    icon: '/V (3).svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://ahmynvxoxzhocuhxlcvo.supabase.co" />
        <link rel="dns-prefetch" href="https://ahmynvxoxzhocuhxlcvo.supabase.co" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk',
              potentialAction: {
                '@type': 'SearchAction',
                target: (process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk') + '/listings?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        </head>
        <body className={inter.className}>
          <CapacitorInitializer />
          <ErrorBoundary>
            <AuthProvider>
              <FavoritesProvider>
                <NotificationProvider>
                  <GoogleOneTapProvider />
                  <Suspense fallback={<div className="min-h-screen" />}>
                    <AuthWrapper>
                      <Header />
                      <main className="min-h-screen safe-top safe-bottom">
                        {children}
                      </main>
                      <Footer />
                      <Analytics />
                    </AuthWrapper>
                  </Suspense>
                </NotificationProvider>
              </FavoritesProvider>
            </AuthProvider>
          </ErrorBoundary>
        </body>
      </html>
  )
}
