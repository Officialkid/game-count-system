# GitHub Actions CI/CD Secrets Setup

This document lists all required secrets for the CI/CD pipeline.

## Required Secrets

Add these secrets in GitHub: **Settings → Secrets and variables → Actions → New repository secret**

### Vercel Deployment

```bash
VERCEL_TOKEN
```
- Get from: https://vercel.com/account/tokens
- Scope: Full access
- Used for: Deploying to Vercel via CLI

```bash
VERCEL_PRODUCTION_URL
```
- Value: `your-app.vercel.app` (without https://)
- Used for: Health checks and notifications

### Appwrite

```bash
APPWRITE_ENDPOINT
```
- Value: Your Appwrite endpoint (e.g., `https://cloud.appwrite.io/v1`)
- Used for: Deploying collections and functions

```bash
APPWRITE_API_KEY
```
- Get from: Appwrite Console → Overview → Integrations → API Keys
- Scope: Full access
- Used for: CI/CD deployments

```bash
APPWRITE_PROJECT_ID
```
- Get from: Appwrite Console → Settings → Project ID
- Used for: Project context in deployments

### Sentry (Error Monitoring)

```bash
SENTRY_DSN
```
- Get from: Sentry → Settings → Projects → [Your Project] → Client Keys (DSN)
- Used for: Error tracking

```bash
SENTRY_AUTH_TOKEN
```
- Get from: Sentry → Settings → Auth Tokens
- Scope: `project:releases`
- Used for: Creating releases and uploading source maps

```bash
SENTRY_ORG
```
- Value: Your Sentry organization slug
- Used for: Release tracking

```bash
SENTRY_PROJECT
```
- Value: Your Sentry project name
- Used for: Release tracking

### Notifications

```bash
SLACK_WEBHOOK
```
- Get from: Slack → Apps → Incoming Webhooks
- Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
- Used for: Deployment and error notifications

### Security Scanning (Optional)

```bash
SNYK_TOKEN
```
- Get from: https://app.snyk.io/account
- Scope: API token
- Used for: Security vulnerability scanning

## Setup Instructions

### 1. Add Vercel Secrets

```bash
# Get Vercel token
1. Go to https://vercel.com/account/tokens
2. Create new token: "GitHub Actions CI/CD"
3. Copy token
4. Add to GitHub secrets as VERCEL_TOKEN

# Get production URL
1. Deploy to Vercel manually first
2. Copy production URL (e.g., camp-countdown.vercel.app)
3. Add to GitHub secrets as VERCEL_PRODUCTION_URL
```

### 2. Add Appwrite Secrets

```bash
# Get Appwrite API key
1. Go to Appwrite Console
2. Navigate to Overview → Integrations → API Keys
3. Create new API key with full access
4. Copy key
5. Add to GitHub secrets as APPWRITE_API_KEY

# Get project details
1. Copy APPWRITE_ENDPOINT (e.g., https://cloud.appwrite.io/v1)
2. Copy PROJECT_ID from Settings
3. Add both to GitHub secrets
```

### 3. Add Sentry Secrets

```bash
# Create Sentry project
1. Go to https://sentry.io
2. Create new project: "camp-countdown-system"
3. Copy DSN from Client Keys
4. Add to GitHub secrets as SENTRY_DSN

# Create auth token
1. Go to Settings → Auth Tokens
2. Create new token with 'project:releases' scope
3. Add to GitHub secrets as SENTRY_AUTH_TOKEN

# Add org and project
1. Copy organization slug
2. Add to GitHub secrets as SENTRY_ORG
3. Add project name as SENTRY_PROJECT
```

### 4. Add Slack Webhook

```bash
# Create webhook
1. Go to your Slack workspace
2. Add "Incoming Webhooks" app
3. Create new webhook for #deployments channel
4. Copy webhook URL
5. Add to GitHub secrets as SLACK_WEBHOOK
```

### 5. Add Snyk Token (Optional)

```bash
# Get Snyk token
1. Go to https://app.snyk.io/account
2. Generate API token
3. Add to GitHub secrets as SNYK_TOKEN
```

## Verify Secrets

After adding all secrets, verify in GitHub:

```
Your-Repo → Settings → Secrets and variables → Actions
```

You should see:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_PRODUCTION_URL
- ✅ APPWRITE_ENDPOINT
- ✅ APPWRITE_API_KEY
- ✅ APPWRITE_PROJECT_ID
- ✅ SENTRY_DSN
- ✅ SENTRY_AUTH_TOKEN
- ✅ SENTRY_ORG
- ✅ SENTRY_PROJECT
- ✅ SLACK_WEBHOOK
- ⚪ SNYK_TOKEN (optional)

## Test CI/CD

After adding secrets:

```bash
# Trigger CI/CD
git push origin main

# Check workflow
https://github.com/your-org/camp-countdown-system/actions

# Verify deployment
curl https://your-app.vercel.app/api/health
```

## Troubleshooting

### "Secret not found" error

- Verify secret name matches exactly (case-sensitive)
- Check secret is in correct repository
- Ensure workflow has permission to access secrets

### Vercel deployment fails

- Verify VERCEL_TOKEN is valid
- Check Vercel project is linked
- Ensure environment variables are set in Vercel dashboard

### Appwrite deployment fails

- Verify APPWRITE_API_KEY has full access
- Check APPWRITE_PROJECT_ID is correct
- Ensure collections don't already exist

### Sentry not tracking

- Verify SENTRY_DSN is correct
- Check SENTRY_PROJECT matches project name
- Ensure source maps are uploaded

## Security Notes

- ⚠️ **Never commit secrets to repository**
- ✅ Use GitHub secrets for sensitive data
- ✅ Rotate tokens regularly (every 90 days)
- ✅ Use minimal required scopes
- ✅ Audit secret access logs

## Additional Resources

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Tokens](https://vercel.com/guides/how-do-i-use-a-vercel-api-access-token)
- [Appwrite API Keys](https://appwrite.io/docs/keys)
- [Sentry Auth Tokens](https://docs.sentry.io/product/accounts/auth-tokens/)
