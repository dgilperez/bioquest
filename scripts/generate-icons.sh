#!/bin/bash

# Generate all required icon sizes from the BioQuest logo
# Requires ImageMagick (brew install imagemagick)

set -e

LOGO="public/images/logo.png"
PUBLIC="public"

# Check if logo exists
if [ ! -f "$LOGO" ]; then
    echo "Error: Logo not found at $LOGO"
    exit 1
fi

echo "Generating icons from $LOGO..."

# Favicon (multi-size ICO)
echo "Generating favicon.ico..."
convert "$LOGO" -resize 16x16 -background '#f5ead8' -flatten /tmp/icon-16.png
convert "$LOGO" -resize 32x32 -background '#f5ead8' -flatten /tmp/icon-32.png
convert "$LOGO" -resize 48x48 -background '#f5ead8' -flatten /tmp/icon-48.png
convert /tmp/icon-16.png /tmp/icon-32.png /tmp/icon-48.png "$PUBLIC/favicon.ico"
rm /tmp/icon-*.png

# Apple touch icon
echo "Generating apple-touch-icon.png (180x180)..."
convert "$LOGO" -resize 180x180 -background '#f5ead8' -flatten "$PUBLIC/apple-touch-icon.png"

# Android icons
echo "Generating icon-192.png..."
convert "$LOGO" -resize 192x192 -background '#f5ead8' -flatten "$PUBLIC/icon-192.png"

echo "Generating icon-512.png..."
convert "$LOGO" -resize 512x512 -background '#f5ead8' -flatten "$PUBLIC/icon-512.png"

# Maskable icons (with 10% padding safe zone)
echo "Generating icon-maskable-192.png..."
convert "$LOGO" -resize 154x154 -gravity center -background '#f5ead8' -extent 192x192 "$PUBLIC/icon-maskable-192.png"

echo "Generating icon-maskable-512.png..."
convert "$LOGO" -resize 410x410 -gravity center -background '#f5ead8' -extent 512x512 "$PUBLIC/icon-maskable-512.png"

# Social media OG image
echo "Generating og-image.png (1200x630)..."
convert -size 1200x630 xc:'#f5ead8' \
    \( "$LOGO" -resize 400x400 \) \
    -gravity center -composite "$PUBLIC/og-image.png"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Generated files:"
ls -lh "$PUBLIC"/*.{ico,png} 2>/dev/null | grep -E "(favicon|icon-|apple-touch|og-)" | awk '{print "  -", $9, "(" $5 ")"}'
