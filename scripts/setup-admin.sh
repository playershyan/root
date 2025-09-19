#!/bin/bash

echo "🚀 Setting up Admin Dashboard..."
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check if Supabase MCP is available
echo "🔍 Checking Supabase connection..."

# Set up environment variables
echo "📝 Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Check if ADMIN_EMAILS is set
if ! grep -q "ADMIN_EMAILS" .env.local; then
    echo ""
    echo "⚠️  ADMIN_EMAILS not found in .env.local"
    echo "Please add your admin email addresses:"
    echo "ADMIN_EMAILS=your-email@example.com,admin@example.com"
    echo ""
    read -p "Would you like to add an admin email now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter admin email: " admin_email
        echo "ADMIN_EMAILS=$admin_email" >> .env.local
        echo "✅ Added admin email to .env.local"
    fi
fi

# Check dependencies
echo "📦 Checking dependencies..."
if ! npm list lucide-react &> /dev/null; then
    echo "Installing lucide-react..."
    npm install lucide-react
fi

# Run the test script
echo "🧪 Running admin dashboard test..."
node scripts/test-admin-dashboard.js

echo ""
echo "✅ Admin Dashboard Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Ensure your Supabase project is connected"
echo "2. Database migration has been applied via MCP"
echo "3. Set ADMIN_EMAILS in your .env.local file"
echo "4. Start your development server: npm run dev"
echo "5. Navigate to http://localhost:3000/admin"
echo ""
echo "🔗 Documentation: docs/ADMIN_DASHBOARD.md"
echo "🧪 Test again: node scripts/test-admin-dashboard.js"