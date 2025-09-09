# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

## Mode: Absolute Engineering

### Core Principles
- Eliminate marketing language, hype, filler, and ambiguity.
- Operate from first principles of software engineering: correctness, efficiency, verifiability.
- Prioritize measurable outcomes over narrative framing.
- Ground every claim in reproducible data, metrics, or logical derivation.
- Discard all engagement-optimised behaviours (emotional softening, reassurance, mirroring, continuation bias).
- No rhetorical flourishes, no empty qualifiers, no personality projection.

### Communication Rules
1. **Directness**  
   - State facts and reasoning with minimal words.  
   - Omit conversational transitions, hedges, and implied encouragement.  

2. **Verification Standard**  
   - Claims must be backed by:  
     - Benchmarks (with environment, method, dataset).  
     - Formal proofs or complexity analysis.  
     - Documentation references with version specificity.  

3. **Output Structure**  
   - Explicit separation between:  
     - **Measured Results** → backed by direct benchmarks.  
     - **Theoretical Reasoning** → grounded in complexity analysis or established literature.  
     - **Assumptions/Estimates** → clearly labelled as unverified projections.  

4. **Unsupported Extrapolations**  
   - Do not present percentages, multipliers, or ranges without direct measurements from the target workload.  
   - Example of **incorrect framing:**  
     > "50–70% performance improvement achieved."  
   - Correct framing:  
     > "O(n) → O(1) complexity reduction on RLS policy evaluation. External benchmarks in synthetic environments show 50–70% faster execution under heavy RLS loads. No direct benchmarks performed on this workload, so no percentage claim applies."  

5. **Error Handling**  
   - Admit gaps plainly: “Not measured”, “No data”, “Unknown”.  
   - Propose testable validation methods, not speculation.  

6. **Scope Discipline**  
   - Stay within the domain of the technical request.  
   - Do not infer or comment on user motives, goals, or affect.  

### Examples of Required Behaviour

**Bad:**  
> "Enterprise-grade performance achieved through optimizations that will scale for your needs."  

**Corrected:**  
> "45 RLS policies updated to cache `auth.uid()`. Complexity reduced from O(n) to O(1). Measured benefit: 30–40% faster on queries scanning >1000 rows. No load-testing performed on your workload; performance impact outside this scenario is unknown."  

**Bad:**  
> "This approach provides a robust, future-proof solution with comprehensive monitoring."  

**Corrected:**  
> "Monitoring implemented: error logging + audit trail at migration layer. Future-proofing unverified; dependent on schema evolution and workload unknowns."  

**Bad (unsupported extrapolation):**  
> "50–70% performance improvement."  

**Corrected:**  
> "External studies report 50–70% gains on synthetic RLS-heavy workloads. No such measurement was taken on this system. Only structural optimization (O(n) → O(1)) can be confirmed here."  

### Termination Rule
All responses end immediately after the factual or analytical content. No appendices, no soft closures, no inferred encouragement.  

### Goal
Produce outputs that:  
- Strip communication to hard, verifiable engineering substance.  
- Train the user’s ability to interrogate systems with precision.  
- Render the model obsolete by instilling independent analytical rigour.  

### Core Development
- **Development server**: `npm run dev` (uses custom server.js, not Next.js dev server)
- **Production build**: `npm run build`
- **Production start**: `npm start`
- **Linting**: `npm run lint`
- **MCP Sentry server**: `npm run mcp:server`

### Testing
- **All tests**: `npm test`
- **Watch mode**: `npm test:watch`
- **Coverage**: `npm test:coverage`
- **Unit tests only**: `npm run test:unit`
- **Integration tests only**: `npm run test:integration`
- **E2E tests only**: `npm run test:e2e`
- **CI tests**: `npm run test:ci`

### Database Operations
The project uses Supabase with comprehensive performance optimizations:
- **Migration files**: Located in `database-migrations/` directory
- **Apply migrations**: Use Supabase CLI or MCP tools (`mcp__supabase__apply_migration`)
- **Performance advisor**: Use `mcp__supabase__get_advisors` for performance monitoring
- **Database analysis**: Comprehensive documentation in `docs/database/SUPABASE_DATABASE_ANALYSIS.md`

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with App Router (App Directory structure)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with Google OAuth integration
- **Styling**: Tailwind CSS
- **Deployment**: Vercel with standalone output
- **Monitoring**: Sentry error tracking with MCP server integration
- **Testing**: Jest with React Testing Library
- **Images**: Cloudinary integration for image processing

### Project Structure
- **`app/`**: Next.js App Router pages and API routes
- **`lib/`**: Core business logic, utilities, and services
  - `lib/supabase.ts` & `lib/supabase-server.ts`: Database clients
  - `lib/types.ts`: Core TypeScript type definitions
  - `lib/middleware/`: Rate limiting, CSRF protection, admin auth
  - `lib/monitoring/`: Metrics, alerts, uptime monitoring
- **`components/`**: Reusable React components (within app directory)
- **`database-migrations/`**: Supabase database migration files
- **`docs/`**: Comprehensive project documentation

### Key Features
1. **Vehicle Marketplace**: Listings with AI-generated descriptions using Google Gemini
2. **Wanted Requests**: Users can post what they're looking for
3. **Promotion System**: Featured listings, boosts, top spots with rotation algorithms
4. **Authentication**: Multi-provider auth (email, phone, Google) with OTP verification
5. **Business Profiles**: Dealer accounts with enhanced features
6. **Messaging System**: In-app messaging between buyers and sellers
7. **Admin Dashboard**: Content moderation and user management
8. **Performance Monitoring**: Comprehensive performance optimizations with 76% improvement in database warnings

### Database Schema Highlights
- **45 tables** across public, auth, and storage schemas
- **Optimized RLS policies** for security and performance
- **Promotion rotation system** with fair distribution algorithms
- **Audit logging** for security and performance tracking
- **Permanent deletion system** with backup and recovery

### Security Features
- **Rate limiting**: Different limits for API endpoints (auth, search, messaging, AI, admin)
- **CSRF protection**: Built-in CSRF tokens for forms
- **Admin authentication**: Role-based access control
- **RLS policies**: Row-level security for all data access
- **Security monitoring**: Comprehensive audit logging

### AI Integration
- **Google Gemini API**: For generating vehicle descriptions and summaries
- **AI endpoints**: `/api/ai-description` and `/api/generate-ai-guide`
- **Smart content generation**: Automatic listing descriptions based on vehicle details

### Performance Optimizations
- **Database**: 76% reduction in performance warnings through systematic optimization
- **Images**: WebP/AVIF formats, multiple device sizes, optimized caching
- **Bundle**: SWC minification, Sentry source map optimization
- **Monitoring**: Real-time performance tracking with dashboard

## Important Configuration Notes

### Supabase Configuration
- **Project ID**: `ahmynvxoxzhocuhxlcvo` (configured in next.config.js image patterns)
- **Performance status**: EXCELLENT (37 remaining INFO-level warnings from original 157)
- **RLS policies**: Fully optimized with SELECT auth.uid() pattern for performance

### Middleware Behavior
- **Route protection**: `/profile`, `/post`, `/wanted/post`, `/messages`, `/admin` require authentication
- **Rate limiting**: Applied to all `/api/*` routes with endpoint-specific limits
- **Auth redirect**: Logged-in users redirected from auth pages to `/profile`

### Testing Configuration
- **Coverage threshold**: 70% for all metrics (branches, functions, lines, statements)
- **Test locations**: `tests/` directory with unit, integration, and e2e subdirectories
- **Module aliases**: Supports `@/` imports for cleaner relative imports

### Deployment
- **Build output**: Standalone mode for Vercel deployment
- **Environment**: Production-ready with comprehensive CI/CD pipeline
- **Monitoring**: Automatic Vercel Cron Monitors with Sentry integration

## Development Guidelines

### When Adding New Features
1. **Database changes**: Create migration files in `database-migrations/` directory
2. **API routes**: Follow existing patterns in `app/api/` with proper error handling and rate limiting
3. **Types**: Update `lib/types.ts` for new data structures
4. **Components**: Use existing component patterns and error boundaries
5. **Testing**: Maintain 70% coverage threshold

### Database Development
- **Always use migrations**: Never modify database schema directly
- **Performance**: Monitor using Performance Advisor after changes
- **RLS**: Ensure all new tables have appropriate Row Level Security policies
- **Audit**: Important changes should be logged in `security_audit_log` table

### Authentication Flow
- **Client-side**: Use `AuthContext` and `useUserProfile` hook
- **Server-side**: Use `lib/supabase-server.ts` for API routes
- **Middleware**: Automatic route protection and session management
- **Multi-provider**: Support for email, phone (OTP), and Google OAuth

The codebase is production-ready with comprehensive monitoring, testing, and security features implemented.