#!/bin/bash
# 🚀 Chronos Barber System - Production Deployment Script
# Usage: ./deploy_production.sh

echo "💈 Starting Deployment Sequence..."

# 1. Login Checks
echo "👀 Checking Authentication..."
if ! npx supabase projects list >/dev/null 2>&1; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   npx supabase login"
    exit 1
fi

if ! npx vercel whoami >/dev/null 2>&1; then
    echo "❌ Not logged in to Vercel. Please run:"
    echo "   npx vercel login"
    exit 1
fi

# 2. Supabase Setup
echo "☁️  Linking Supabase Project (Select your production project)..."
npx supabase link

echo "📂 Pushing Database Schema..."
npx supabase db push

echo "⚡ Deploying Edge Functions..."
npx supabase functions deploy process-booking

echo "🔑 Setting Secrets (Resend API Key)..."
# We need to set the Resend Key in production
# Check if .env exists, if so use it, otherwise prompt or assume user handled it.
if [ -f .env ]; then
   npx supabase secrets set --env-file .env
else
   echo "⚠️  No .env file found. Make sure to set RESEND_API_KEY in Supabase Dashboard!"
fi

# 3. Vercel Deployment
echo "🚀 Deploying Frontend to Vercel..."
npx vercel deploy --prod

# 4. Seeding Data
echo "🌱 Seeding Admin Users..."
echo "Enter your Supabase SERVICE_ROLE_KEY (from Project Settings -> API) to seed users:"
read -s SERVICE_KEY

if [ -n "$SERVICE_KEY" ]; then
    export SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY
    if node scripts/seed_auth.cjs; then
        echo "✅ Users Seeded Successfully."
    else
        echo "⚠️  Seeding had issues. Check logs."
    fi
else
    echo "⏭️  Skipping seeding (No key provided)."
fi

echo "🎉 Deployment Complete!"
echo "Check your Vercel URL and credentials in CREDENTIALS.md"
