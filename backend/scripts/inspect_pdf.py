import pdfplumber
import os

RAW_DIR = "assets/academy/raw/"
file_path = os.path.join(RAW_DIR, "cocoa-inventory.pdf")
if os.path.exists(file_path):
    with pdfplumber.open(file_path) as pdf:
        page = pdf.pages[0]
        print(f"File: {file_path}")
        print(f"Total Pages: {len(pdf.pages)}")
        print(f"Objects on page 1: {page.objects.keys()}")
        if 'image' in page.objects:
            print(f"Images: {len(page.objects['image'])}")
        if 'rect' in page.objects:
            print(f"Rects: {len(page.objects['rect'])}")
