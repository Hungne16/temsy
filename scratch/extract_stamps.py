import cv2
import numpy as np
import os

img_path = r"C:\Users\admin\.gemini\antigravity\brain\da78ed39-4ea4-488a-9ac1-c9d3b3ac47a1\.user_uploaded\media__1785698747092.jpg"
out_dir = r"C:\Users\admin\Desktop\Temsy\public\templates"
os.makedirs(out_dir, exist_ok=True)

img = cv2.imread(img_path)
if img is None:
    print("Error loading image")
    exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# The background is very dark (almost black). Let's threshold it.
_, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

# Find contours
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Sort contours by area, keep top 5
contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

# Sort contours top to bottom, then left to right
def get_pos(c):
    x, y, w, h = cv2.boundingRect(c)
    # y coordinate quantization to row
    row = int(y / 150)
    return (row, x)

contours = sorted(contours, key=get_pos)

for i, c in enumerate(contours):
    x, y, w, h = cv2.boundingRect(c)
    # Add a small padding if possible
    pad = 0
    y1 = max(0, y - pad)
    y2 = min(img.shape[0], y + h + pad)
    x1 = max(0, x - pad)
    x2 = min(img.shape[1], x + w + pad)
    
    stamp = img[y1:y2, x1:x2]
    
    # Create an RGBA image
    stamp_rgba = cv2.cvtColor(stamp, cv2.COLOR_BGR2BGRA)
    
    # We want to make the checkerboard transparent.
    # The checkerboard is usually a repeating pattern of white/gray.
    # A simple trick is to look for the central region and use floodfill from the center 
    # to create a mask for the inner frame, but checkerboard isn't a single color!
    # Let's just output them as they are first to see what we get, and we can overlay the photo on top.
    # Actually, we can use the transparent property: OpenCV can't easily remove checkerboard.
    # But wait, maybe the user wants the photo UNDER the stamp?
    # If we want the photo UNDER the stamp, we MUST make the center transparent.
    # Let's find the inner rectangle.
    # Convert to grayscale
    stamp_gray = cv2.cvtColor(stamp, cv2.COLOR_BGR2GRAY)
    # Threshold to find whiteish/gray areas?
    # Better: find contours again inside this stamp.
    # The inner frame will be a large rectangular contour.
    edges = cv2.Canny(stamp_gray, 50, 150)
    # Dilate edges to connect them
    kernel = np.ones((3,3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    
    inner_contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    inner_contours = sorted(inner_contours, key=cv2.contourArea, reverse=True)
    
    # Find the largest inner contour that has a reasonable aspect ratio
    inner_rect = None
    stamp_area = w * h
    for ic in inner_contours:
        area = cv2.contourArea(ic)
        if area > stamp_area * 0.2 and area < stamp_area * 0.9:
            ix, iy, iw, ih = cv2.boundingRect(ic)
            inner_rect = (ix, iy, iw, ih)
            break
            
    if inner_rect:
        ix, iy, iw, ih = inner_rect
        # Make this inner region transparent
        # We can add a bit of padding so we don't cut too much
        # But wait, it's safer to just set the alpha channel to 0 for the inner rect.
        stamp_rgba[iy+2:iy+ih-2, ix+2:ix+iw-2, 3] = 0
    else:
        # Fallback: just hardcode a central crop? (e.g. 10% padding)
        ix, iy = int(w*0.1), int(h*0.1)
        iw, ih = int(w*0.8), int(h*0.8)
        stamp_rgba[iy:iy+ih, ix:ix+iw, 3] = 0

    # Also make the dark background of the outer part transparent
    # Any pixel very dark can be transparent
    lower_black = np.array([0, 0, 0, 255])
    upper_black = np.array([30, 30, 30, 255])
    mask_black = cv2.inRange(stamp_rgba, lower_black, upper_black)
    stamp_rgba[mask_black > 0, 3] = 0
    
    out_path = os.path.join(out_dir, f"template_{i+1}.png")
    cv2.imwrite(out_path, stamp_rgba)
    print(f"Saved {out_path}")

print("Extraction complete.")
