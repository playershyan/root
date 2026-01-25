# Vera.lk - Comprehensive Technical Documentation

**Version**: 0.1.0
**Last Updated**: 2026-01-21
**Target Audience**: External engineers seeking end-to-end technical understanding
**Documentation Level**: Deep implementation details with code examples

---

## Table of Contents

1. [System Overview & Architecture](#1-system-overview--architecture)
   - 1.1 [Technology Stack](#11-technology-stack)
   - 1.2 [Project Structure](#12-project-structure)
   - 1.3 [System Architecture](#13-system-architecture)
   - 1.4 [Data Flow Patterns](#14-data-flow-patterns)
   - 1.5 [External Integrations](#15-external-integrations)
   - 1.6 [Deployment Architecture](#16-deployment-architecture)

2. [Core Infrastructure & Services](#2-core-infrastructure--services)
   - 2.1 [Authentication System](#21-authentication-system)
   - 2.2 [Security Services](#22-security-services)
   - 2.3 [Monitoring & Performance](#23-monitoring--performance)
   - 2.4 [Image Processing](#24-image-processing)
   - 2.5 [Phone Verification & SMS](#25-phone-verification--sms)

3. [Feature Documentation](#3-feature-documentation)
   - 3.1 [Vehicle Listings](#31-vehicle-listings)
   - 3.2 [Wanted Requests](#32-wanted-requests)
   - 3.3 [Promotion System](#33-promotion-system)
   - 3.4 [Messaging System](#34-messaging-system)
   - 3.5 [Business Profiles](#35-business-profiles)
   - 3.6 [Admin Dashboard](#36-admin-dashboard)

4. [API Reference](#4-api-reference)
   - 4.1 [Listings API](#41-listings-api)
   - 4.2 [Wanted Requests API](#42-wanted-requests-api)
   - 4.3 [Authentication API](#43-authentication-api)
   - 4.4 [Messaging API](#44-messaging-api)
   - 4.5 [Business Profile API](#45-business-profile-api)
   - 4.6 [AI Services API](#46-ai-services-api)
   - 4.7 [Promotions API](#47-promotions-api)
   - 4.8 [Upload API](#48-upload-api)
   - 4.9 [Admin API](#49-admin-api)

5. [Database Schema](#5-database-schema)
   - 5.1 [Core Business Tables](#51-core-business-tables)
   - 5.2 [User Management Tables](#52-user-management-tables)
   - 5.3 [Communication Tables](#53-communication-tables)
   - 5.4 [Admin & Monitoring Tables](#54-admin--monitoring-tables)
   - 5.5 [RLS Policies](#55-rls-policies)
   - 5.6 [Indexes & Performance](#56-indexes--performance)
   - 5.7 [Database Functions & Triggers](#57-database-functions--triggers)
   - 5.8 [Migration System](#58-migration-system)
   - 5.9 [Performance Optimization Case Study](#59-performance-optimization-case-study)

6. [Code Patterns & Conventions](#6-code-patterns--conventions)
   - 6.1 [Component Architecture](#61-component-architecture)
   - 6.2 [Form Handling](#62-form-handling)
   - 6.3 [Type System](#63-type-system)
   - 6.4 [Error Handling](#64-error-handling)
   - 6.5 [State Management](#65-state-management)

7. [Development Workflow](#7-development-workflow)
   - 7.1 [Local Development](#71-local-development)
   - 7.2 [Testing](#72-testing)
   - 7.3 [Database Development](#73-database-development)
   - 7.4 [Deployment](#74-deployment)

---

## 1. System Overview & Architecture

### 1.1 Technology Stack

Vera.lk is a modern vehicle marketplace application built with the following technology stack:

#### Frontend Framework
- **Next.js 14.2.31** with App Router (App Directory structure)
- **React 18.3.1** with Server Components and Client Components
- **TypeScript 5.5.3** for type safety
- **Tailwind CSS 3.4.6** for styling
- **Radix UI** for accessible component primitives
- **Lucide React** for icons

#### Backend & Database
- **Supabase** (PostgreSQL) for database and authentication
  - `@supabase/supabase-js` 2.45.0 - JavaScript client
  - `@supabase/ssr` 0.6.1 - Server-side rendering support
  - `@supabase/auth-helpers-nextjs` 0.10.0 - Next.js auth helpers
- **Supabase Auth** with multi-provider support (Email, Google OAuth, Phone OTP)
- **Row Level Security (RLS)** for data access control

#### External Services
- **Cloudinary 2.7.0** - Image storage and optimization
- **Google Generative AI 0.16.0** - AI description generation (Gemini)
- **Text.lk** - SMS gateway for OTP verification
- **Sentry** (`@sentry/nextjs` 10.25.0) - Error tracking and performance monitoring
- **Upstash** - Redis for rate limiting (`@upstash/ratelimit` 2.0.6, `@upstash/redis` 1.35.3)

#### Build & Deployment
- **Vercel** with standalone output mode
- **SWC** for minification
- **Critters 0.0.24** for critical CSS inlining
- **Sentry MCP Server** for monitoring integration

#### Mobile (Capacitor)
- **@capacitor/core** 7.4.4 - Native mobile bridge
- **@capacitor/android** 7.4.4 - Android platform
- Camera, Push Notifications, Network, Filesystem plugins

#### Testing
- **Jest 30.1.3** - Unit and integration testing
- **@testing-library/react** 16.3.0 - Component testing
- **Playwright** - E2E testing
- **70% coverage threshold** across all metrics

#### Development Tools
- **ESLint** with Next.js config
- **Autoprefixer** for CSS vendor prefixes
- **dotenv** for environment variables

---

### 1.2 Project Structure

```
vera.lk/
├── app/                                # Next.js App Router (pages & API routes)
│   ├── (auth)/                         # Auth pages (login, signup, verify-phone)
│   ├── admin/                          # Admin dashboard
│   │   ├── page.tsx                    # Dashboard overview
│   │   ├── listings/                   # Listing management
│   │   ├── business/                   # Business profile management
│   │   ├── users/                      # User management
│   │   ├── wanted-requests/            # Wanted request moderation
│   │   ├── analytics/                  # Platform analytics
│   │   ├── reports/                    # Reports & insights
│   │   ├── bulk-import/                # Bulk data import
│   │   └── components/                 # Admin UI components
│   ├── api/                            # API routes
│   │   ├── listings/                   # Listing CRUD + operations
│   │   ├── wanted-requests/            # Wanted request CRUD
│   │   ├── messages/                   # Messaging API
│   │   ├── business-profile/           # Business profile CRUD
│   │   ├── ai-description/             # AI description generation
│   │   ├── promotions/                 # Promotion checking
│   │   ├── upload/                     # Image uploads
│   │   ├── auth/                       # Auth endpoints (OTP, callback)
│   │   ├── admin/                      # Admin operations
│   │   └── search/                     # Search functionality
│   ├── listings/                       # Listing browse & detail pages
│   │   ├── page.tsx                    # Browse listings (server-rendered)
│   │   ├── [id]/                       # Single listing detail
│   │   └── _components/                # Listing-specific components
│   ├── wanted/                         # Wanted requests
│   │   ├── page.tsx                    # Browse wanted requests
│   │   ├── post/                       # Create wanted request
│   │   ├── [id]/                       # View single request
│   │   ├── edit/                       # Edit request
│   │   └── components/                 # SearchBar, FilterPanel, Cards
│   ├── post/                           # Listing creation
│   │   ├── page.tsx                    # Main form (2,144 lines)
│   │   ├── boost/                      # Promotion options
│   │   └── paid-features/              # Promotion checkout (disabled)
│   ├── messages/                       # Messaging system
│   │   ├── [conversationId]/page.tsx   # Conversation thread
│   │   └── utils/                      # Message fetching logic
│   ├── profile/                        # User profile pages
│   │   ├── page.tsx                    # Profile dashboard
│   │   ├── business/                   # Business profile management
│   │   ├── account/                    # Account settings
│   │   ├── listings/                   # My listings
│   │   ├── messages/                   # My conversations
│   │   ├── favorites/                  # Saved listings
│   │   └── wanted/                     # My wanted requests
│   ├── components/                     # Shared React components
│   │   ├── listings/                   # Listing cards, detail view
│   │   ├── messages/                   # Message components
│   │   ├── messaging/                  # Chat UI
│   │   ├── vehicle-forms/              # Dynamic vehicle forms
│   │   ├── wantedRequests/             # Wanted request cards
│   │   ├── auth/                       # Auth UI
│   │   ├── modals/                     # Modal components
│   │   ├── filters/                    # Filter panels
│   │   ├── payments/                   # Payment UI
│   │   └── profile/                    # Profile components
│   ├── contexts/                       # React contexts
│   │   ├── AuthContext.tsx             # Authentication state
│   │   └── FavoritesContext.tsx        # Favorites state
│   ├── hooks/                          # App-level hooks
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Homepage
│   └── globals.css                     # Global styles
│
├── lib/                                # Core business logic & utilities
│   ├── supabase.ts                     # Client Supabase client
│   ├── supabase-server.ts              # Server Supabase clients
│   ├── auth.ts                         # Auth utility functions
│   ├── types.ts                        # TypeScript type definitions
│   ├── cloudinary.ts                   # Cloudinary service
│   ├── config/                         # Configuration files
│   │   └── auth.config.ts              # Auth configuration
│   ├── server/                         # Server-only utilities
│   │   └── admin-auth.ts               # Admin authentication
│   ├── middleware/                     # Express-style middleware
│   │   ├── rateLimiter.ts              # Rate limiting
│   │   ├── csrfProtection.ts           # CSRF protection
│   │   └── adminAuth.ts                # Admin auth middleware
│   ├── security/                       # Security utilities
│   │   ├── recaptcha.ts                # reCAPTCHA verification
│   │   └── metrics.ts                  # Security metrics
│   ├── monitoring/                     # Performance & alerts
│   │   ├── metrics.ts                  # Performance monitoring
│   │   ├── alerts.ts                   # Alert management
│   │   └── uptime.ts                   # Uptime monitoring
│   ├── services/                       # Business logic services
│   │   ├── descriptionBuilder.ts       # AI description builder
│   │   ├── textlkService.ts            # SMS gateway
│   │   └── rotationService.ts          # Promotion rotation
│   ├── hooks/                          # Custom React hooks
│   │   ├── useUserProfile.ts           # User profile hook
│   │   ├── usePhoneVerification.ts     # Phone OTP hook
│   │   ├── useRotatedPromotions.ts     # Promotion rotation
│   │   ├── useFavorites.ts             # Favorites management
│   │   ├── useImageCapabilities.ts     # Image format detection
│   │   ├── usePromotedListings.ts      # Featured listings
│   │   ├── useUnreadMessages.ts        # Message notifications
│   │   └── useUnsavedChangesWarning.ts # Form unsaved data alert
│   ├── validation/                     # Input validation
│   │   ├── validateListing.ts          # Listing validation
│   │   └── validateWantedRequest.ts    # Wanted request validation
│   ├── utils/                          # Utility functions
│   │   ├── logger.ts                   # Logging utility
│   │   ├── phoneFormatter.ts           # Phone normalization
│   │   ├── responsive-images.ts        # Image URL generation
│   │   └── apiClient.ts                # HTTP request wrapper
│   └── constants/                      # Static data
│
├── database-migrations/                # Supabase migrations (42 files)
│   ├── 001_*.sql                       # Core feature tables
│   ├── 005_*.sql                       # Security fixes
│   ├── 006_*.sql                       # Admin dashboard
│   ├── 007-009_*.sql                   # Performance optimization
│   └── 2025*.sql                       # Recent features
│
├── docs/                               # Project documentation
│   ├── database/                       # Database docs
│   │   └── SUPABASE_DATABASE_ANALYSIS.md
│   ├── performance/                    # Performance docs
│   │   └── PERFORMANCE_OPTIMIZATION_SUMMARY.md
│   ├── architecture/                   # Architecture docs
│   │   └── PERMANENT_DELETION_SYSTEM.md
│   └── TECHNICAL_DOCUMENTATION.md      # This file
│
├── tests/                              # Test suites
│   ├── unit/                           # Unit tests
│   ├── integration/                    # Integration tests
│   └── e2e/                            # End-to-end tests
│
├── scripts/                            # Utility scripts
│   ├── migrate-images-to-cloudinary.ts
│   ├── generate-buying-guides.ts
│   └── clean-expired-guides.ts
│
├── server.js                           # Custom Node.js server
├── next.config.js                      # Next.js configuration
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── tailwind.config.js                  # Tailwind config
├── jest.config.js                      # Jest config
└── CLAUDE.md                           # Claude Code instructions
```

---

### 1.3 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Browser    │  │   Mobile     │  │   PWA        │  │  Capacitor   │    │
│  │   (Web)      │  │   (Web)      │  │              │  │   (Native)   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │                  │            │
│         └──────────────────┴──────────────────┴──────────────────┘            │
│                                      │                                        │
└──────────────────────────────────────┼────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER (Next.js)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Server Components (SSR/ISR)                      │    │
│  │  • Listings feed (120s revalidation)                                │    │
│  │  • Wanted requests (30s revalidation)                               │    │
│  │  • Admin dashboard                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Client Components (CSR)                          │    │
│  │  • Interactive forms (listing creation, wanted requests)            │    │
│  │  • Real-time messaging                                              │    │
│  │  • User dashboards                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       API Routes (REST)                             │    │
│  │  /api/listings  /api/wanted-requests  /api/messages                │    │
│  │  /api/auth      /api/business-profile /api/promotions              │    │
│  │  /api/upload    /api/ai-description   /api/admin                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────┬──────────────────────────────┬───────────────────────┘
                        │                              │
                        ▼                              ▼
┌───────────────────────────────────┐  ┌──────────────────────────────────────┐
│     MIDDLEWARE LAYER              │  │      SERVICE LAYER                   │
├───────────────────────────────────┤  ├──────────────────────────────────────┤
│                                   │  │                                      │
│  • Rate Limiting                  │  │  • Authentication (Multi-provider)   │
│    (LRU + Upstash Redis)          │  │  • Image Processing (Cloudinary)     │
│  • CSRF Protection                │  │  • SMS Gateway (Text.lk)             │
│  • Admin Auth                     │  │  • AI Description Builder            │
│  • reCAPTCHA Verification         │  │  • Promotion Rotation Service        │
│  • Performance Monitoring         │  │  • Security Metrics                  │
│                                   │  │                                      │
└───────────────┬───────────────────┘  └──────────────┬───────────────────────┘
                │                                     │
                └─────────────────┬───────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER (Supabase)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                   PostgreSQL Database (45 tables)                 │       │
│  │  • Core: listings, wanted_requests, promotions                   │       │
│  │  • User: profiles, business_profiles, admin_users                │       │
│  │  • Comms: conversations, messages, offers                        │       │
│  │  • Admin: activity_log, system_alerts, metrics                   │       │
│  │  • Security: user_sessions, phone_verifications                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │              Row Level Security (RLS) Policies                    │       │
│  │  • User-scoped access (listings, wanted_requests)                │       │
│  │  • Admin-only tables (deletion_safety_config, admin_users)       │       │
│  │  • Conversation isolation (buyer/seller access only)             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                   Performance Optimizations                       │       │
│  │  • Composite indexes (duplicate check, active feed)              │       │
│  │  • RLS auth.uid() caching (76% perf improvement)                 │       │
│  │  • Policy consolidation (20-30% faster)                          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    Supabase Auth                                  │       │
│  │  • Email/Password                                                 │       │
│  │  • Google OAuth                                                   │       │
│  │  • Session management                                             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    Supabase Storage                               │       │
│  │  • Listings bucket (images)                                       │       │
│  │  • Public access with RLS                                         │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │  Cloudinary   │  │  Google       │  │  Text.lk      │  │   Sentry     │ │
│  │  (Images)     │  │  Gemini AI    │  │  (SMS OTP)    │  │  (Monitoring)│ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘ │
│                                                                               │
│  ┌───────────────┐  ┌───────────────┐                                       │
│  │  Upstash      │  │  Vercel       │                                       │
│  │  Redis        │  │  (Hosting)    │                                       │
│  └───────────────┘  └───────────────┘                                       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.4 Data Flow Patterns

#### Pattern 1: Listing Creation Flow

```
User Form Input
    │
    ▼
┌─────────────────────────────────────────┐
│  app/post/page.tsx (Client Component)   │
│  • Multi-step form (2,144 lines)        │
│  • Vehicle type selection                │
│  • Dynamic field validation              │
│  • Draft auto-save to localStorage       │
└─────────────────┬───────────────────────┘
                  │
                  ├─ Images? ──────────────────┐
                  │                             │
                  │                             ▼
                  │               POST /api/upload/cloudinary
                  │                             │
                  │                             ▼
                  │               ┌──────────────────────────┐
                  │               │  Cloudinary Upload       │
                  │               │  • WebP compression      │
                  │               │  • 200KB target          │
                  │               │  • Returns publicId+URL  │
                  │               └──────────┬───────────────┘
                  │                          │
                  │◄─────────────────────────┘
                  │ (image URLs)
                  │
                  ▼
          POST /api/listings
                  │
                  ▼
┌─────────────────────────────────────────┐
│  API Route Handler                      │
│  • Rate limiting (api: 100/min)         │
│  • Auth check (required)                │
│  • Validation (validateListing)         │
│  • Sanitization                         │
│  • Phone verification check             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Database Insert                        │
│  • create_listing_v2(payload JSONB)     │
│  • Duplicate check (composite index)    │
│  • RLS policy enforcement               │
│  • Returns {id, status}                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
            Success Response
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Client Redirect                        │
│  • Success popup                        │
│  • Navigate to /profile                 │
└─────────────────────────────────────────┘
```

#### Pattern 2: Listings Feed Rendering (Server-Side)

```
GET /listings?page=1&filters={...}
          │
          ▼
┌─────────────────────────────────────────┐
│  app/listings/page.tsx                  │
│  (Server Component - ISR 120s)          │
│  • Server-side data fetching            │
│  • No client-side JS needed for render  │
└─────────────────┬───────────────────────┘
                  │
                  ├─ getListingsFeed() ────┐
                  │                         │
                  │                         ▼
                  │         ┌────────────────────────────┐
                  │         │  Supabase Query            │
                  │         │  • status='active'         │
                  │         │  • is_sold=false           │
                  │         │  • Pagination (24/page)    │
                  │         │  • Filters applied         │
                  │         │  • ORDER BY created_at DESC│
                  │         └────────┬───────────────────┘
                  │                  │
                  │◄─────────────────┘
                  │ (regular listings)
                  │
                  ├─ getPromotedSlots() ───┐
                  │                         │
                  │                         ▼
                  │         ┌────────────────────────────┐
                  │         │  Promotion Rotation Query  │
                  │         │  • Featured (2 slots)      │
                  │         │  • Top spots               │
                  │         │  • Boosted listings        │
                  │         │  • Fair share algorithm    │
                  │         └────────┬───────────────────┘
                  │                  │
                  │◄─────────────────┘
                  │ (promoted listings)
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Render HTML                            │
│  • Featured listings (top 2)            │
│  • Regular listings (24 items)          │
│  • Pagination controls                  │
│  • Hydrate to ListingsPageClient        │
└─────────────────────────────────────────┘
          │
          ▼
    Send to Browser
```

#### Pattern 3: Phone OTP Verification Flow

```
User Updates Phone Number
          │
          ▼
┌─────────────────────────────────────────┐
│  usePhoneVerification() hook            │
│  • sendOTP(phone)                       │
│  • Authenticated users only             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
POST /api/auth/send-phone-otp
          │
          ▼
┌─────────────────────────────────────────┐
│  API Handler                            │
│  • Auth check (required)                │
│  • Rate limit (3 OTP/hour per phone)    │
│  • Normalize phone (94XXXXXXXXX)        │
│  • Generate 6-digit OTP                 │
│  • Store in phone_verifications table   │
│  • Expiry: 10 minutes                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Text.lk SMS Service                    │
│  • sendOTP(phone, otp)                  │
│  • Sri Lanka format (+94)               │
│  • Dev mode: logs without sending       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
          SMS sent to user
                  │
                  ▼
     User enters OTP code
                  │
                  ▼
POST /api/auth/verify-phone-otp
          │
          ▼
┌─────────────────────────────────────────┐
│  API Handler                            │
│  • Lookup verification record           │
│  • Check expiry (10 min)                │
│  • Verify code                          │
│  • Mark verified (if purpose='profile') │
│  • Delete verification record           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Success Response                       │
│  • verified: true                       │
│  • Update profile/listing               │
└─────────────────────────────────────────┘
```

---

### 1.5 External Integrations

#### Cloudinary (Image Processing)
- **Purpose**: Image storage, optimization, and transformation
- **Configuration**: Environment variables in `.env`
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- **Features**:
  - Upload: buffer/string to cloud
  - Formats: Auto-detection (WebP/AVIF)
  - Optimization: Progressive JPEG, DPR auto
  - Transformations: Watermarking, resizing
  - Cache: Immutable URLs (1-year TTL)
- **Implementation**: `lib/cloudinary.ts`, `lib/utils/responsive-images.ts`

#### Google Gemini AI
- **Purpose**: AI description generation (currently using local builder)
- **Configuration**:
  ```
  GOOGLE_AI_API_KEY=your_api_key
  ```
- **Features**:
  - Description generation from vehicle data
  - Buying guide generation (cached)
- **Implementation**: `app/api/ai-description/route.ts`, `lib/services/descriptionBuilder.ts`

#### Text.lk SMS Gateway
- **Purpose**: OTP delivery for phone verification
- **Configuration**:
  ```
  TEXTLK_API_KEY=your_api_key
  TEXTLK_SENDER_ID=your_sender_id (max 11 chars)
  ```
- **Features**:
  - Send OTP codes
  - Campaign messaging
  - Delivery status tracking
  - Balance checking
- **Implementation**: `lib/services/textlkService.ts`

#### Sentry (Error Tracking & Performance Monitoring)
- **Purpose**: Error tracking, performance monitoring, uptime monitoring
- **Configuration**:
  ```
  SENTRY_DSN=your_dsn
  SENTRY_ORG=your_org
  SENTRY_PROJECT=your_project
  SENTRY_BUNDLER_ENABLED=true (optional)
  ```
- **Features**:
  - Error tracking with stack traces
  - Performance monitoring (API response times, DB queries)
  - Alert management
  - Automatic Vercel Cron Monitors
  - MCP server integration (`@sentry/mcp-server`)
- **Implementation**: `lib/monitoring/metrics.ts`, `lib/monitoring/alerts.ts`, `mcp-sentry.config.js`

#### Upstash Redis
- **Purpose**: Distributed rate limiting
- **Configuration**:
  ```
  UPSTASH_REDIS_REST_URL=your_url
  UPSTASH_REDIS_REST_TOKEN=your_token
  ```
- **Features**:
  - Distributed rate limiting across instances
  - Fallback to LRU cache if unavailable
  - TTL-based expiry
- **Implementation**: `lib/middleware/rateLimiter.ts`

#### Supabase
- **Purpose**: Database, authentication, storage
- **Configuration**:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
- **Features**:
  - PostgreSQL database (45 tables)
  - Row Level Security (RLS)
  - Authentication (Email, Google OAuth)
  - Storage (images in listings bucket)
  - Real-time subscriptions (if enabled)
- **Implementation**: `lib/supabase.ts`, `lib/supabase-server.ts`

---

### 1.6 Deployment Architecture

#### Vercel Platform
- **Build Output**: `standalone` mode (optimized for serverless)
- **Build Command**: `npm run build`
- **Start Command**: `NODE_ENV=production node server.js`
- **Node Version**: 20.x
- **Regions**: Automatic (based on Vercel configuration)

#### Build Optimizations
```javascript
// next.config.js
{
  output: 'standalone',              // Standalone deployment
  swcMinify: true,                   // SWC minification
  compress: true,                    // Gzip compression
  optimizeFonts: true,               // Font optimization
  experimental: {
    optimizeCss: true,               // CSS optimization
    instrumentationHook: true,       // Sentry instrumentation
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 31536000,       // 1-year cache for immutable URLs
  }
}
```

#### Security Headers
```javascript
// Configured in next.config.js headers()
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' // Production only
}
```

#### Environment Variables
Required for deployment:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google AI
GOOGLE_AI_API_KEY=

# SMS Gateway
TEXTLK_API_KEY=
TEXTLK_SENDER_ID=

# Sentry
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# Upstash Redis (optional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# reCAPTCHA (optional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RECAPTCHA_ENABLED=true
```

#### Cron Jobs (Vercel Cron)
Configured for:
- Daily cleanup at 2:00 AM UTC (permanent deletion)
- Weekly summary on Mondays at 9:00 AM UTC
- Uptime monitoring integration with Sentry

---

## 2. Core Infrastructure & Services

### 2.1 Authentication System

Vera.lk implements a multi-provider authentication system using Supabase Auth with three authentication flows: Email/Password, Google OAuth, and Phone OTP (for profile updates only).

#### 2.1.1 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT-SIDE AUTHENTICATION                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  AuthContext (app/contexts/AuthContext.tsx)                    │    │
│  │  • Provides: { user, loading, signOut }                        │    │
│  │  • Uses: createClientComponentClient() from Supabase           │    │
│  │  • Auto-refreshes on auth state change                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  useAuth() Hook                                                 │    │
│  │  • Returns: { user, loading, signOut }                         │    │
│  │  • Usage: const { user } = useAuth()                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  useUserProfile() Hook (lib/hooks/useUserProfile.ts)           │    │
│  │  • Fetches full user profile from database                     │    │
│  │  • Includes business profile (left join)                       │    │
│  │  • Auto-creates profile if missing                             │    │
│  │  • Returns: { profile, loading, error, refetch,                │    │
│  │             getPhoneNumber, getWhatsAppNumber }                │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                      SERVER-SIDE AUTHENTICATION                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  createServerSupabaseClient() - lib/supabase-server.ts         │    │
│  │  • Server component client                                     │    │
│  │  • Respects RLS policies                                       │    │
│  │  • Uses cookies for session                                    │    │
│  │  • Usage: await createServerSupabaseClient()                   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  createServiceSupabaseClient() - lib/supabase-server.ts        │    │
│  │  • Service role client (bypasses RLS)                          │    │
│  │  • Admin operations only                                       │    │
│  │  • Full database access                                        │    │
│  │  • Usage: const supabase = createServiceSupabaseClient()       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  createAuthenticatedSupabaseClient() - lib/supabase-server.ts  │    │
│  │  • Authenticated user-level client                             │    │
│  │  • Respects RLS for current user                               │    │
│  │  • For API routes                                              │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 Email/Password Authentication

**Implementation**: `lib/auth.ts`

```typescript
// Sign up with email
export async function signUp(email: string, password: string, metadata?: any) {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: metadata, // Additional user metadata
    }
  })

  if (!error && data.user) {
    // Auto-create profile
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      ...metadata
    })
  }

  return { data, error }
}

// Sign in with email
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Sign out
export async function signOut() {
  const supabase = createClientComponentClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

**Features**:
- Email verification required (default Supabase behavior)
- Resend email verification: `resendEmailVerification(email)`
- Password reset flow
- Profile auto-creation on signup

#### 2.1.3 Google OAuth

**Implementation**: `lib/auth.ts`

```typescript
export async function signInWithGoogle() {
  const supabase = createClientComponentClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}
```

**OAuth Callback**: `app/api/auth/callback/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to app
  return NextResponse.redirect(requestUrl.origin)
}
```

**Configuration**: `lib/config/auth.config.ts`
```typescript
export const authConfig = {
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
  },
}
```

**Supabase Console Configuration**:
1. Enable Google provider in Authentication > Providers
2. Add OAuth credentials (Client ID, Client Secret)
3. Add redirect URL: `https://[project-id].supabase.co/auth/v1/callback`
4. Google Cloud Console: Add authorized redirect URI

#### 2.1.4 Phone OTP (Profile Update Only)

**Status**: Phone authentication for login is disabled. OTP is now only used for updating phone numbers in profiles, listings, and wanted requests.

**Implementation**: `lib/hooks/usePhoneVerification.ts`

```typescript
export function usePhoneVerification(options: { purpose: 'profile' | 'listing' | 'wanted' }) {
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOTP = async (phone: string) => {
    setIsSending(true)
    setError(null)

    const response = await fetch('/api/auth/send-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, purpose: options.purpose }),
    })

    const data = await response.json()
    setIsSending(false)

    if (!response.ok) {
      setError(data.error)
      return { success: false }
    }

    return { success: true }
  }

  const verifyOTP = async (phone: string, otp: string) => {
    setIsVerifying(true)
    setError(null)

    const response = await fetch('/api/auth/verify-phone-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, purpose: options.purpose }),
    })

    const data = await response.json()
    setIsVerifying(false)

    if (!response.ok) {
      setError(data.error)
      return { success: false, verified: false }
    }

    return { success: true, verified: data.verified }
  }

  return { sendOTP, verifyOTP, isSending, isVerifying, error }
}
```

**API Endpoints**:

`POST /api/auth/send-phone-otp`:
```typescript
// app/api/auth/send-phone-otp/route.ts
export async function POST(request: Request) {
  // 1. Auth check (must be authenticated)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // 2. Rate limiting (3 OTP per hour per phone/user)
  const { phone, purpose } = await request.json()
  const normalizedPhone = normalizeSriLankaPhone(phone)

  // 3. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 4. Store in phone_verifications table
  await supabase.from('phone_verifications').insert({
    user_id: user.id,
    phone: normalizedPhone,
    otp: await hashOTP(otp), // bcrypt hash
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    purpose,
  })

  // 5. Send SMS via Text.lk
  await textlkService.sendOTP(normalizedPhone, otp)

  return json({ success: true })
}
```

`POST /api/auth/verify-phone-otp`:
```typescript
// app/api/auth/verify-phone-otp/route.ts
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { phone, otp, purpose } = await request.json()
  const normalizedPhone = normalizeSriLankaPhone(phone)

  // 1. Lookup verification record
  const { data: verification } = await supabase
    .from('phone_verifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('phone', normalizedPhone)
    .single()

  if (!verification) {
    return json({ error: 'Verification not found' }, { status: 404 })
  }

  // 2. Check expiry (10 minutes)
  if (new Date(verification.expires_at) < new Date()) {
    return json({ error: 'OTP expired' }, { status: 400 })
  }

  // 3. Verify OTP
  const isValid = await verifyOTP(otp, verification.otp)
  if (!isValid) {
    return json({ error: 'Invalid OTP' }, { status: 400 })
  }

  // 4. Mark verified if purpose is 'profile'
  if (purpose === 'profile') {
    await supabase.from('profiles').update({
      phone: normalizedPhone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    }).eq('id', user.id)
  }

  // 5. Delete verification record
  await supabase.from('phone_verifications').delete().eq('id', verification.id)

  return json({ success: true, verified: true })
}
```

**Phone Normalization**: `lib/utils/phoneFormatter.ts`
```typescript
// Canonical format: 94XXXXXXXXX (11 digits, no +, no leading 0)
export function normalizeSriLankaPhone(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')

  // Handle different input formats
  if (digits.startsWith('94')) {
    return digits.substring(0, 11) // 94XXXXXXXXX
  } else if (digits.startsWith('0')) {
    return '94' + digits.substring(1, 10) // 0XXXXXXXXX → 94XXXXXXXXX
  } else if (digits.length === 9) {
    return '94' + digits // XXXXXXXXX → 94XXXXXXXXX
  }

  throw new Error('Invalid Sri Lankan phone number format')
}

export function isValidSriLankanPhone(normalized: string): boolean {
  return /^94[0-9]{9}$/.test(normalized)
}

export function formatPhoneDisplay(phone: string): string {
  // 94771234567 → +94 77 123 4567
  if (!phone.startsWith('94')) return phone
  return `+${phone.substring(0, 2)} ${phone.substring(2, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`
}
```

#### 2.1.5 Session Management

**Middleware Route Protection**: Automatic in Next.js middleware
```typescript
// middleware.ts (implicit via Supabase)
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedRoutes = ['/profile', '/post', '/wanted/post', '/messages', '/admin']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtected) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}
```

**Session Token Handling**:
- Stored in HTTP-only cookies (`sb-access-token`, `sb-refresh-token`)
- Auto-refresh by Supabase client
- Expires after 1 hour (access token)
- Refresh token valid for 30 days

#### 2.1.6 Admin Authentication

**Implementation**: `lib/server/admin-auth.ts`

```typescript
export async function ensureAdmin(permission?: string): Promise<{
  user: User
  adminUser: AdminUser
  hasPermission: (perm: string) => boolean
}> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin_users table or has_admin_access RPC
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    // Fallback to RPC
    const { data: hasAccess } = await supabase.rpc('has_admin_access')
    if (!hasAccess) {
      redirect('/unauthorized')
    }
  }

  const hasPermission = (perm: string) => {
    if (adminUser.role === 'admin') return true // Admin has all permissions
    return adminUser.permissions?.includes(perm) ?? false
  }

  if (permission && !hasPermission(permission)) {
    redirect('/unauthorized')
  }

  return { user, adminUser, hasPermission }
}
```

**Usage in Admin Pages**:
```typescript
// app/admin/page.tsx
export default async function AdminDashboard() {
  const { adminUser } = await ensureAdmin('view_dashboard')

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {adminUser.role}</p>
    </div>
  )
}
```

**Admin Roles**:
- `admin`: Full access to all features
- `moderator`: Content moderation only
- `reviewer`: Read-only access for review

**Permissions** (stored in JSONB):
```json
{
  "permissions": [
    "view_dashboard",
    "manage_listings",
    "manage_users",
    "manage_wanted_requests",
    "view_analytics",
    "bulk_import",
    "manage_business_profiles"
  ]
}
```

#### 2.1.7 RLS Integration

**Standard Pattern** (76% performance improvement):
```sql
-- User-specific access
CREATE POLICY "Users can view own listings"
ON listings FOR SELECT
USING (user_id = (select auth.uid()));

-- Admin access
CREATE POLICY "Admins can view all listings"
ON listings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = (select auth.uid())
    AND admin_users.is_active = true
  )
);
```

**Key Optimization**: Wrap `auth.uid()` in `(select auth.uid())` to cache evaluation per query instead of per row.

---

### 2.2 Security Services

#### 2.2.1 Rate Limiting

**Architecture**: LRU cache with Upstash Redis fallback

**Implementation**: `lib/middleware/rateLimiter.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { LRUCache } from 'lru-cache'

// Upstash Redis client (optional)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// In-memory LRU cache fallback
const cache = new LRUCache<string, number>({
  max: 500, // Max 500 entries
  ttl: 60 * 1000, // 1 minute TTL
})

// Pre-configured rate limiters
export const rateLimiters = {
  // General API: 100 requests per minute
  api: createRateLimiter({ requests: 100, window: '1 m' }),

  // Auth: 5 attempts per 15 minutes
  auth: createRateLimiter({ requests: 5, window: '15 m' }),

  // Search: 30 requests per minute
  search: createRateLimiter({ requests: 30, window: '1 m' }),

  // Upload: 15 uploads per minute
  upload: createRateLimiter({ requests: 15, window: '1 m' }),

  // Messaging: 20 messages per minute
  messaging: createRateLimiter({ requests: 20, window: '1 m' }),

  // AI: 10 requests per minute
  ai: createRateLimiter({
    requests: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '10'),
    window: '1 m'
  }),

  // AI Daily: 100 per day
  aiDaily: createRateLimiter({
    requests: parseInt(process.env.AI_DAILY_LIMIT || '100'),
    window: '1 d'
  }),

  // Admin: 50 requests per minute
  admin: createRateLimiter({ requests: 50, window: '1 m' }),

  // Strict: 20 requests per 15 minutes
  strict: createRateLimiter({ requests: 20, window: '15 m' }),
}

function createRateLimiter(config: { requests: number; window: string }) {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
    })
  }

  // LRU fallback
  return {
    async limit(identifier: string) {
      const key = `${identifier}:${config.window}`
      const count = cache.get(key) || 0

      if (count >= config.requests) {
        return {
          success: false,
          limit: config.requests,
          remaining: 0,
          reset: Date.now() + parseWindow(config.window),
        }
      }

      cache.set(key, count + 1)
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests - count - 1,
        reset: Date.now() + parseWindow(config.window),
      }
    },
  }
}

// Usage in API routes
export async function withRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>,
  identifier?: string
) {
  // Identifier: IP + user token hash
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const token = request.headers.get('authorization')?.split(' ')[1]
  const tokenPrefix = token ? token.substring(0, 8) : 'anon'
  const key = identifier || `${ip}:${tokenPrefix}`

  const result = await limiter.limit(key)

  if (!result.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      },
    })
  }

  return null // No rate limit hit
}
```

**Usage Example**:
```typescript
// app/api/listings/route.ts
export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResponse = await withRateLimit(request, rateLimiters.api)
  if (rateLimitResponse) return rateLimitResponse

  // Process request
  // ...
}
```

**Quarantine System** (automatic IP blocking):
```typescript
// Track offenders
const offenderMap = new Map<string, number>()

export function trackOffender(ip: string) {
  const strikes = offenderMap.get(ip) || 0
  offenderMap.set(ip, strikes + 1)

  // Auto-block after 10 strikes
  if (strikes >= 10) {
    // Add to blacklist or trigger alert
    console.warn(`IP ${ip} quarantined after ${strikes} violations`)
  }
}
```

---

#### 2.2.2 CSRF Protection

**Implementation**: `lib/middleware/csrfProtection.ts`

```typescript
import { randomBytes, timingSafeEqual } from 'crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key'

// Generate CSRF token
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

// Hash token with secret (optional)
export function hashToken(token: string): string {
  if (!CSRF_SECRET) return token
  const hmac = createHmac('sha256', CSRF_SECRET)
  hmac.update(token)
  return hmac.digest('hex')
}

// Verify CSRF token
export function verifyCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected) return false

  const tokenBuf = Buffer.from(token, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')

  if (tokenBuf.length !== expectedBuf.length) return false

  return timingSafeEqual(tokenBuf, expectedBuf)
}

// Middleware for API routes
export async function csrfProtection(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  const method = request.method

  // Exempt routes
  const exemptRoutes = ['/api/auth/callback', '/api/webhooks', '/api/cron']
  if (exemptRoutes.some(route => pathname.startsWith(route))) {
    return null
  }

  // Only protect state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null
  }

  // Get token from header or form field
  const headerToken = request.headers.get('x-csrf-token')
  const cookieToken = getCookie(request, 'csrf-token')

  if (!headerToken || !verifyCSRFToken(headerToken, cookieToken)) {
    return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
    })
  }

  return null
}
```

**Token Storage**:
- Cookie: `csrf-token` (HttpOnly, SameSite=Strict)
- Header: `x-csrf-token` or form field `_csrf`

**Token Generation** (on page load):
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  const token = generateCSRFToken()
  cookies().set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  return (
    <html>
      <head>
        <meta name="csrf-token" content={token} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Client-Side Usage**:
```typescript
// Fetch with CSRF token
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

fetch('/api/listings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify(data),
})
```

---

#### 2.2.3 reCAPTCHA Verification

**Implementation**: `lib/security/recaptcha.ts`

```typescript
export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<{
  success: boolean
  score?: number
  action?: string
  error?: string
}> {
  if (!process.env.RECAPTCHA_SECRET_KEY || process.env.RECAPTCHA_ENABLED !== 'true') {
    return { success: true } // Disabled in dev
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: token,
    }),
  })

  const data = await response.json()

  if (!data.success) {
    return { success: false, error: 'reCAPTCHA verification failed' }
  }

  // v3: Check score threshold
  if (data.score !== undefined) {
    const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5')
    if (data.score < threshold) {
      return { success: false, score: data.score, error: 'Low reCAPTCHA score' }
    }
  }

  // v3: Verify action
  if (expectedAction && data.action !== expectedAction) {
    return { success: false, action: data.action, error: 'Action mismatch' }
  }

  return { success: true, score: data.score, action: data.action }
}
```

**Usage in API Routes**:
```typescript
// app/api/ai-description/route.ts
export async function POST(request: Request) {
  const { recaptchaToken, ...data } = await request.json()

  // Verify reCAPTCHA
  const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'ai_description')
  if (!recaptchaResult.success) {
    return json({ error: 'reCAPTCHA verification failed' }, { status: 400 })
  }

  // Score threshold for AI endpoints: 0.3
  if (recaptchaResult.score && recaptchaResult.score < 0.3) {
    return json({ error: 'Suspicious activity detected' }, { status: 400 })
  }

  // Process request
  // ...
}
```

**Client-Side Integration** (v3):
```typescript
// components/ListingForm.tsx
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    grecaptcha: any
  }
}

export function ListingForm() {
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
    document.body.appendChild(script)

    script.onload = () => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'submit_listing' })
          .then((token: string) => setRecaptchaToken(token))
      })
    }
  }, [])

  const handleSubmit = async () => {
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, recaptchaToken }),
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Score Thresholds**:
- AI endpoints: 0.3 (stricter)
- Upload endpoints: 0.1 (lenient)
- Form submissions: 0.5 (default)

---

#### 2.2.4 Security Metrics

**Implementation**: `lib/security/metrics.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

class SecurityMetrics {
  private counters = new Map<string, number>()

  // Increment counter
  incr(metric: string, tags?: Record<string, string>) {
    const key = this.buildKey(metric, tags)
    this.counters.set(key, (this.counters.get(key) || 0) + 1)

    // Send to Sentry
    Sentry.metrics.increment(metric, 1, { tags })
  }

  // Increment trend (Redis-based for distributed systems)
  async incrTrend(metric: string, window: string = '1h') {
    if (!redis) return

    const key = `metrics:${metric}:${window}:${Date.now()}`
    await redis.incr(key)
    await redis.expire(key, parseWindow(window))
  }

  // Get counter value
  get(metric: string, tags?: Record<string, string>): number {
    const key = this.buildKey(metric, tags)
    return this.counters.get(key) || 0
  }

  private buildKey(metric: string, tags?: Record<string, string>): string {
    if (!tags) return metric
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')
    return `${metric}{${tagStr}}`
  }
}

export const securityMetrics = new SecurityMetrics()

// Usage
securityMetrics.incr('auth.login.attempt', { provider: 'google' })
securityMetrics.incr('security.rate_limit.exceeded', { endpoint: '/api/listings' })
securityMetrics.incr('security.csrf.invalid')
```

**Tracked Metrics**:
- `auth.login.attempt` (provider, success/failure)
- `security.rate_limit.exceeded` (endpoint, ip)
- `security.csrf.invalid`
- `security.recaptcha.failed` (action, score)
- `security.admin.unauthorized_access` (user_id, endpoint)

---

### 2.3 Monitoring & Performance

#### 2.3.1 Performance Monitoring

**Implementation**: `lib/monitoring/metrics.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

class PerformanceMonitor {
  private measurements = new Map<string, number[]>()

  // Track API response time
  trackAPIResponse(endpoint: string, duration: number) {
    this.addMeasurement(`api.${endpoint}`, duration)

    // Send to Sentry
    Sentry.setMeasurement('api.response_time', duration, 'millisecond')

    // Alert if slow (>5s)
    if (duration > 5000) {
      console.warn(`Slow API response: ${endpoint} took ${duration}ms`)
      Sentry.captureMessage(`Slow API: ${endpoint}`, {
        level: 'warning',
        tags: { endpoint, duration: duration.toString() },
      })
    }
  }

  // Track database query
  trackDatabaseOperation(operation: string, duration: number, type: 'select' | 'insert' | 'update' | 'delete') {
    this.addMeasurement(`db.${type}.${operation}`, duration)

    Sentry.setMeasurement(`db.${type}_time`, duration, 'millisecond')

    // Alert if slow (>1s)
    if (duration > 1000) {
      console.warn(`Slow DB query: ${operation} (${type}) took ${duration}ms`)
    }
  }

  // Track user action
  trackUserAction(action: string, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      type: 'user',
      category: 'action',
      message: action,
      data: metadata,
      level: 'info',
    })
  }

  // Track business metric
  trackBusinessMetric(metric: string, value: number) {
    Sentry.metrics.gauge(metric, value)
  }

  // Track error
  trackError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: context,
      level: 'error',
    })
  }

  private addMeasurement(key: string, value: number) {
    if (!this.measurements.has(key)) {
      this.measurements.set(key, [])
    }
    const values = this.measurements.get(key)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  // Get statistics
  getStats(key: string) {
    const values = this.measurements.get(key) || []
    if (values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Helper: Wrap function with performance tracking
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start
        performanceMonitor.trackAPIResponse(name, duration)
      })
    }

    const duration = performance.now() - start
    performanceMonitor.trackAPIResponse(name, duration)
    return result
  }) as T
}
```

**Usage in API Routes**:
```typescript
// app/api/listings/route.ts
export async function POST(request: Request) {
  const start = performance.now()

  try {
    // ... process request

    const duration = performance.now() - start
    performanceMonitor.trackAPIResponse('/api/listings', duration)

    return json({ success: true })
  } catch (error) {
    performanceMonitor.trackError(error, { endpoint: '/api/listings' })
    throw error
  }
}

// Or use wrapper
export const POST = withPerformanceTracking(async (request: Request) => {
  // ... process request
}, '/api/listings')
```

**Database Operation Tracking**:
```typescript
// lib/supabase-server.ts
async function executeQuery<T>(query: () => Promise<T>, operation: string, type: string) {
  const start = performance.now()
  const result = await query()
  const duration = performance.now() - start

  performanceMonitor.trackDatabaseOperation(operation, duration, type as any)

  return result
}

// Usage
const listings = await executeQuery(
  () => supabase.from('listings').select('*').eq('status', 'active'),
  'fetch_active_listings',
  'select'
)
```

---

#### 2.3.2 Alert Management

**Implementation**: `lib/monitoring/alerts.ts`

```typescript
interface Alert {
  id: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  condition: () => boolean | Promise<boolean>
  cooldown: number // milliseconds
  lastTriggered?: Date
  actions?: AlertAction[]
}

interface AlertAction {
  type: 'webhook' | 'email' | 'slack'
  config: any
}

class AlertManager {
  private alerts = new Map<string, Alert>()
  private checkInterval: NodeJS.Timeout | null = null

  // Register alert
  register(alert: Omit<Alert, 'id' | 'timestamp'>) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.alerts.set(id, {
      ...alert,
      id,
      timestamp: new Date(),
    })
    return id
  }

  // Check all alerts
  async checkAlerts() {
    for (const [id, alert] of this.alerts) {
      // Check cooldown
      if (alert.lastTriggered) {
        const elapsed = Date.now() - alert.lastTriggered.getTime()
        if (elapsed < alert.cooldown) continue
      }

      // Evaluate condition
      const triggered = await alert.condition()

      if (triggered) {
        this.triggerAlert(alert)
      }
    }
  }

  // Trigger alert
  private async triggerAlert(alert: Alert) {
    console.warn(`[ALERT ${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`)

    // Update last triggered
    alert.lastTriggered = new Date()

    // Send to Sentry
    Sentry.captureMessage(alert.title, {
      level: alert.severity === 'critical' ? 'fatal' : alert.severity === 'high' ? 'error' : 'warning',
      tags: { alert_id: alert.id, severity: alert.severity },
      extra: { message: alert.message },
    })

    // Execute actions
    if (alert.actions) {
      for (const action of alert.actions) {
        await this.executeAction(action, alert)
      }
    }
  }

  private async executeAction(action: AlertAction, alert: Alert) {
    switch (action.type) {
      case 'webhook':
        await fetch(action.config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_id: alert.id,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            timestamp: alert.timestamp,
          }),
        })
        break

      case 'email':
        // Send email via Nodemailer
        break

      case 'slack':
        await fetch(action.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 *${alert.severity.toUpperCase()}*: ${alert.title}`,
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: alert.message },
              },
            ],
          }),
        })
        break
    }
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 60000) {
    if (this.checkInterval) return
    this.checkInterval = setInterval(() => this.checkAlerts(), intervalMs)
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const alertManager = new AlertManager()

// Register default alerts
alertManager.register({
  title: 'High Error Rate',
  message: 'Error rate exceeded 10% in last 15 minutes',
  severity: 'high',
  cooldown: 15 * 60 * 1000, // 15 minutes
  condition: async () => {
    const errorCount = securityMetrics.get('errors.total')
    const requestCount = securityMetrics.get('requests.total')
    return errorCount / requestCount > 0.1
  },
})

alertManager.register({
  title: 'Database Connection Failure',
  message: 'Unable to connect to database',
  severity: 'critical',
  cooldown: 5 * 60 * 1000, // 5 minutes
  condition: async () => {
    try {
      const supabase = createServiceSupabaseClient()
      const { error } = await supabase.from('listings').select('id').limit(1)
      return !!error
    } catch {
      return true
    }
  },
})

alertManager.register({
  title: 'High Memory Usage',
  message: 'Memory usage exceeded 500MB',
  severity: 'medium',
  cooldown: 30 * 60 * 1000, // 30 minutes
  condition: () => {
    const usage = process.memoryUsage()
    return usage.heapUsed > 500 * 1024 * 1024 // 500MB
  },
})

alertManager.register({
  title: 'Slow API Response',
  message: 'Average API response time exceeded 2s',
  severity: 'medium',
  cooldown: 20 * 60 * 1000, // 20 minutes
  condition: () => {
    const stats = performanceMonitor.getStats('api./api/listings')
    return stats && stats.avg > 2000
  },
})

// Start monitoring
alertManager.startMonitoring()
```

---

#### 2.3.3 Logging System

**Implementation**: `lib/utils/logger.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  private isDevelopment = process.env.NODE_ENV === 'development'

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.level]
  }

  debug(message: string, context?: any) {
    if (!this.shouldLog('debug')) return

    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  info(message: string, context?: any) {
    if (!this.shouldLog('info')) return

    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '')
    } else {
      Sentry.captureMessage(message, {
        level: 'info',
        extra: context,
      })
    }
  }

  warn(message: string, context?: any) {
    if (!this.shouldLog('warn')) return

    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '')
    } else {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: context,
      })
    }
  }

  error(message: string, error?: Error, context?: any) {
    if (!this.shouldLog('error')) return

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '', context || '')
    } else {
      if (error) {
        Sentry.captureException(error, {
          extra: { message, ...context },
          level: 'error',
        })
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context,
        })
      }
    }
  }

  // Namespace methods
  api = {
    request: (method: string, path: string, context?: any) => {
      this.debug(`API ${method} ${path}`, context)
    },
    response: (method: string, path: string, status: number, duration: number) => {
      this.debug(`API ${method} ${path} ${status} (${duration}ms)`)
    },
    error: (method: string, path: string, error: Error, context?: any) => {
      this.error(`API ${method} ${path} failed`, error, context)
    },
  }

  db = {
    query: (operation: string, table: string, duration: number) => {
      this.debug(`DB ${operation} ${table} (${duration}ms)`)
    },
    error: (operation: string, table: string, error: Error) => {
      this.error(`DB ${operation} ${table} failed`, error)
    },
  }

  auth = {
    login: (provider: string, userId: string) => {
      this.info(`User logged in via ${provider}`, { userId })
    },
    logout: (userId: string) => {
      this.info(`User logged out`, { userId })
    },
    error: (action: string, error: Error, context?: any) => {
      this.error(`Auth ${action} failed`, error, context)
    },
  }

  security = {
    alert: (message: string, context?: any) => {
      this.warn(`Security: ${message}`, context)
    },
    violation: (type: string, context?: any) => {
      this.error(`Security violation: ${type}`, undefined, context)
    },
  }
}

export const logger = new Logger()

// Usage
logger.info('Application started')
logger.api.request('POST', '/api/listings', { userId: '123' })
logger.db.query('SELECT', 'listings', 45)
logger.auth.login('google', 'user_123')
logger.security.alert('Rate limit exceeded', { ip: '1.2.3.4', endpoint: '/api/listings' })
```

---

### 2.4 Image Processing

Vera.lk uses Cloudinary for image storage and optimization. Images are uploaded during listing creation and optimized for various device sizes.

#### 2.4.1 Cloudinary Service

**Implementation**: `lib/cloudinary.ts`

```typescript
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export class CloudinaryService {
  /**
   * Upload image from buffer or base64 string
   */
  static async uploadImage(
    file: Buffer | string,
    options?: {
      folder?: string
      publicId?: string
      transformation?: any
      tags?: string[]
    }
  ): Promise<UploadApiResponse> {
    const uploadOptions = {
      folder: options?.folder || 'listings',
      public_id: options?.publicId,
      transformation: options?.transformation,
      tags: options?.tags,
      resource_type: 'image' as const,
      format: 'webp', // Auto-convert to WebP
      quality: 'auto:good', // Automatic quality optimization
      flags: 'strip_profile.force_strip.progressive', // Strip metadata, progressive JPEG
    }

    const result = await cloudinary.uploader.upload(
      typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
      uploadOptions
    )

    return result
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: Array<Buffer | string>,
    options?: Parameters<typeof CloudinaryService.uploadImage>[1]
  ): Promise<UploadApiResponse[]> {
    return Promise.all(files.map(file => this.uploadImage(file, options)))
  }

  /**
   * Delete image by public ID
   */
  static async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }

  /**
   * Get optimized image URL
   */
  static getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number
      height?: number
      crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb'
      quality?: string | number
      format?: 'webp' | 'avif' | 'jpg' | 'png'
    }
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options?.width,
          height: options?.height,
          crop: options?.crop || 'fill',
          quality: options?.quality || 'auto:good',
          format: options?.format || 'webp',
          fetch_format: 'auto', // Auto-detect best format
          dpr: 'auto', // Device pixel ratio auto
          flags: 'progressive', // Progressive JPEG
        },
      ],
      secure: true,
    })
  }

  /**
   * Get thumbnail URL (400x300)
   */
  static getThumbnailUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 400,
      height: 300,
      crop: 'fill',
      quality: 'auto:eco',
    })
  }

  /**
   * Get mobile-optimized URL (800x600)
   */
  static getMobileUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 800,
      height: 600,
      crop: 'fill',
      quality: 'auto:good',
    })
  }

  /**
   * Get full-size gallery URL (1920x1440)
   */
  static getGalleryUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, {
      width: 1920,
      height: 1440,
      crop: 'fit',
      quality: 'auto:best',
    })
  }

  /**
   * Add watermark transformation
   */
  static getWatermarkedUrl(publicId: string, watermarkText: string = 'VERA.lk'): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width: 1920, height: 1440, crop: 'fit' },
        {
          overlay: {
            text: watermarkText,
            font_family: 'Arial',
            font_size: 48,
          },
          gravity: 'south_east',
          x: 20,
          y: 20,
          opacity: 35,
        },
      ],
      secure: true,
    })
  }
}

export default CloudinaryService
```

#### 2.4.2 Upload API

**Endpoint**: `POST /api/upload/cloudinary`

**Implementation**: `app/api/upload/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CloudinaryService } from '@/lib/cloudinary'
import { rateLimiters } from '@/lib/middleware/rateLimiter'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

export async function POST(request: NextRequest) {
  // 1. Authentication check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limiting (15 uploads per minute)
  const rateLimitResult = await rateLimiters.upload.limit(user.id)
  if (!rateLimitResult.success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // 3. reCAPTCHA verification (optional)
  if (process.env.RECAPTCHA_UPLOAD_REQUIRED === 'true') {
    const { recaptchaToken } = await request.json()
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'upload_image')
    if (!recaptchaResult.success || (recaptchaResult.score && recaptchaResult.score < 0.1)) {
      return Response.json({ error: 'reCAPTCHA verification failed' }, { status: 400 })
    }
  }

  // 4. Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // 5. Validate file
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: 'Invalid file type (JPEG, PNG, WebP only)' }, { status: 400 })
  }

  try {
    // 6. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 7. Upload to Cloudinary
    const result = await CloudinaryService.uploadImage(buffer, {
      folder: `listings/${user.id}`,
      tags: ['listing', user.id],
    })

    // 8. Return URL and public ID
    return Response.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // 1. Authentication check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get public ID from request
  const { publicId } = await request.json()

  // 3. Verify ownership (public ID must start with listings/${user.id}/)
  if (!publicId.startsWith(`listings/${user.id}/`)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // 4. Delete from Cloudinary
    await CloudinaryService.deleteImage(publicId)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return Response.json({ error: 'Delete failed' }, { status: 500 })
  }
}
```

#### 2.4.3 Responsive Image Utility

**Implementation**: `lib/utils/responsive-images.ts`

```typescript
/**
 * Modern responsive image URL generator (client-safe)
 * Replaces deprecated cloudinary-client.ts
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export interface ImagePreset {
  width: number
  height: number
  quality: string
  format: 'webp' | 'avif' | 'auto'
  crop: 'fill' | 'fit' | 'scale'
}

export const presets: Record<string, ImagePreset> = {
  thumbnail: {
    width: 400,
    height: 300,
    quality: 'auto:eco',
    format: 'webp',
    crop: 'fill',
  },
  listing: {
    width: 800,
    height: 600,
    quality: 'auto:good',
    format: 'webp',
    crop: 'fill',
  },
  gallery: {
    width: 1920,
    height: 1440,
    quality: 'auto:best',
    format: 'auto',
    crop: 'fit',
  },
}

export function getResponsiveImageUrl(
  publicIdOrUrl: string,
  preset: keyof typeof presets | ImagePreset = 'listing'
): string {
  // If already a full URL, return as-is
  if (publicIdOrUrl.startsWith('http')) {
    return publicIdOrUrl
  }

  const config = typeof preset === 'string' ? presets[preset] : preset

  const transformations = [
    `w_${config.width}`,
    `h_${config.height}`,
    `c_${config.crop}`,
    `q_${config.quality}`,
    `f_${config.format}`,
    'dpr_auto', // Device pixel ratio
    'fl_progressive', // Progressive loading
  ].join(',')

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicIdOrUrl}`
}

export function getSrcSet(publicId: string, widths: number[] = [400, 800, 1200, 1920]): string {
  return widths
    .map(width => {
      const url = getResponsiveImageUrl(publicId, {
        width,
        height: Math.round(width * 0.75), // 4:3 aspect ratio
        quality: 'auto:good',
        format: 'webp',
        crop: 'fill',
      })
      return `${url} ${width}w`
    })
    .join(', ')
}

// Usage in components
export function ResponsiveImage({ publicId, alt }: { publicId: string; alt: string }) {
  return (
    <img
      src={getResponsiveImageUrl(publicId, 'listing')}
      srcSet={getSrcSet(publicId)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      alt={alt}
      loading="lazy"
    />
  )
}
```

#### 2.4.4 Image Compression (Client-Side)

**Implementation**: Used in listing creation form

```typescript
// app/post/page.tsx (excerpt)
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Target dimensions
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1440

        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height
            height = MAX_HEIGHT
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }

            // Create new File from blob
            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          'image/webp',
          0.85 // Quality: 85%
        )
      }
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Target size: 200KB
const TARGET_SIZE = 200 * 1024

if (file.size > TARGET_SIZE) {
  file = await compressImage(file)
}
```

---

### 2.5 Phone Verification & SMS

#### 2.5.1 Phone Number Formatting

**Implementation**: `lib/utils/phoneFormatter.ts`

```typescript
/**
 * Sri Lankan phone number utilities
 * Canonical format: 94XXXXXXXXX (11 digits, no +, no leading 0)
 */

export function normalizeSriLankaPhone(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '')

  // Handle different input formats
  if (digits.startsWith('94')) {
    // +94771234567 or 94771234567 → 94771234567
    return digits.substring(0, 11)
  } else if (digits.startsWith('0')) {
    // 0771234567 → 94771234567
    return '94' + digits.substring(1, 10)
  } else if (digits.length === 9) {
    // 771234567 → 94771234567
    return '94' + digits
  }

  throw new Error(`Invalid Sri Lankan phone number format: ${input}`)
}

export function isValidSriLankanPhone(normalized: string): boolean {
  // Must be exactly 11 digits starting with 94
  return /^94[0-9]{9}$/.test(normalized)
}

export function toE164(normalized: string): string {
  // 94771234567 → +94771234567
  return '+' + normalized
}

export function formatPhoneDisplay(phone: string): string {
  // 94771234567 → +94 77 123 4567
  if (!phone.startsWith('94') || phone.length !== 11) return phone

  return `+${phone.substring(0, 2)} ${phone.substring(2, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`
}

export function formatPhoneForWhatsApp(phone: string): string {
  // 94771234567 → https://wa.me/94771234567
  const normalized = normalizeSriLankaPhone(phone)
  return `https://wa.me/${normalized}`
}

export function formatPhoneForTel(phone: string): string {
  // 94771234567 → tel:+94771234567
  return `tel:${toE164(phone)}`
}

export function formatPhoneForStorage(input: string): string {
  // Any format → 94XXXXXXXXX (canonical)
  return normalizeSriLankaPhone(input)
}

// Examples
normalizeSriLankaPhone('+94 77 123 4567') // → 94771234567
normalizeSriLankaPhone('0771234567')      // → 94771234567
normalizeSriLankaPhone('771234567')       // → 94771234567
formatPhoneDisplay('94771234567')         // → +94 77 123 4567
```

#### 2.5.2 SMS Gateway (Text.lk)

**Implementation**: `lib/services/textlkService.ts`

```typescript
interface TextLKConfig {
  apiKey: string
  senderId: string // Max 11 characters
  baseUrl: string
}

interface SendSMSOptions {
  to: string | string[]
  message: string
  senderId?: string
}

interface SendOTPOptions {
  phone: string
  otp: string
}

class TextLKService {
  private config: TextLKConfig

  constructor() {
    this.config = {
      apiKey: process.env.TEXTLK_API_KEY || '',
      senderId: process.env.TEXTLK_SENDER_ID || 'VERA',
      baseUrl: 'https://app.text.lk/api/http',
    }
  }

  /**
   * Send OTP message
   */
  async sendOTP({ phone, otp }: SendOTPOptions): Promise<{ success: boolean; messageId?: string }> {
    const message = `Your VERA.lk verification code is: ${otp}. Valid for 10 minutes.`

    return this.sendSMS({
      to: phone,
      message,
    })
  }

  /**
   * Send SMS message
   */
  async sendSMS(options: SendSMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiKey) {
      console.warn('Text.lk API key not configured, skipping SMS send')
      console.log('Would send SMS:', options)
      return { success: true } // Dev mode: pretend success
    }

    try {
      // Normalize phone number(s)
      const recipients = Array.isArray(options.to) ? options.to : [options.to]
      const normalizedRecipients = recipients.map(normalizeSriLankaPhone).map(toE164)

      const params = new URLSearchParams({
        api_key: this.config.apiKey,
        sender_id: options.senderId || this.config.senderId,
        to: normalizedRecipients.join(','),
        message: options.message,
      })

      const response = await fetch(`${this.config.baseUrl}/send-sms?${params}`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
        }
      }

      return {
        success: true,
        messageId: data.message_id,
      }
    } catch (error) {
      console.error('Text.lk SMS error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Send campaign (bulk SMS)
   */
  async sendCampaign(options: {
    name: string
    to: string[]
    message: string
    scheduledAt?: Date
  }): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    if (!this.config.apiKey) {
      console.warn('Text.lk API key not configured, skipping campaign')
      return { success: true }
    }

    try {
      const normalizedRecipients = options.to.map(normalizeSriLankaPhone).map(toE164)

      const response = await fetch(`${this.config.baseUrl}/send-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          name: options.name,
          sender_id: this.config.senderId,
          recipients: normalizedRecipients,
          message: options.message,
          scheduled_at: options.scheduledAt?.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create campaign',
        }
      }

      return {
        success: true,
        campaignId: data.campaign_id,
      }
    } catch (error) {
      console.error('Text.lk campaign error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<{
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    error?: string
  }> {
    if (!this.config.apiKey) {
      return { status: 'sent' } // Dev mode
    }

    try {
      const params = new URLSearchParams({
        api_key: this.config.apiKey,
        message_id: messageId,
      })

      const response = await fetch(`${this.config.baseUrl}/get-status?${params}`)
      const data = await response.json()

      return {
        status: data.status,
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number; currency: string } | null> {
    if (!this.config.apiKey) return null

    try {
      const params = new URLSearchParams({
        api_key: this.config.apiKey,
      })

      const response = await fetch(`${this.config.baseUrl}/get-balance?${params}`)
      const data = await response.json()

      return {
        balance: parseFloat(data.balance),
        currency: data.currency || 'LKR',
      }
    } catch (error) {
      console.error('Text.lk balance check error:', error)
      return null
    }
  }
}

export const textlkService = new TextLKService()

// Usage
await textlkService.sendOTP({ phone: '94771234567', otp: '123456' })
await textlkService.sendSMS({ to: ['94771234567', '94771234568'], message: 'Hello!' })
const status = await textlkService.getMessageStatus('msg_123')
const balance = await textlkService.getBalance()
```

#### 2.5.3 Phone Verification Hook

**Implementation**: `lib/hooks/usePhoneVerification.ts`

Already covered in section 2.1.4 (Authentication > Phone OTP).

Key points:
- Hook signature: `usePhoneVerification({ purpose: 'profile' | 'listing' | 'wanted' })`
- Methods: `sendOTP(phone)`, `verifyOTP(phone, otp)`
- States: `isSending`, `isVerifying`, `error`
- Purpose controls verification marking (profile updates marked immediately, listing/wanted verified later)

---

This completes the Core Infrastructure & Services section. The documentation now covers:
- Multi-provider authentication (Email, Google OAuth, Phone OTP)
- Security services (rate limiting, CSRF, reCAPTCHA, metrics)
- Monitoring and performance tracking
- Image processing with Cloudinary
- Phone verification and SMS gateway

Next sections will cover:
3. Feature Documentation (Listings, Wanted Requests, Promotions, Messaging, Business Profiles, Admin)
4. API Reference
5. Database Schema
6. Code Patterns
7. Development Workflow

Due to the length limit, I'll continue in the next message.
