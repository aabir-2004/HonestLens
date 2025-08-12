#!/bin/bash

# HonestLens Deployment Script
set -e

echo "🚀 Starting HonestLens deployment..."

# Check if required environment variables are set
check_env_vars() {
    local required_vars=("NODE_ENV" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        echo "❌ Missing required environment variables: ${missing_vars[*]}"
        echo "Please set these variables before deployment."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm ci --only=production
    echo "✅ Dependencies installed"
}

# Setup database
setup_database() {
    echo "🗄️ Setting up database..."
    mkdir -p data logs uploads
    chmod 755 data logs uploads
    echo "✅ Database directories created"
}

# Run health check
health_check() {
    echo "🏥 Running health check..."
    timeout 30 bash -c 'until curl -f http://localhost:${PORT:-5000}/api/health; do sleep 2; done'
    echo "✅ Health check passed"
}

# Main deployment flow
main() {
    echo "Environment: ${NODE_ENV:-development}"
    
    check_env_vars
    install_dependencies
    setup_database
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Server will start on port ${PORT:-5000}"
    echo "📊 Health check available at /api/health"
    
    # Start the application
    exec npm start
}

# Handle script interruption
trap 'echo "❌ Deployment interrupted"; exit 1' INT TERM

main "$@"