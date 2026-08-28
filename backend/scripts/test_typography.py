import pdfplumber
import os
from collections import Counter

def get_font_style(char):
    fontname = char.get('fontname', '').lower()
    style = ""
    if 'bold' in fontname:
        style = "bold"
    if 'italic' in fontname or 'oblique' in fontname:
        style = style + "italic" if style else "italic"
    return style

def process_page(page):
    chars = page.chars
    if not chars:
        return ""
    
    # Calculate median font size for body text detection
    sizes = [round(c['size'], 2) for c in chars]
    if not sizes:
        return ""
    median_size = Counter(sizes).most_common(1)[0][0]
    
    lines = []
    current_line = []
    last_top = chars[0]['top']
    
    for char in chars:
        if abs(char['top'] - last_top) > 2: # New line threshold
            lines.append(current_line)
            current_line = []
        current_line.append(char)
        last_top = char['top']
    lines.append(current_line)
    
    formatted_text = ""
    for line in lines:
        if not line: continue
        
        # Determine if heading
        line_size = Counter([round(c['size'], 2) for c in line]).most_common(1)[0][0]
        prefix = ""
        if line_size > median_size * 1.4:
            prefix = "## "
        elif line_size > median_size * 1.15:
            prefix = "### "
            
        line_text = ""
        last_style = ""
        
        for char in line:
            style = get_font_style(char)
            text = char['text']
            
            if style != last_style:
                if last_style == "bold": line_text += "**"
                if last_style == "italic": line_text += "*"
                if last_style == "bolditalic": line_text += "***"
                
                if style == "bold": line_text += "**"
                if style == "italic": line_text += "*"
                if style == "bolditalic": line_text += "***"
            
            line_text += text
            last_style = style
            
        # Close tags at end of line
        if last_style == "bold": line_text += "**"
        if last_style == "italic": line_text += "*"
        if last_style == "bolditalic": line_text += "***"
        
        formatted_text += prefix + line_text + "\n"
        
    return formatted_text

RAW_DIR = "assets/academy/raw/"
file_path = os.path.join(RAW_DIR, "cocoa-inventory.pdf")
if os.path.exists(file_path):
    with pdfplumber.open(file_path) as pdf:
        print(f"--- Typography Test: {file_path} ---")
        print(process_page(pdf.pages[0])[:1000])
