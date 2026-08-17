# Deployment Guide - v1.0.0

This guide covers deploying the Tarun Consulting Portfolio to production on Vercel.

## Pre-Deployment Checklist

- [ ] All tests passing: `npm run test`
- [ ] Type checking: `npm run typecheck`
- [ ] Linting: `npm run lint`
- [ ] Build verification: `npm run build`
- [ ] Environment variables configured in Vercel
- [ ] Database migrations completed
- [ ] Third-party service credentials verified

## Environment Variables Required

### Authentication
- `NEXTAUTH_URL` - Production URL (https://tarunpradeep.com)
- `NEXTAUTH_SECRET` - Random secure string

### GitHub OAuth
- `GITHUB_ID` - GitHub OAuth App ID
- `GITHUB_SECRET` - GitHub OAuth App Secret

### Payment Processing (Stripe)
- `STRIPE_PUBLIC_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

### Email Service (SendGrid)
- `SENDGRID_API_KEY` - SendGrid API key
- `SENDGRID_FROM_EMAIL` - Default sender email

### SMS Marketing (Twilio)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### Communication (Slack)
- `SLACK_WEBHOOK_URL` - Slack webhook for notifications

### AI Services (OpenAI)
- `OPENAI_API_KEY` - OpenAI API key for document processing

### Database
- `DATABASE_URL` - PostgreSQL connection string

## Deployment Steps

### 1. Verify Build Locally

```bash
npm run verify
npm run build
npm start
```

### 2. Configure Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# Set environment variables
vercel env pull
# Edit .env.local with production values
vercel env add NEXTAUTH_SECRET
vercel env add GITHUB_ID
# ... add all required variables
```

### 3. Deploy to Production

```bash
# Deploy to staging first
vercel --prod --prebuilt

# Or deploy directly
vercel deploy --prod
```

### 4. Post-Deployment

- [ ] Verify homepage loads: https://tarunpradeep.com
- [ ] Test authentication flow
- [ ] Verify payment integration
- [ ] Check email automation
- [ ] Test API endpoints
- [ ] Monitor error logs
- [ ] Verify analytics tracking

## Continuous Deployment

### GitHub Actions

The repository is configured for automatic deployment via GitHub Actions when pushing to `main` or `release/*` branches.

### Vercel Integration

Vercel automatically builds and deploys on:
- Push to connected branch (main)
- Pull requests (preview deployment)

## Rollback Procedure

```bash
# View deployment history
vercel list

# Rollback to previous version
vercel rollback
```

## Monitoring

### Performance Monitoring
- Vercel Analytics Dashboard
- Next.js built-in Web Vitals

### Error Tracking
- Vercel Error Logs
- SendGrid delivery tracking
- Stripe webhook logs

### Uptime Monitoring
- Uptime Robot (recommended)
- Vercel Status Page

## Database Migrations

Before deploying new database changes:

```bash
# Run migrations locally
npm run db:migrate

# Verify migrations
npm run db:verify

# Apply to production
npm run db:migrate -- --prod
```

## Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Sensitive data not in logs
- [ ] Webhook signatures verified
- [ ] Auth tokens expire appropriately
- [ ] Database credentials secure
- [ ] Environment variables never committed

## Version History

### v1.0.0 - Full Feature Release
- Payment processing (Stripe)
- Email automation (SendGrid)
- SMS marketing (Twilio)
- Analytics dashboard
- AI document processing (RFP extraction)
- Mobile app (React Native)
- Client portal
- Authentication (NextAuth)
- Blog content management
- Consultation system
- Project management
- Webhook integrations

## Support

For deployment issues:
1. Check Vercel logs: `vercel logs`
2. Review error messages in Vercel dashboard
3. Check database connectivity
4. Verify environment variables
5. Review Next.js build output

## Contact

Deployment support: deploy@tarunpradeep.com
