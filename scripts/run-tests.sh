#!/bin/bash

# App Store Parser Test Runner
# Usage: ./scripts/run-tests.sh

echo "🚀 App Store Parser Test Runner"
echo "==============================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if TypeScript is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available"
    exit 1
fi

echo "🔧 Preparing test environment..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "📋 Available test options:"
echo "1. Run TypeScript test (recommended)"
echo "2. Run JavaScript test"
echo "3. Run both tests"
echo ""

read -p "Select option (1-3): " choice

case $choice in
    1)
        echo "🧪 Running TypeScript test..."
        npx ts-node scripts/test-appstore-parser.ts
        ;;
    2)
        echo "🧪 Running JavaScript test..."
        node scripts/test-appstore-parser.js
        ;;
    3)
        echo "🧪 Running both tests..."
        echo ""
        echo "📝 TypeScript Test:"
        echo "=================="
        npx ts-node scripts/test-appstore-parser.ts
        echo ""
        echo "📝 JavaScript Test:"
        echo "=================="
        node scripts/test-appstore-parser.js
        ;;
    *)
        echo "❌ Invalid option. Please select 1, 2, or 3"
        exit 1
        ;;
esac

echo ""
echo "✅ Test execution completed!"
echo "📊 Review the results above to verify the parser is working correctly."