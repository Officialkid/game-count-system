#!/bin/bash

# Vercel Deployment Script
# This script deploys the application to Vercel with proper configuration

set -e

echo "🚀 Starting Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Determine environment
ENVIRONMENT=${1:-"production"}

if [ "$ENVIRONMENT" == "production" ]; then
    echo "📍 Deploying to PRODUCTION"
    DEPLOY_FLAGS="--prod"
elif [ "$ENVIRONMENT" == "preview" ]; then
    echo "📍 Deploying to PREVIEW"
    DEPLOY_FLAGS=""
else
    echo "❌ Invalid environment. Use 'production' or 'preview'"
    exit 1
fi

# Pull environment variables
echo "🔧 Pulling environment configuration..."
vercel pull --yes --environment=$ENVIRONMENT

# Build the project
echo "🏗️  Building project..."
vercel build $DEPLOY_FLAGS

# Deploy
echo "🚢 Deploying to Vercel..."
DEPLOYMENT_URL=$(vercel deploy --prebuilt $DEPLOY_FLAGS)

echo "✅ Deployment successful!"
echo "🌐 URL: $DEPLOYMENT_URL"

# Run post-deployment checks
echo "🔍 Running health checks..."
sleep 10

# Check if deployment is live
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health")

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check returned status: $HTTP_STATUS"
    exit 1
fi

echo "🎉 Deployment complete!"
