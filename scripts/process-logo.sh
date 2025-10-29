#!/bin/bash

# Process the logo for different uses
# 1. Remove background for transparent version
# 2. Create simplified icon for navigation
# 3. Extract a circular crop for tight spaces

set -e

LOGO="public/images/logo.png"
PUBLIC="public/images"

echo "Processing logo for organic integration..."

# 1. Create transparent version (remove cream background)
echo "Creating transparent version..."
magick "$LOGO" -fuzz 15% -transparent '#f5ead8' -transparent '#e8dcc4' "$PUBLIC/logo-transparent.png"

# 2. Create a circular cropped version for icons
echo "Creating circular icon version..."
magick "$LOGO" \
  -gravity center \
  -crop 80%x80%+0+0 +repage \
  -alpha set \
  \( +clone -distort DePolar 0 -virtual-pixel HorizontalTile -background None -distort Polar 0 \) \
  -compose Dst_In -composite \
  "$PUBLIC/logo-circle.png"

# 3. Create small navigation icon (simplified, no background)
echo "Creating navigation icon..."
magick "$PUBLIC/logo-transparent.png" -resize 48x48 "$PUBLIC/logo-nav.png"
magick "$PUBLIC/logo-transparent.png" -resize 96x96 "$PUBLIC/logo-nav@2x.png"

# 4. Create decorative background versions (low opacity for backgrounds)
echo "Creating decorative background versions..."
magick "$PUBLIC/logo-transparent.png" \
  -resize 400x400 \
  -channel A -evaluate multiply 0.08 +channel \
  "$PUBLIC/logo-watermark.png"

echo ""
echo "✅ Logo processing complete!"
echo ""
echo "Generated files:"
ls -lh "$PUBLIC"/logo-*.png | awk '{printf "  - %-40s %8s\n", $9, $5}'
