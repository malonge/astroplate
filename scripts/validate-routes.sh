#!/bin/bash

# Route validation script for astroplate
# Ensures exactly the expected routes are generated

set -e  # Exit on any error

echo "🔍 Starting route validation..."

# Build the site
echo "📦 Building site..."
npx yarn build

echo "✅ Build completed successfully"

# Get all HTML files and sort them
echo "🔍 Analyzing generated routes..."
HTML_FILES=$(find dist -maxdepth 2 -name "*.html" | sort)

# Count total routes
HTML_COUNT=$(echo "$HTML_FILES" | wc -l)

echo "📊 Found $HTML_COUNT HTML files"

# Expected routes (sorted alphabetically)
EXPECTED_ROUTES=(
    "/404.html"
    "/about/index.html"
    "/contact/index.html"
    "/cv/index.html"
    "/index.html"
    "/projects/index.html"
    "/publications/index.html"
)

EXPECTED_COUNT=${#EXPECTED_ROUTES[@]}

echo "📋 Expected $EXPECTED_COUNT routes"

# Check total count
if [ "$HTML_COUNT" -ne "$EXPECTED_COUNT" ]; then
    echo "❌ Route count mismatch!"
    echo "   Expected: $EXPECTED_COUNT"
    echo "   Found: $HTML_COUNT"
    echo ""
    echo "Generated routes:"
    echo "$HTML_FILES" | sed 's/^/   /'
    exit 1
fi

echo "✅ Route count validation passed"

# Convert HTML_FILES to array and normalize paths
GENERATED_ROUTES=()
while IFS= read -r line; do
    GENERATED_ROUTES+=("${line#dist}")
done < <(echo "$HTML_FILES" | sed 's|^dist||')

# Sort both arrays for comparison
IFS=$'\n' GENERATED_SORTED=($(sort <<<"${GENERATED_ROUTES[*]}"))
IFS=$'\n' EXPECTED_SORTED=($(sort <<<"${EXPECTED_ROUTES[*]}"))

echo "🔍 Validating individual routes..."

# Check each route matches exactly
for i in "${!EXPECTED_SORTED[@]}"; do
    expected="${EXPECTED_SORTED[$i]}"
    echo "🔍 Validating route $expected ..."
    generated="${GENERATED_SORTED[$i]}"
    
    if [ "$expected" != "$generated" ]; then
        echo "❌ Route mismatch at position $i:"
        echo "   Expected: $expected"
        echo "   Found:    $generated"
        echo ""
        echo "All generated routes:"
        printf '   %s\n' "${GENERATED_SORTED[@]}"
        echo ""
        echo "All expected routes:"
        printf '   %s\n' "${EXPECTED_SORTED[@]}"
        exit 1
    fi
done

echo "✅ All routes match expected structure"

# Additional validation: Check sitemap exists and has correct count
echo "🔍 Validating sitemap..."
if [ ! -f "dist/sitemap-0.xml" ]; then
    echo "❌ Sitemap not found at dist/sitemap-0.xml"
    exit 1
fi

# Count URLs in sitemap (excluding 404)
SITEMAP_URLS=$(grep -o "<loc>" dist/sitemap-0.xml | wc -l || echo "0")
EXPECTED_SITEMAP_URLS=8  # 8 public routes (excluding 404)

if [ "$SITEMAP_URLS" -ne "$EXPECTED_SITEMAP_URLS" ]; then
    echo "❌ Sitemap URL count mismatch!"
    echo "   Expected: $EXPECTED_SITEMAP_URLS public URLs"
    echo "   Found: $SITEMAP_URLS URLs"
    exit 1
fi

echo "✅ Sitemap validation passed"

# Final summary
echo ""
echo "🎉 Route validation completed successfully!"
echo "   ✅ Total routes: $HTML_COUNT"
echo "   ✅ Route structure: All match expected"
echo "   ✅ Sitemap: $SITEMAP_URLS public URLs"
echo ""
echo "All routes are valid and ready for deployment."
