'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Car } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">

            {/* From VERA Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-900">From VERA</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/post" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Sell your vehicle
                  </Link>
                </li>
                <li>
                  <Link href="/wanted" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Wanted requests
                  </Link>
                </li>
                <li>
                  <Link href="/ai-features" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    AI features
                  </Link>
                </li>
                <li>
                  <Link href="/post/paid-features" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Promote ad
                  </Link>
                </li>
                <li>
                  <Link href="/membership" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Membership
                  </Link>
                </li>
              </ul>
            </div>

            {/* Help and Support Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-900">Help and Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/faq" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Safety & fraud detection
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>

            {/* About VERA Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-900">About VERA</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Terms and conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Refund policy
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Download App Section - TEMPORARILY COMMENTED OUT */}
            {/* <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Download our app</h3>
              <div className="space-y-3">
                <Link
                  href="#"
                  className="inline-block transition-transform hover:scale-105"
                  aria-label="Download on Google Play"
                >
                  <div className="bg-black rounded-lg p-2 flex items-center space-x-3 border border-gray-300 hover:border-gray-400">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <defs>
                          <linearGradient id="playBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00C6FF"/>
                            <stop offset="100%" stopColor="#0072FF"/>
                          </linearGradient>
                          <linearGradient id="playYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFE000"/>
                            <stop offset="100%" stopColor="#FFBD00"/>
                          </linearGradient>
                          <linearGradient id="playRed" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF3A44"/>
                            <stop offset="100%" stopColor="#C31162"/>
                          </linearGradient>
                          <linearGradient id="playGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#32A071"/>
                            <stop offset="100%" stopColor="#00832D"/>
                          </linearGradient>
                        </defs>
                        <path fill="url(#playBlue)" d="M3.5 3.5C3.5 2.83 3.83 2.33 4.33 2.08L13.69 11.44L4.33 20.92C3.83 20.67 3.5 20.17 3.5 19.5V3.5Z"/>
                        <path fill="url(#playYellow)" d="M16.81 14.62L14.54 12.35L6.55 20.34L16.81 14.62Z"/>
                        <path fill="url(#playRed)" d="M20.16 10.31C20.5 10.58 20.75 11 20.75 11.5C20.75 12 20.5 12.42 20.16 12.69L17.89 14L15.39 11.5L17.89 9L20.16 10.31Z"/>
                        <path fill="url(#playGreen)" d="M6.55 2.66L14.54 10.65L16.81 8.38L6.55 2.66Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">GET IT ON</div>
                      <div className="text-sm font-semibold text-white">Google Play</div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="#"
                  className="inline-block transition-transform hover:scale-105"
                  aria-label="Download on the App Store"
                >
                  <div className="bg-black rounded-lg p-2 flex items-center space-x-3 border border-gray-300 hover:border-gray-400">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Download on the</div>
                      <div className="text-sm font-semibold text-white">App Store</div>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 text-gray-900">Follow us</h4>
                <div className="flex space-x-4">
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.328-1.297L6.46 14.353c.548.548 1.297.911 2.131.911 1.663 0 3.011-1.348 3.011-3.011 0-.834-.363-1.583-.911-2.131L11.987 8.785c1.297.88 1.297 2.031 1.297 3.328 0 2.775-2.245 5.02-5.02 5.02-.834 0-1.583-.363-2.131-.911l1.336-1.234z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </Link>
                  <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <span className="sr-only">YouTube</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo and Copyright */}
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
                <span className="text-lg font-bold text-gray-900">VERA</span>
              </div>
              <div className="hidden md:block text-gray-500 text-xs">
                © {new Date().getFullYear()} VERA. All rights reserved.
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-xs text-gray-500">
              <div className="md:hidden">
                © {new Date().getFullYear()} VERA. All rights reserved.
              </div>
              <div className="flex items-center space-x-1">
                <Image src="/sri-lanka-flag.svg" alt="Sri Lanka" width={20} height={12} />
                <span>Made in Sri Lanka</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z"/>
                </svg>
                <span>Secure & Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Mobile Sell Button */}
        <Link
          href="/post"
          className="md:hidden bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          aria-label="Sell Vehicle"
        >
          <Car className="w-4 h-4" />
          <span className="text-sm font-medium">Sell</span>
        </Link>
        
        {/* Desktop Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="hidden md:block bg-gray-600 text-white p-2.5 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          aria-label="Back to top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </footer>
  )
}