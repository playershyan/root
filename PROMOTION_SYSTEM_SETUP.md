# AutoTrader.lk Promotion System - Complete Setup Guide

## Overview

This guide provides complete setup instructions for the comprehensive paid promotion system implemented for AutoTrader.lk. The system includes fair rotation mechanisms, payment processing, and automated promotion management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with npm/yarn
- PostgreSQL 14+ database
- Supabase account (for database hosting)
- Stripe account (for international payments)
- PayHere account (for Sri Lankan payments)
- Docker (optional, for containerized deployment)

### Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Configure required environment variables in `.env.local`:**

   ```env
   # Database Configuration
   DATABASE_URL="postgresql://user:password@host:port/database"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Stripe Configuration (International Payments)
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."

   # PayHere Configuration (Sri Lankan Payments)
   PAYHERE_MERCHANT_ID="your-merchant-id"
   PAYHERE_MERCHANT_SECRET="your-merchant-secret"
   PAYHERE_CURRENCY="LKR"

   # Application Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"

   # Cron Job Security
   CRON_SECRET_TOKEN="your-secret-token-here"

   # Email Configuration (Optional)
   EMAIL_HOST="smtp.your-provider.com"
   EMAIL_PORT="587"
   EMAIL_USER="your-email@domain.com"
   EMAIL_PASS="your-password"
   EMAIL_FROM="noreply@autotrader.lk"
   ```

## 📊 Database Setup

### 1. Run SQL Migrations

Execute the following SQL files in order:

```bash
# 1. Core promotion tables and functions
psql $DATABASE_URL < migrations/001_promotions_schema.sql

# 2. Advanced rotation mechanism
psql $DATABASE_URL < migrations/002_rotation_schema.sql

# 3. Payment tracking and analytics
psql $DATABASE_URL < migrations/003_analytics_schema.sql
```

### 2. Verify Database Setup

```sql
-- Check if tables were created successfully
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%promotion%';

-- Should show: promotions, promotion_analytics, rotation_logs
```

### 3. Create Test Data (Optional)

```sql
-- Insert sample promotion for testing
INSERT INTO promotions (listing_id, promotion_type, expires_at, is_active)
VALUES 
  ('test-listing-1', 'featured', NOW() + INTERVAL '7 days', true),
  ('test-listing-2', 'top_spot', NOW() + INTERVAL '7 days', true);
```

## 🔧 Application Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Build and Start Development Server

```bash
npm run dev
# or
yarn dev
```

### 3. Verify Setup

- Visit `http://localhost:3000/listings` to see the updated listings page
- Visit `http://localhost:3000/post/paid-features` to see ad promotion options
- Visit `http://localhost:3000/wanted-request/paid-features` to see wanted request promotions

## ⚙️ Payment Gateway Setup

### Stripe Setup (International Cards)

1. **Create Stripe Account:**
   - Visit [Stripe Dashboard](https://dashboard.stripe.com)
   - Complete account verification
   - Get API keys from Developers > API keys

2. **Configure Webhooks:**
   ```bash
   # Webhook endpoint: https://yourdomain.com/api/payments/webhook
   # Events to listen for:
   # - payment_intent.succeeded
   # - payment_intent.payment_failed
   ```

3. **Test Stripe Integration:**
   ```bash
   # Use Stripe test card numbers
   # 4242424242424242 (Visa)
   # 4000000000003220 (3D Secure)
   ```

### PayHere Setup (Sri Lankan Payments)

1. **Create PayHere Account:**
   - Visit [PayHere.lk](https://www.payhere.lk)
   - Complete business verification
   - Get Merchant ID and Secret

2. **Configure Notification URL:**
   ```
   Notification URL: https://yourdomain.com/api/payments/payhere/notify
   ```

3. **Test PayHere Integration:**
   - Use PayHere sandbox mode during development
   - Test with Sri Lankan test cards

## 🕒 Cron Job Setup

### 1. Setup Automated Tasks

The system requires periodic maintenance tasks:

```bash
# Add to your crontab or job scheduler:

# Reset daily rotation scores (daily at midnight)
0 0 * * * curl -X POST "https://yourdomain.com/api/cron/promotions?action=rotation&token=YOUR_CRON_SECRET"

# Expire old promotions (every hour)
0 * * * * curl -X POST "https://yourdomain.com/api/cron/promotions?action=expire&token=YOUR_CRON_SECRET"

# Reset daily boost limits (daily at midnight)
5 0 * * * curl -X POST "https://yourdomain.com/api/cron/promotions?action=boost&token=YOUR_CRON_SECRET"

# Generate analytics reports (weekly on Monday)
0 9 * * 1 curl -X POST "https://yourdomain.com/api/cron/promotions?action=analytics&token=YOUR_CRON_SECRET"
```

### 2. Alternative: GitHub Actions (if using GitHub)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Promotion System Cron Jobs
on:
  schedule:
    # Daily at midnight UTC
    - cron: '0 0 * * *'
    # Hourly
    - cron: '0 * * * *'

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Expire Promotions
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/promotions?action=expire&token=${{ secrets.CRON_SECRET }}"
      
      - name: Reset Rotation Scores (daily only)
        if: github.event.schedule == '0 0 * * *'
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/promotions?action=rotation&token=${{ secrets.CRON_SECRET }}"
```

## 🚢 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Add all environment variables in Vercel dashboard
   - Set up webhook URLs after deployment

3. **Configure Cron Jobs:**
   - Use Vercel Cron Jobs or external service like cron-job.org

### Option 2: Railway

1. **Deploy via Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Railway Configuration:**
   - Uses included `railway.json`
   - Automatically provisions PostgreSQL
   - Set environment variables in Railway dashboard

### Option 3: Render

1. **Deploy to Render:**
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Set environment variables in Render dashboard

### Option 4: Docker Deployment

1. **Build and Run with Docker:**
   ```bash
   # Build image
   docker build -t autotrader-promotions .
   
   # Run with docker-compose
   docker-compose up -d
   ```

2. **Configure Nginx (for production):**
   - Use included `nginx.conf`
   - Set up SSL certificates
   - Configure domain routing

## 📈 Monitoring and Analytics

### 1. Database Monitoring

```sql
-- Monitor promotion performance
SELECT 
  promotion_type,
  COUNT(*) as active_count,
  AVG(impressions) as avg_impressions,
  AVG(rotation_score) as avg_score
FROM promotions 
WHERE is_active = true 
GROUP BY promotion_type;

-- Check rotation fairness
SELECT 
  listing_id,
  impressions,
  last_shown_at,
  rotation_score
FROM promotions 
WHERE promotion_type = 'featured'
ORDER BY rotation_score DESC;
```

### 2. Application Monitoring

```bash
# Check API health
curl https://yourdomain.com/api/health

# Monitor payment webhooks
curl https://yourdomain.com/api/payments/status
```

### 3. Set up Alerts (Optional)

Configure monitoring services like:
- Uptime Robot for service availability
- Sentry for error tracking
- LogRocket for user session replay

## 🔍 Testing

### 1. Unit Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test promotion
npm test rotation
npm test payment
```

### 2. Integration Testing

```bash
# Test promotion creation
curl -X POST "http://localhost:3000/api/promotions" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "test-listing",
    "promotionTypes": ["featured"],
    "duration": 7
  }'

# Test rotation algorithm
curl "http://localhost:3000/api/promotions/featured?category=cars&limit=2"
```

### 3. End-to-End Testing

1. **Test User Journey:**
   - Create a test listing
   - Purchase promotion
   - Verify promotion appears in rotation
   - Check rotation fairness over time

2. **Test Payment Flow:**
   - Use test payment credentials
   - Complete purchase process
   - Verify webhook handling
   - Check promotion activation

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   ```bash
   # Check connection
   psql $DATABASE_URL -c "SELECT NOW();"
   
   # Check tables exist
   psql $DATABASE_URL -c "\dt promotion*"
   ```

2. **Payment Webhook Issues:**
   ```bash
   # Check webhook logs
   tail -f logs/webhook.log
   
   # Test webhook endpoint
   curl -X POST "http://localhost:3000/api/payments/webhook" \
     -H "stripe-signature: test"
   ```

3. **Cron Job Issues:**
   ```bash
   # Test cron endpoint manually
   curl -X POST "http://localhost:3000/api/cron/promotions?action=expire&token=YOUR_TOKEN"
   
   # Check cron job logs
   grep "cron" logs/application.log
   ```

4. **Rotation Algorithm Issues:**
   ```sql
   -- Check rotation scores
   SELECT * FROM promotions 
   WHERE promotion_type = 'featured' 
   ORDER BY rotation_score DESC;
   
   -- Reset rotation scores manually
   UPDATE promotions 
   SET rotation_score = 0, last_shown_at = NULL 
   WHERE promotion_type = 'featured';
   ```

### Performance Optimization

1. **Database Optimization:**
   ```sql
   -- Add indexes for better performance
   CREATE INDEX CONCURRENTLY idx_promotions_type_active 
   ON promotions (promotion_type, is_active);
   
   CREATE INDEX CONCURRENTLY idx_promotions_rotation_score 
   ON promotions (rotation_score DESC) 
   WHERE is_active = true;
   ```

2. **Caching:**
   ```javascript
   // Add Redis caching for promoted listings
   const promotedAds = await redis.get(`featured:${category}`) 
     || await RotationService.getRotatedFeaturedAds(category, 2);
   ```

## 📚 System Architecture

### Promotion Types & Pricing

| Promotion Type | Price (Rs.) | Duration | Features |
|---------------|-------------|----------|----------|
| Featured | 3,500 | 7 days | Homepage visibility, top 2 spots, premium styling |
| Top Spot | 1,200 | 7 days | Category top 3 spots, enhanced styling |
| Boost | 800 | 7 days | Higher position in regular listings |
| Urgent | 600 | 5 days | Urgent badges, priority placement |

### Fair Rotation Algorithm

The system uses a scoring algorithm for fair rotation:

```
Score = Hours Since Last Shown - (Impressions × Weight) + Random Factor
```

- Higher score = Higher priority for next rotation
- Balances fairness with randomness
- Prevents any single ad from dominating

### Database Schema

Key tables:
- `promotions`: Core promotion data with rotation tracking
- `promotion_analytics`: Performance metrics and reporting
- `rotation_logs`: Historical rotation data for analysis

## 🎯 Next Steps

1. **Phase 1: Basic Implementation**
   - [x] Database setup
   - [x] Payment integration
   - [x] Basic promotion display

2. **Phase 2: Advanced Features**
   - [ ] A/B testing for promotion effectiveness
   - [ ] Advanced analytics dashboard
   - [ ] Machine learning for optimal rotation

3. **Phase 3: Scale & Optimize**
   - [ ] Multi-region deployment
   - [ ] Advanced caching strategies
   - [ ] Real-time analytics

## 💡 Tips for Success

1. **Start Small:** Begin with basic promotions, then add advanced features
2. **Monitor Closely:** Track rotation fairness and user satisfaction
3. **Test Thoroughly:** Use staging environment for all changes
4. **Document Changes:** Keep this guide updated as system evolves
5. **User Feedback:** Regularly collect feedback from promoted listing owners

## 📞 Support

For technical support or questions about this implementation:

1. Check troubleshooting section above
2. Review system logs for specific error messages
3. Test individual components in isolation
4. Verify environment configuration

---

**System Status:** ✅ Ready for Production Deployment

**Last Updated:** Current Implementation Date

**Version:** 1.0.0 - Complete Promotion System with Fair Rotation