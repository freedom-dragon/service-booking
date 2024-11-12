#!/bin/bash

# Define the parent directory
PARENT_DIR="../public/assets/shops"

find "$PARENT_DIR" -type f -iname "logo.webp" | while read -r webp_file; do
    
    png_file="${webp_file%.webp}.png"
    magick "$webp_file" "$png_file"
    echo "Converted: $webp_file to logo.png"
    
done