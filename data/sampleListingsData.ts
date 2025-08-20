export const sampleListings = [
  // Active Listings (with varied dates for testing renewal)
  {
    id: 'lst_001',
    title: '2021 Toyota Camry SE',
    details: 'Low mileage, excellent condition, one owner',
    price: 28500,
    views: 342,
    status: 'active' as const,
    postedDate: '2025-07-15', // 36 days ago - can be renewed
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'
  },
  {
    id: 'lst_002',
    title: '2019 Honda Accord Sport',
    details: 'Fully loaded, leather seats, sunroof',
    price: 24900,
    views: 189,
    status: 'active' as const,
    postedDate: '2025-08-18', // 2 days ago - cannot be renewed (16 days remaining)
    image: 'https://images.unsplash.com/photo-1619682817720-33d59e985fe3?w=400'
  },
  {
    id: 'lst_003',
    title: '2020 Mazda CX-5 AWD',
    details: 'All-wheel drive, backup camera, Apple CarPlay',
    price: 31200,
    views: 256,
    status: 'active' as const,
    postedDate: '2025-08-10', // 10 days ago - cannot be renewed (8 days remaining)
    image: 'https://images.unsplash.com/photo-1606611013016-969c19ba1be2?w=400'
  },
  {
    id: 'lst_004',
    title: '2022 Tesla Model 3',
    details: 'Long range, autopilot, white interior',
    price: 42000,
    views: 512,
    status: 'active' as const,
    postedDate: '2025-06-01', // 80+ days ago - can be renewed
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400'
  },
  {
    id: 'lst_015',
    title: '2020 BMW X5 xDrive40i',
    details: 'Premium package, navigation, heated seats',
    price: 48500,
    views: 287,
    status: 'pending' as const,
    postedDate: '2025-07-20', // Posted 31 days ago, paused 5 days ago
    pauseDate: '2025-08-15',
    isPaused: true,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'
  },

  // Sold Listings
  {
    id: 'lst_005',
    title: '2018 Ford F-150 XLT',
    details: 'Crew cab, 4WD, towing package',
    price: 35500,
    views: 892,
    status: 'sold' as const,
    postedDate: '2024-12-20',
    image: 'https://images.unsplash.com/photo-1581650107963-c8d1e0136394?w=400'
  },
  {
    id: 'lst_006',
    title: '2019 Chevrolet Silverado 1500',
    details: 'Extended cab, V8 engine, bedliner',
    price: 38900,
    views: 734,
    status: 'sold' as const,
    postedDate: '2024-12-15',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400'
  },
  {
    id: 'lst_007',
    title: '2020 Subaru Outback',
    details: 'Premium trim, heated seats, eyesight safety',
    price: 29800,
    views: 445,
    status: 'sold' as const,
    postedDate: '2024-11-28',
    image: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=400'
  },

  // Under Review (Pending) Listings
  {
    id: 'lst_008',
    title: '2023 BMW X3 xDrive30i',
    details: 'Sport package, panoramic roof, navigation',
    price: 52000,
    views: 67,
    status: 'pending' as const,
    postedDate: '2025-01-19',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'
  },
  {
    id: 'lst_009',
    title: '2021 Audi Q5 Premium Plus',
    details: 'Quattro AWD, virtual cockpit, Bang & Olufsen sound',
    price: 45500,
    views: 23,
    status: 'pending' as const,
    postedDate: '2025-01-20',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2e786a0b7e?w=400'
  },
  {
    id: 'lst_010',
    title: '2022 Mercedes-Benz GLE 350',
    details: 'AMG line, air suspension, premium interior',
    price: 68000,
    views: 45,
    status: 'pending' as const,
    postedDate: '2025-01-17',
    image: 'https://images.unsplash.com/photo-1563720360080-d56c840b19fa?w=400'
  },

  // Reported/Flagged Listings (treated as deleted with takedown info)
  {
    id: 'lst_011',
    title: '2019 Nissan Altima SR',
    details: 'Sport trim, remote start, leather seats',
    price: 19900,
    views: 567,
    status: 'deleted' as const,
    postedDate: '2025-01-08',
    image: 'https://images.unsplash.com/photo-1616422285838-75a7b90169a9?w=400',
    isReportedTakedown: true,
    takedownReason: 'Multiple reports: Suspected duplicate listing',
    reportCount: 5
  },
  {
    id: 'lst_012',
    title: '2020 Volkswagen Jetta GLI',
    details: 'Turbocharged, manual transmission, sport seats',
    price: 15500,
    views: 234,
    status: 'deleted' as const,
    postedDate: '2025-01-12',
    image: 'https://images.unsplash.com/photo-1609521263047-423d7123f0e8?w=400',
    isReportedTakedown: true,
    takedownReason: 'Reported: Pricing appears suspicious/too low',
    reportCount: 8
  },
  {
    id: 'lst_013',
    title: '2018 Hyundai Elantra Sport',
    details: 'Turbo engine, dual clutch, premium audio',
    price: 18200,
    views: 189,
    status: 'deleted' as const,
    postedDate: '2025-01-06',
    image: 'https://images.unsplash.com/photo-1553440569-bcc63302a7d3?w=400',
    isReportedTakedown: true,
    takedownReason: 'Flagged: VIN number doesn\'t match description',
    reportCount: 3
  }
]

// Helper function to get listings by status
export const getListingsByStatus = (status: 'active' | 'pending' | 'sold' | 'deleted') => {
  return sampleListings.filter(listing => listing.status === status)
}

// Helper function to get reported listings
export const getReportedListings = () => {
  return sampleListings.filter(listing => listing.isReportedTakedown === true)
}

// Summary statistics
export const listingStats = {
  total: sampleListings.length,
  active: sampleListings.filter(l => l.status === 'active').length,
  sold: sampleListings.filter(l => l.status === 'sold').length,
  underReview: sampleListings.filter(l => l.status === 'pending').length,
  reported: sampleListings.filter(l => l.isReportedTakedown === true).length,
  totalViews: sampleListings.reduce((sum, l) => sum + l.views, 0),
  averagePrice: Math.round(sampleListings.reduce((sum, l) => sum + l.price, 0) / sampleListings.length)
}