#!/bin/bash

# HR Portal Deployment Script
# Usage: ./deploy.sh [local|render|build]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 HR Portal Deployment Script"
echo "================================"

case "${1:-local}" in
  local)
    echo "📦 Deploying locally..."
    
    # Check if backend venv exists
    if [ ! -d "$BACKEND_DIR/venv" ]; then
      echo "⚠️  Backend venv not found. Creating..."
      cd "$BACKEND_DIR"
      python3 -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
    fi
    
    # Check if frontend node_modules exists
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
      echo "⚠️  Frontend dependencies not found. Installing..."
      cd "$FRONTEND_DIR"
      npm install
    fi
    
    echo "✅ Dependencies ready!"
    echo ""
    echo "To start the application:"
    echo ""
    echo "Terminal 1 - Backend:"
    echo "  cd $BACKEND_DIR"
    echo "  source venv/bin/activate"
    echo "  uvicorn api:app --reload --port 8000"
    echo ""
    echo "Terminal 2 - Frontend:"
    echo "  cd $FRONTEND_DIR"
    echo "  npm run dev"
    echo ""
    ;;
    
  build)
    echo "🔨 Building frontend for production..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    echo "✅ Frontend built successfully!"
    echo "📁 Build output: $FRONTEND_DIR/dist"
    ;;
    
  render)
    echo "☁️  Preparing for Render deployment..."
    
    # Build frontend
    echo "Building frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    
    # Check backend requirements
    echo "Checking backend requirements..."
    cd "$BACKEND_DIR"
    if [ ! -f "requirements.txt" ]; then
      echo "❌ requirements.txt not found!"
      exit 1
    fi
    
    echo "✅ Ready for Render deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Connect repository to Render.com"
    echo "3. Render will auto-detect render.yaml and deploy"
    echo ""
    echo "Or manually create services using render.yaml configuration"
    ;;
    
  *)
    echo "Usage: $0 [local|build|render]"
    echo ""
    echo "  local  - Set up local development environment"
    echo "  build  - Build frontend for production"
    echo "  render - Prepare for Render.com deployment"
    exit 1
    ;;
esac
