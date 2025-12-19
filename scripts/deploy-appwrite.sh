#!/bin/bash

# Appwrite Deployment Script
# Deploys collections, storage buckets, and functions to Appwrite

set -e

echo "🚀 Starting Appwrite deployment..."

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "📦 Installing Appwrite CLI..."
    npm install -g appwrite-cli
fi

# Check environment variables
if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ] || [ -z "$APPWRITE_API_KEY" ]; then
    echo "❌ Missing required environment variables:"
    echo "   APPWRITE_ENDPOINT"
    echo "   APPWRITE_PROJECT_ID"
    echo "   APPWRITE_API_KEY"
    exit 1
fi

# Login to Appwrite
echo "🔐 Logging into Appwrite..."
appwrite login --endpoint "$APPWRITE_ENDPOINT" --key "$APPWRITE_API_KEY"

# Set project context
echo "📍 Setting project context..."
appwrite client --endpoint "$APPWRITE_ENDPOINT"
appwrite client --projectId "$APPWRITE_PROJECT_ID"
appwrite client --key "$APPWRITE_API_KEY"

# Deploy database collections
echo "📦 Deploying database collections..."
cd appwrite

# Deploy collections from appwrite.json
appwrite deploy collection --all || echo "⚠️  Some collections may already exist"

# Deploy storage buckets
echo "🗄️  Deploying storage buckets..."
appwrite deploy bucket --all || echo "⚠️  Some buckets may already exist"

# Deploy functions
echo "⚡ Deploying Appwrite Functions..."
cd functions

# Deploy submitScoreHandler
echo "  📤 Deploying submitScoreHandler..."
cd submitScoreHandler
appwrite deploy function || echo "⚠️  Function may need manual configuration"
cd ..

# Deploy generateRecap
echo "  📤 Deploying generateRecap..."
cd generateRecap
appwrite deploy function || echo "⚠️  Function may need manual configuration"
cd ..

# Deploy logAudit
echo "  📤 Deploying logAudit..."
cd logAudit
appwrite deploy function || echo "⚠️  Function may need manual configuration"
cd ..

cd ../..

echo "✅ Appwrite deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify collections in Appwrite Console"
echo "2. Check function deployments and environment variables"
echo "3. Test function executions"
echo "4. Update .env.local with function IDs"
