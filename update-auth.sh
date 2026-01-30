#!/bin/bash

# Script to replace all fetch() calls with authenticatedFetch() in app.js
# This ensures all API calls include authentication tokens

echo "🔄 Updating API calls to include authentication..."

FILE="js/app.js"

# Backup the original file
cp "$FILE" "${FILE}.backup"
echo "✅ Created backup: ${FILE}.backup"

# Count current fetch calls
FETCH_COUNT=$(grep -c "fetch(" "$FILE")
echo "📊 Found $FETCH_COUNT fetch() calls to update"

# Replace fetch( with authenticatedFetch(
# This uses sed to replace all instances
sed -i '' 's/fetch(/authenticatedFetch(/g' "$FILE"

# Verify changes
AUTH_FETCH_COUNT=$(grep -c "authenticatedFetch(" "$FILE")
echo "✅ Updated to $AUTH_FETCH_COUNT authenticatedFetch() calls"

# Show what changed
echo ""
echo "📝 Changes made:"
git diff --no-index "${FILE}.backup" "$FILE" | grep -E "^\+.*authenticatedFetch|^\-.*[^d]fetch" | head -20

echo ""
echo "✨ Done! All API calls now use authentication."
echo "💡 To restore: mv ${FILE}.backup $FILE"
