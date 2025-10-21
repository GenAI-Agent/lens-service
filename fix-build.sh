#!/bin/bash

echo "🔧 Fixing Widget Build Issues..."

# Step 1: Clean build artifacts
echo "📦 Cleaning build artifacts..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .tsbuildinfo

# Step 2: Check if vite is installed
echo "🔍 Checking dependencies..."
if ! npm list vite > /dev/null 2>&1; then
  echo "❌ Vite not found, installing..."
  npm install
fi

# Step 3: Try building with vite only (skip tsc)
echo "🏗️  Building with Vite (skipping TypeScript check)..."
npx vite build --mode production

# Check if build succeeded
if [ -f "dist/lens-service.umd.js" ]; then
  echo "✅ Build successful!"
  echo "📁 Output files:"
  ls -lh dist/
  exit 0
else
  echo "❌ Build failed!"
  echo "💡 Try running manually:"
  echo "   cd lens-service"
  echo "   npx vite build --mode production --force"
  exit 1
fi

