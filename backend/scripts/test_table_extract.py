import pdfplumber
import os

def to_markdown_table(table):
    if not table:
        return ""
    # Filter out empty rows/columns
    table = [[cell if cell else "" for cell in row] for row in table]
    if not any(table):
        return ""
    
    header = table[0]
    body = table[1:]
    
    md = "| " + " | ".join(header) + " |\n"
    md += "| " + " | ".join(["---"] * len(header)) + " |\n"
    for row in body:
        md += "| " + " | ".join(row) + " |\n"
    return md

RAW_DIR = "assets/academy/raw/"
files = [f for f in os.listdir(RAW_DIR) if f.endswith(".pdf")]
if files:
    with pdfplumber.open(os.path.join(RAW_DIR, files[0])) as pdf:
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if tables:
                print(f"--- Page {i+1} Tables ---")
                for table in tables:
                    print(to_markdown_table(table))
