#!/bin/bash

# HonestLens Deployment Script
echo "🚀 HonestLens Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not found. Please initialize git first."
    echo "Run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔍 Checking project structure..."

# Check required files
required_files=("vercel.json" "api/index.js" "public/index.html")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ Project structure looks good!"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found."
    echo "Please create a .env file based on .env.example"
    echo "Required variables:"
    echo "  - JWT_SECRET"
    echo "  - NEWS_API_KEY"
    echo "  - OPENAI_API_KEY"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Commit any pending changes
echo "📝 Committing changes..."
git add .
git commit -m "Prepare for deployment - $(date)" || echo "No changes to commit"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables in Vercel dashboard"
echo "2. Configure your database (Supabase recommended)"
echo "3. Test your deployed application"
echo ""
echo "📖 See DEPLOYMENT-GUIDE.md for detailed instructions"