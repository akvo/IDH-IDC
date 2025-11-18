# Plan: Fix text_to_html function for proper list and heading detection

## Issues to fix:

### 1. Lines starting with "o " (sub-bullets) should be converted to `<ul><li>` HTML lists
- **Example:** `"o    Conducting a human rights impact assessment"` � `<li>Conducting a human rights impact assessment</li>`
- Need to wrap consecutive "o" items in `<ul>...</ul>` tags
- Track when we're inside a list and properly open/close `<ul>` tags

### 2. Long descriptive paragraphs should NOT be converted to headings
- **Example:** `"As part of external analysis, review publicly available supplier information..."` is currently being converted to `<h3>` incorrectly
- This happens because it contains a colon (":") and gets caught by the label-value pair logic
- **Fix:** Only convert to heading if the line is short AND contains a colon, OR if it's a standalone short title
- Suggested threshold: Only trigger heading if line < 60 chars (or similar reasonable limit)

### 3. Apply the next_non_empty_line logic to skip blank lines
- When detecting section headers for numbered bullets, skip empty lines to find the next actual content line
- This fixes cases like:
  ```
  1. Enabling Conditions for Carbon Sequestration:

  Sustainable Sourcing Policies: ...
  ```

## Changes needed:

1. **Add "o " pattern detection** for sub-bullets
   - Detect lines matching `^o\s+` pattern
   - Extract text after "o " and wrap in `<li>` tags
   - Track list state with `in_list` flag
   - Open `<ul>` when first "o" item appears
   - Close `</ul>` when non-"o" line appears

2. **Fix the colon-based heading detection**
   - Current logic: Any line with ":" that doesn't have content after � `<h3>`
   - **New logic:** Only convert to `<h3>` if line is short (< 60 chars) and ends with ":"
   - This prevents long sentences with colons from becoming headings

3. **Apply next_non_empty_line logic** in numbered bullet handling
   - Loop through subsequent lines to find first non-empty line
   - Use that for determining if numbered bullet is a section header

4. **Ensure proper `<ul>` opening/closing**
   - Close list when transitioning from "o" items to non-list content
   - Close list at end of text if still open

## Code Snippet - Updated text_to_html function:

```python
def text_to_html(text):
    """Convert structured text into readable HTML with headings, links, and paragraphs."""
    if pd.isna(text) or str(text).strip() == "":
        return ""

    lines = str(text).split("\n")
    formatted_lines = []
    in_list = False  # Track if we're inside a <ul> list

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue

        # Handle sub-bullets starting with "o" (e.g., "o    Item text")
        if re.match(r"^o\s+", line):
            # Open <ul> if not already in a list
            if not in_list:
                formatted_lines.append("<ul>")
                in_list = True
            # Extract text after "o "
            item_text = re.sub(r"^o\s+", "", line)
            formatted_lines.append(f"<li>{item_text}</li>")
            continue
        else:
            # Close </ul> if we were in a list and now hit a non-list item
            if in_list:
                formatted_lines.append("</ul>")
                in_list = False

        # Handle numbered/bullet lists
        if re.match(r"^\d+\.\s", line):
            if "http" in line:
                formatted_lines.append(f'<a href="{line[3:].strip()}" target="_blank">{line}</a><br/>')
            else:
                # Check if this is a section header (short line, followed by non-numbered content)
                # Look for next non-empty line (skip blank lines)
                is_section_header = False
                next_non_empty_line = None
                for j in range(i + 1, len(lines)):
                    temp_line = lines[j].strip()
                    if temp_line:  # Found first non-empty line
                        next_non_empty_line = temp_line
                        break

                if next_non_empty_line and not re.match(r"^\d+\.\s", next_non_empty_line):
                    # Current line is likely a section header if it's short (<80 chars) or ends with colon
                    if len(line) < 80 or line.rstrip().endswith(':'):
                        is_section_header = True

                if is_section_header:
                    formatted_lines.append(f"<h3>{line}</h3>")
                else:
                    formatted_lines.append(f"<p>{line}</p>")

        # Convert titles to headings
        elif any(keyword.lower() in line.lower() for keyword in [
            "definition:", "enabling conditions", "business rationale",
            "farmer rationale", "risks:", "trade-offs:"
        ]):
            if len(line) < 90:
                formatted_lines.append(f"<h4>{line.replace(':', '')}</h4>")
            else:
                formatted_lines.append(f"<p>{line}</p>")

        # Convert URLs
        elif re.search(r"https?://\S+", line):
            line = re.sub(r"(https?://\S+)", r'<a href="\1" target="_blank">\1</a>', line)
            formatted_lines.append(f"<p>{line}</p>")

        # Bold label-value pairs - FIXED: Only short lines with colons
        elif ":" in line and not re.match(r"^\d+\.\s", line):
            parts = line.split(":", 1)
            if len(parts) == 2 and parts[1].strip():
                formatted_lines.append(f"<p><b>{parts[0]}:</b> {parts[1]}</p>")
            # Only convert to h3 if line is short (< 60 chars)
            elif len(line) < 60:
                formatted_lines.append(f"<h3>{line}</h3>")
            else:
                formatted_lines.append(f"<p>{line}</p>")

        # Detect standalone section headers: short lines with title-case pattern
        # - Less than 50 chars
        # - Starts with capital letter
        # - Contains only letters, spaces, and common connectors (&, -)
        # - Not ending with punctuation like . or ,
        elif (len(line) < 50 and
              re.match(r"^[A-Z][a-zA-Z\s&\-]+$", line) and
              not line.endswith(('.', ',', ';'))):
            formatted_lines.append(f"<h3>{line}</h3>")

        else:
            formatted_lines.append(f"<p>{line}</p>")

    # Close list if still open at end
    if in_list:
        formatted_lines.append("</ul>")

    return "\n".join(formatted_lines)
```

## Expected output after fixes:

```html
<p>Understanding whether suppliers are internalising sustainability risks is critical to identifying the risks they may expose a buyer's business to.</p>
<p>As part of external analysis, review publicly available supplier information, or information shared in confidence by the supplier, (e.g. sustainability commitments, strategies, policies, codes of conduct) and create a simple table capturing evidence of the following:</p>
<p>"    Material sustainability risk assessment linked to sourcing practices</p>
<p>"    Environmental impact policies and prevention measures (e.g. climate, deforestation, water, nature)</p>
<p>"    Human rights due diligence in the upstream supply chain, including:</p>
<ul>
<li>Conducting a human rights impact assessment</li>
<li>Awareness and actions to prevent forced labour</li>
<li>Awareness and actions to prevent child labour</li>
<li>Living wage/income considerations</li>
<li>Consideration of Free Prior Informed Consent regarding Indigenous Communities and land rights</li>
</ul>
```



## OLD scripts
```
def text_to_html(text):
    """Convert structured text into readable HTML with headings, links, and paragraphs."""
    if pd.isna(text) or str(text).strip() == "":
        return ""

    lines = str(text).split("\n")
    formatted_lines = []

    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        # perspective heading
        perspective_pattern = re.compile(r"^(\d+\.\s+)?.*perspective.*$", re.IGNORECASE)

        if re.match(r"^\d+\.\s", line):
            # Handle numbered/bullet lists
            if "http" in line:
                formatted_lines.append(f'<a href="{line[3:].strip()}" target="_blank">{line}</a><br/>')
            elif perspective_pattern.match(line):
                formatted_lines.append(f"<h3>{line}</h3>")
            else:
                # Check if this is a section header (short line, followed by non-numbered content)
                # Look at next non-empty line
                is_section_header = False
                next_non_empty_line = None
                for j in range(i + 1, len(lines)):
                    temp_line = lines[j].strip()
                    if temp_line:  # Found first non-empty line
                        next_non_empty_line = temp_line
                        break
                if next_non_empty_line and not re.match(r"^\d+\.\s", next_non_empty_line):
                    if len(line) < 80 or line.rstrip().endswith(':'):
                        is_section_header = True
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    # If next line exists and doesn't start with a number, and current line is short or ends with colon
                    if next_line and not re.match(r"^\d+\.\s", next_line):
                        # Current line is likely a section header if it's short (<80 chars) or ends with colon
                        if (
                            len(line) < 90 or
                            line.rstrip().endswith(':')
                        ):
                            is_section_header = True
                
                if is_section_header:
                    formatted_lines.append(f"<h3>{line}</h3>")
                else:
                    formatted_lines.append(f"<p>{line}</p>")

        # Convert titles to headings
        elif any(keyword.lower() in line.lower() for keyword in [
            "definition:", "enabling conditions", "business rationale",
            "farmer rationale", "risks:", "trade-offs:"
        ]):
            if len(line) < 90:
                formatted_lines.append(f"<h4>{line.replace(':', '')}</h4>")
            else:
                formatted_lines.append(f"<p>{line}</p>")

        # Convert URLs
        elif re.search(r"https?://\S+", line):
            line = re.sub(r"(https?://\S+)", r'<a href="\1" target="_blank">\1</a>', line)
            formatted_lines.append(f"<p>{line}</p>")

        # Bold label-value pairs
        elif ":" in line and not re.match(r"^\d+\.\s", line):
            parts = line.split(":", 1)
            if len(parts) == 2 and parts[1].strip():
                formatted_lines.append(f"<p><b>{parts[0]}:</b> {parts[1]}</p>")
            else:
                formatted_lines.append(f"<h3>{line}</h3>")
        # Detect standalone section headers: short lines with title-case pattern
        # - Less than 50 chars
        # - Starts with capital letter
        # - Contains only letters, spaces, and common connectors (&, -)
        # - Not ending with punctuation like . or ,
        elif (len(line) < 90 and 
              re.match(r"^[A-Z][a-zA-Z\s&\-]+$", line) and
              not line.endswith(('.', ',', ';'))):
            formatted_lines.append(f"<h3>{line}</h3>")

        else:
            formatted_lines.append(f"<p>{line}</p>")

    return "\n".join(formatted_lines)
```