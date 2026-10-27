import pdfplumber
import os
from PIL import Image

RAW_DIR = "assets/academy/raw/"
IMG_DIR = "assets/academy/images/test/"
os.makedirs(IMG_DIR, exist_ok=True)

files = [f for f in os.listdir(RAW_DIR) if f.endswith(".pdf")]
if files:
    file_path = os.path.join(RAW_DIR, files[0])
    print(f"Testing {file_path}")
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            # Check for tables
            tables = page.extract_tables()
            if tables:
                print(f"Page {i+1}: Found {len(tables)} tables")
            
            # Check for images
            if hasattr(page, 'images') and page.images:
                print(f"Page {i+1}: Found {len(page.images)} images")
                for j, img in enumerate(page.images):
                    # pdfplumber doesn't extract the image bytes directly easily, 
                    # but we can crop the page and save as image.
                    bbox = (img['x0'], img['top'], img['x1'], img['bottom'])
                    try:
                        cropped = page.within_bbox(bbox).to_image(resolution=150)
                        img_path = os.path.join(IMG_DIR, f"p{i+1}_img{j+1}.png")
                        cropped.save(img_path)
                        print(f"  Saved image to {img_path}")
                    except Exception as e:
                        print(f"  Failed to save image {j+1}: {e}")
