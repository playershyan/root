# 🚀 Quick Setup Guide

## Required Steps (15 minutes max)

### 1. Push to GitHub
```bash
# If you don't have a GitHub repo yet
git init
git add .
git commit -m "Production-ready setup"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Set up Vercel (Free hosting)
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. It will automatically deploy!

### 3. Configure GitHub Secrets
Go to: GitHub Repo → Settings → Secrets and Variables → Actions

**Required secrets:**
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id  
VERCEL_PROJECT_ID=your_project_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get Vercel values from:**
- Vercel Dashboard → Settings → General → Project ID
- Vercel Dashboard → Settings → General → Team ID (org ID)
- Vercel Dashboard → Account Settings → Tokens → Create Token

### 4. Test Everything
After setup, push any small change:
```bash
git add .
git commit -m "Test CI/CD"
git push
```

Watch the "Actions" tab in GitHub - you'll see the pipeline running!

## 🎉 You're Done!

### What you now have:
- ✅ Automatic deployments
- ✅ Automatic testing  
- ✅ API documentation at `/api/docs`
- ✅ Health monitoring at `/api/health`
- ✅ Error tracking and alerts

### Optional Enhancements:

#### Slack Notifications
1. Create Slack webhook
2. Add `SLACK_WEBHOOK` to GitHub secrets

#### Error Monitoring
1. Sign up for [Sentry.io](https://sentry.io)
2. Add `SENTRY_DSN` to your environment variables

## 🆘 Need Help?

If anything doesn't work:
1. Check GitHub Actions tab for error logs
2. Check Vercel deployment logs
3. Ensure all secrets are set correctly

## 🔗 Important URLs After Setup:

- **Production Site**: `https://your-project-name.vercel.app`
- **API Docs**: `https://your-project-name.vercel.app/api/docs`
- **Health Check**: `https://your-project-name.vercel.app/api/health`
- **GitHub Actions**: `https://github.com/your-username/your-repo/actions`
- **Vercel Dashboard**: `https://vercel.com/dashboard`