age instea#!/usr/bin/env python3
import base64
from PIL import Image, ImageDraw

def create_icon(size):
    # Create a new image with a gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(size):
        for x in range(size):
            # Simple gradient from blue to purple
            r = int(102 + (x / size) * 54)  # 102 to 156
            g = int(126 + (y / size) * 54)  # 126 to 180
            b = int(234 + (x / size) * 18)  # 234 to 252
            draw.point((x, y), fill=(r, g, b, 255))
    
    # Draw a circle border
    center = size // 2
    radius = size // 2 - 2
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 outline=(51, 51, 51, 255), width=2)
    
    # Draw microphone icon (simplified)
    mic_width = size // 4
    mic_height = size // 2
    mic_x = center - mic_width // 2
    mic_y = center - mic_height // 2
    
    # Draw microphone bodyzi
    draw.rectangle([mic_x, mic_y, mic_x + mic_width, mic_y + mic_height], 
                   fill=(255, 255, 255, 200), outline=(255, 255, 255, 255), width=2)
    
    # Draw microphone lines
    line_spacing = mic_height // 4
    for i in range(1, 4):
        y = mic_y + i * line_spacing
        draw.line([mic_x + 2, y, mic_x + mic_width - 2, y], 
                  fill=(102, 126, 234, 255), width=2)
    
    # Draw center circle
    circle_radius = size // 8
    draw.ellipse([center - circle_radius, center - circle_radius, 
                  center + circle_radius, center + circle_radius], 
                 fill=(255, 255, 255, 150))
    
    return img

# Create icons for different sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    filename = f"icons/icon{size}.png"
    icon.save(filename, "PNG")
    print(f"Created {filename}")

print("All icons created successfully!")
