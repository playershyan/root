/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://autotrader.lk',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/*',
    '/dashboard/*',
    '/auth/*',
    '/profile/edit',
    '/messages/*',
    '/bin/*'
  ],
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/listings'),
    await config.transform(config, '/wanted'),
    await config.transform(config, '/sell'),
    await config.transform(config, '/about'),
    await config.transform(config, '/contact'),
    await config.transform(config, '/privacy'),
    await config.transform(config, '/terms'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/auth/',
          '/profile/edit',
          '/messages/',
          '/bin/'
        ]
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/', '/auth/']
      }
    ],
    additionalSitemaps: [
      'https://autotrader.lk/server-sitemap.xml', // For dynamic routes
    ]
  },
  transform: async (config, path) => {
    // Custom priority for different pages
    const customPriority = {
      '/': 1.0,
      '/listings': 0.9,
      '/wanted': 0.8,
      '/sell': 0.8
    }

    return {
      loc: path,
      changefreq: path === '/' ? 'daily' : 'weekly',
      priority: customPriority[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined
    }
  }
}