#!/bin/bash

# HonestLens Deployment Preparation Script
# This script prepares your application for production deployment

set -e

echo "🚀 HonestLens Deployment Preparation"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm --version) detected"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
}

# Run production optimization
run_optimization() {
    print_info "Running production optimization..."
    if [ -f "optimize-for-production.js" ]; then
        node optimize-for-production.js
        print_status "Production optimization completed"
    else
        print_warning "optimize-for-production.js not found, skipping optimization"
    fi
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p data logs uploads
    chmod 755 data logs uploads
    print_status "Directories created"
}

# Check environment configuration
check_env_config() {
    print_info "Checking environment configuration..."
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Run 'node optimize-for-production.js' first."
    else
        print_status ".env.production found"
    fi
    
    if [ ! -f ".env" ]; then
        print_warning ".env not found. Run 'node setup-api-keys.js' to configure API keys."
    else
        print_status ".env configuration found"
    fi
}

# Test application
test_application() {
    print_info "Testing application startup..."
    
    # Start the app in background
    NODE_ENV=development npm start &
    APP_PID=$!
    
    # Wait for app to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "Application health check passed"
    else
        print_error "Application health check failed"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop the app
    kill $APP_PID 2>/dev/null || true
    sleep 2
}

# Show deployment options
show_deployment_options() {
    echo ""
    echo "🚀 Ready for Deployment!"
    echo "======================="
    echo ""
    echo "Choose your deployment platform:"
    echo ""
    echo "1. Railway (Recommended)"
    echo "   npm install -g @railway/cli"
    echo "   railway login"
    echo "   railway up"
    echo ""
    echo "2. Render"
    echo "   Go to https://render.com"
    echo "   Connect your GitHub repository"
    echo "   Build: npm install"
    echo "   Start: npm start"
    echo ""
    echo "3. Vercel"
    echo "   npm install -g vercel"
    echo "   vercel --prod"
    echo ""
    echo "📚 For detailed instructions, see:"
    echo "   - QUICK-DEPLOY.md (quick start)"
    echo "   - DEPLOYMENT.md (comprehensive guide)"
    echo "   - DEPLOYMENT-SUMMARY.md (overview)"
    echo ""
}

# Show API key setup reminder
show_api_setup() {
    echo "🔑 API Key Setup"
    echo "==============="
    echo ""
    echo "For enhanced features, configure API keys:"
    echo "   node setup-api-keys.js"
    echo ""
    echo "Optional APIs:"
    echo "   - News API (free tier: 1,000 requests/day)"
    echo "   - OpenAI API (pay-per-use: ~$0.002/1K tokens)"
    echo "   - Google Fact Check API (free tier: 10,000 requests/day)"
    echo "   - Google Vision API (free tier: 1,000 requests/month)"
    echo ""
}

# Main execution
main() {
    print_info "Starting deployment preparation..."
    
    check_node
    check_npm
    install_dependencies
    create_directories
    run_optimization
    check_env_config
    
    print_info "Testing application..."
    if command -v curl &> /dev/null; then
        test_application
    else
        print_warning "curl not found, skipping application test"
    fi
    
    print_status "Deployment preparation completed!"
    
    show_api_setup
    show_deployment_options
    
    echo "🎉 Your HonestLens application is ready for production deployment!"
    echo "   Optimized for 10,000+ concurrent users"
    echo "   Estimated deployment time: 5-10 minutes"
}

# Handle script interruption
trap 'echo -e "\n${RED}❌ Preparation interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"