import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/header'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import { NotificationProvider } from './components/NotificationSystem'
import { AuthProvider } from './contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoTrader.lk - Buy & Sell Vehicles in Sri Lanka',
  description: 'Find your perfect vehicle or sell your car with AI-powered descriptions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://kit.fontawesome.com/5a82e6e998.js" crossOrigin="anonymous"></script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
