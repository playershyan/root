export const sampleConversations = [
  {
    id: 'conv_001',
    listing_id: 'lst_001',
    listing_title: '2021 Toyota Camry SE',
    listing_price: 28500,
    listing_image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400',
    buyer_id: 'buyer_001',
    seller_id: 'current_user',
    last_message_at: '2025-01-20T14:30:00',
    last_message_preview: 'Is this still available? I can come see it tomorrow.',
    unread_count: 2,
    is_archived: false,
    current_user_role: 'seller' as const,
    buyer: {
      profiles: {
        name: 'Michael Johnson',
        avatar_url: 'https://ui-avatars.com/api/?name=Michael+Johnson&background=3b82f6&color=fff'
      }
    },
    seller: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    }
  },
  {
    id: 'conv_002',
    listing_id: 'lst_002',
    listing_title: '2019 Honda Accord Sport',
    listing_price: 24900,
    listing_image_url: 'https://images.unsplash.com/photo-1619682817720-33d59e985fe3?w=400',
    buyer_id: 'buyer_002',
    seller_id: 'current_user',
    last_message_at: '2025-01-20T10:15:00',
    last_message_preview: 'Would you accept $23,500 cash?',
    unread_count: 1,
    is_archived: false,
    current_user_role: 'seller' as const,
    buyer: {
      profiles: {
        name: 'Sarah Williams',
        avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Williams&background=10b981&color=fff'
      }
    },
    seller: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    }
  },
  {
    id: 'conv_003',
    listing_id: 'lst_103',
    listing_title: '2020 BMW 3 Series',
    listing_price: 35900,
    listing_image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400',
    buyer_id: 'current_user',
    seller_id: 'seller_003',
    last_message_at: '2025-01-19T18:45:00',
    last_message_preview: 'Yes, we can schedule a test drive this weekend.',
    unread_count: 0,
    is_archived: false,
    current_user_role: 'buyer' as const,
    buyer: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    },
    seller: {
      profiles: {
        name: 'Premium Auto Sales',
        avatar_url: 'https://ui-avatars.com/api/?name=Premium+Auto&background=dc2626&color=fff'
      }
    }
  },
  {
    id: 'conv_004',
    listing_id: 'lst_003',
    listing_title: '2020 Mazda CX-5 AWD',
    listing_price: 31200,
    listing_image_url: 'https://images.unsplash.com/photo-1606611013016-969c19ba1be2?w=400',
    buyer_id: 'buyer_004',
    seller_id: 'current_user',
    last_message_at: '2025-01-19T09:20:00',
    last_message_preview: 'Thanks for the info! I need to think about it.',
    unread_count: 0,
    is_archived: false,
    current_user_role: 'seller' as const,
    buyer: {
      profiles: {
        name: 'Robert Chen',
        avatar_url: 'https://ui-avatars.com/api/?name=Robert+Chen&background=f59e0b&color=fff'
      }
    },
    seller: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    }
  },
  {
    id: 'conv_005',
    listing_id: 'lst_104',
    listing_title: '2018 Mercedes-Benz C300',
    listing_price: 29800,
    listing_image_url: 'https://images.unsplash.com/photo-1563720360080-d56c840b19fa?w=400',
    buyer_id: 'current_user',
    seller_id: 'seller_005',
    last_message_at: '2025-01-18T16:30:00',
    last_message_preview: 'The service records are all available.',
    unread_count: 0,
    is_archived: false,
    current_user_role: 'buyer' as const,
    buyer: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    },
    seller: {
      profiles: {
        name: 'David Martinez',
        avatar_url: 'https://ui-avatars.com/api/?name=David+Martinez&background=7c3aed&color=fff'
      }
    }
  },
  {
    id: 'conv_006',
    listing_id: 'lst_004',
    listing_title: '2022 Tesla Model 3',
    listing_price: 42000,
    listing_image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400',
    buyer_id: 'buyer_006',
    seller_id: 'current_user',
    last_message_at: '2025-01-17T11:00:00',
    last_message_preview: 'How many miles does it have?',
    unread_count: 3,
    is_archived: false,
    current_user_role: 'seller' as const,
    buyer: {
      profiles: {
        name: 'Emily Brown',
        avatar_url: 'https://ui-avatars.com/api/?name=Emily+Brown&background=ec4899&color=fff'
      }
    },
    seller: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    }
  },
  {
    id: 'conv_007',
    listing_id: 'lst_105',
    listing_title: '2019 Audi Q7',
    listing_price: 45500,
    listing_image_url: 'https://images.unsplash.com/photo-1606664515524-ed2e786a0b7e?w=400',
    buyer_id: 'current_user',
    seller_id: 'seller_007',
    last_message_at: '2025-01-15T13:45:00',
    last_message_preview: 'Sorry, that\'s below my minimum price.',
    unread_count: 0,
    is_archived: true,
    current_user_role: 'buyer' as const,
    buyer: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    },
    seller: {
      profiles: {
        name: 'Luxury Motors Inc',
        avatar_url: 'https://ui-avatars.com/api/?name=Luxury+Motors&background=059669&color=fff'
      }
    }
  },
  {
    id: 'conv_008',
    listing_id: 'lst_106',
    listing_title: '2021 Ford F-150',
    listing_price: 38900,
    listing_image_url: 'https://images.unsplash.com/photo-1581650107963-c8d1e0136394?w=400',
    buyer_id: 'current_user',
    seller_id: 'seller_008',
    last_message_at: '2025-01-10T08:30:00',
    last_message_preview: 'Great! See you Saturday at 2 PM.',
    unread_count: 0,
    is_archived: true,
    current_user_role: 'buyer' as const,
    buyer: {
      profiles: {
        name: 'You',
        avatar_url: ''
      }
    },
    seller: {
      profiles: {
        name: 'James Wilson',
        avatar_url: 'https://ui-avatars.com/api/?name=James+Wilson&background=0891b2&color=fff'
      }
    }
  }
]

// Helper functions
export const getActiveConversations = () => {
  return sampleConversations.filter(conv => !conv.is_archived)
}

export const getArchivedConversations = () => {
  return sampleConversations.filter(conv => conv.is_archived)
}

export const getUnreadCount = () => {
  return sampleConversations.reduce((sum, conv) => sum + conv.unread_count, 0)
}

export const getConversationsByRole = (role: 'buyer' | 'seller') => {
  return sampleConversations.filter(conv => conv.current_user_role === role)
}

// Message statistics
export const messageStats = {
  totalConversations: sampleConversations.length,
  activeConversations: sampleConversations.filter(c => !c.is_archived).length,
  archivedConversations: sampleConversations.filter(c => c.is_archived).length,
  totalUnread: sampleConversations.reduce((sum, c) => sum + c.unread_count, 0),
  asBuyer: sampleConversations.filter(c => c.current_user_role === 'buyer').length,
  asSeller: sampleConversations.filter(c => c.current_user_role === 'seller').length
}