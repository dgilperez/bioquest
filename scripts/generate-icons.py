#!/usr/bin/env python3
"""
Generate all required icon sizes from the BioQuest logo.
Requires Pillow: pip install Pillow
"""

from PIL import Image
import os

# Paths
LOGO_PATH = "public/images/logo.png"
PUBLIC_DIR = "public"

# Icon sizes needed
SIZES = {
    "favicon.ico": [(16, 16), (32, 32), (48, 48)],  # Multi-size ICO
    "icon-192.png": (192, 192),  # Android
    "icon-512.png": (512, 512),  # Android
    "apple-touch-icon.png": (180, 180),  # iOS
    "icon-maskable-192.png": (192, 192),  # Maskable Android (with padding)
    "icon-maskable-512.png": (512, 512),  # Maskable Android (with padding)
}

def add_padding_for_maskable(image, target_size):
    """Add 10% padding around the image for maskable icons (safe zone)."""
    # Create new image with padding
    padding_percent = 0.1
    inner_size = int(target_size * (1 - 2 * padding_percent))

    # Resize image to fit in safe zone
    image_resized = image.resize((inner_size, inner_size), Image.Resampling.LANCZOS)

    # Create new image with target size and cream background
    new_img = Image.new('RGBA', (target_size, target_size), (245, 234, 216, 255))

    # Calculate position to center the image
    offset = int(target_size * padding_percent)
    new_img.paste(image_resized, (offset, offset), image_resized)

    return new_img

def generate_icons():
    """Generate all required icon sizes from the logo."""

    # Check if logo exists
    if not os.path.exists(LOGO_PATH):
        print(f"Error: Logo not found at {LOGO_PATH}")
        return

    # Load original logo
    print(f"Loading logo from {LOGO_PATH}")
    logo = Image.open(LOGO_PATH)

    # Convert to RGBA if not already
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')

    print(f"Original logo size: {logo.size}")

    # Generate each icon size
    for filename, size_info in SIZES.items():
        output_path = os.path.join(PUBLIC_DIR, filename)

        if filename == "favicon.ico":
            # Special handling for ICO (multi-size)
            icon_images = []
            for size in size_info:
                resized = logo.resize(size, Image.Resampling.LANCZOS)
                icon_images.append(resized)

            # Save as ICO
            icon_images[0].save(
                output_path,
                format='ICO',
                sizes=size_info
            )
            print(f"Generated {filename} with sizes {size_info}")

        elif "maskable" in filename:
            # Maskable icons need padding for safe zone
            size = size_info
            padded_image = add_padding_for_maskable(logo, size[0])
            padded_image.save(output_path, format='PNG', optimize=True)
            print(f"Generated {filename} ({size[0]}x{size[1]}) with safe zone padding")

        else:
            # Regular PNG icons
            size = size_info
            resized = logo.resize(size, Image.Resampling.LANCZOS)
            resized.save(output_path, format='PNG', optimize=True)
            print(f"Generated {filename} ({size[0]}x{size[1]})")

    # Also create social media preview (OG image)
    print("\nGenerating social media preview...")
    og_width, og_height = 1200, 630
    og_image = Image.new('RGBA', (og_width, og_height), (245, 234, 216, 255))

    # Calculate logo size (40% of height)
    logo_height = int(og_height * 0.4)
    logo_width = int(logo_height * (logo.size[0] / logo.size[1]))
    logo_resized = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

    # Center logo
    x = (og_width - logo_width) // 2
    y = (og_height - logo_height) // 2
    og_image.paste(logo_resized, (x, y), logo_resized)

    og_path = os.path.join(PUBLIC_DIR, "og-image.png")
    og_image.save(og_path, format='PNG', optimize=True)
    print(f"Generated og-image.png (1200x630)")

    print("\n✅ All icons generated successfully!")
    print("\nGenerated files:")
    for filename in list(SIZES.keys()) + ["og-image.png"]:
        path = os.path.join(PUBLIC_DIR, filename)
        if os.path.exists(path):
            size = os.path.getsize(path)
            print(f"  - {filename} ({size / 1024:.1f} KB)")

if __name__ == "__main__":
    generate_icons()
