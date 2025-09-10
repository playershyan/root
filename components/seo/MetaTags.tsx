import Head from 'next/head'

interface MetaTagsProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  keywords?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export default function MetaTags({
  title = 'VERA - Buy & Sell Cars in Sri Lanka',
  description = 'Find the perfect car or sell your vehicle on VERA. Sri Lanka\'s premier automotive marketplace with thousands of listings.',
  image = '/og-image.png',
  url = 'https://vera.lk',
  type = 'website',
  keywords = 'cars, vehicles, buy cars, sell cars, Sri Lanka, automotive, marketplace, used cars',
  author = 'VERA',
  publishedTime,
  modifiedTime
}: MetaTagsProps) {
  const fullTitle = title.includes('VERA') ? title : `${title} | VERA`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="VERA" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="en_LK" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="theme-color" content="#1a365d" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Article Specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content={author} />
      )}

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* Structured Data for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": type === 'product' ? 'Product' : 'WebSite',
            "name": "VERA",
            "url": "https://vera.lk",
            "description": "Sri Lanka's premier automotive marketplace for buying and selling cars",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://vera.lk/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </Head>
  )
}