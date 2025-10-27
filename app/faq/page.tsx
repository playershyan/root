import type { Metadata } from 'next'
import FAQClient from './FAQClient'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | VERA',
  description: 'Find answers to commonly asked questions about posting ads, wanted requests, promotions, and more on VERA.'
}

export default function FAQPage() {
  return <FAQClient />
}
