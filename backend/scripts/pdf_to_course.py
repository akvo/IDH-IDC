import os
import json
import pdfplumber
import re
import unicodedata
from typing import Dict, List
from collections import Counter

# Configuration
RAW_DIR = "assets/academy/raw/"
COURSE_DIR = "assets/academy/courses/"
# Asset path for images (absolute within container)
ASSET_IMG_DIR = "/app/assets/academy/courses/"
# Public base URL for the backend static assets
PUBLIC_ASSET_BASE = "/api/assets/academy/courses"


class PDFToCourseTransformer:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.course_id = os.path.basename(file_path).split(".")[0]
        self.raw_text = ""
        self.chapters = []
        self.img_dir = os.path.join(ASSET_IMG_DIR, self.course_id, "images")
        os.makedirs(self.img_dir, exist_ok=True)

    def get_font_style(self, char: Dict) -> str:
        """Detect bold/italic and math fonts."""
        fontname = char.get("fontname", "").lower()
        style = ""
        if "bold" in fontname:
            style = "bold"
        if "italic" in fontname or "oblique" in fontname:
            style = style + "italic" if style else "italic"

        # Check for math fonts
        is_math = any(
            x in fontname for x in ["math", "symbol", "cmsy", "cmmi", "msbm"]
        )
        if is_math:
            style = style + "math" if style else "math"

        return style

    def normalize_text(self, text: str) -> str:
        """Normalize mathematical alphanumeric symbols to standard text."""
        return unicodedata.normalize("NFKC", text)

    def to_markdown_table(self, table: List[List]) -> str:
        """Convert pdfplumber table to Markdown."""
        if not table or not any(table):
            return ""

        # Clean cells
        table = [
            [(str(cell).replace("\n", " ") if cell else "") for cell in row]
            for row in table
        ]

        header = table[0]
        body = table[1:]

        md = "\n| " + " | ".join(header) + " |\n"
        md += "| " + " | ".join(["---"] * len(header)) + " |\n"
        for row in body:
            md += "| " + " | ".join(row) + " |\n"
        return md + "\n"

    def extract_text(self):
        """Extract content with typography, tables, and images."""
        print(f"--- Extracting content from {self.file_path} ---")
        full_content = []

        with pdfplumber.open(self.file_path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_content = self.process_page(page, i + 1)
                full_content.append(page_content)

        self.raw_text = "\n\n".join(full_content)

    def sanitize_markdown(self, text: str) -> str:
        """Clean up markdown artifacts and unbalanced markers."""
        if not text:
            return ""

        # 1. Remove empty/single-char formatting
        text = re.sub(r"\*\*+\s*\*\*+", "", text)
        text = re.sub(r"\*+\s*\*+", "", text)

        # 2. Fix trailing artifacts like "Text **"
        text = re.sub(r"([a-zA-Z0-9])\s+(\*\*+)$", r"\1\2", text)
        text = re.sub(r"([a-zA-Z0-9])\s+(\*+)$", r"\1\2", text)

        # 3. Ensure no spaces are trapped inside markers: ** word ** ->  **word**
        text = re.sub(r"\*\* \s*(.*?)\s* \*\*", r" **\1** ", text)
        text = re.sub(r"\* \s*(.*?)\s* \*", r" *\1* ", text)

        # 4. Final Balance Check: If odd number of asterisks, strip them
        is_list = text.startswith("- ")
        content = text[2:] if is_list else text
        if content.count("*") % 2 != 0:
            content = content.replace("*", "")

        return ("- " + content.strip()) if is_list else content.strip()

    def extract_visuals(self, page, page_num) -> List[Dict]:
        """Identify and extract visuals (images, graphs, charts)."""
        visuals = []

        # 1. Raster Images
        if hasattr(page, "images"):
            for j, img in enumerate(page.images):
                bbox = (img["x0"], img["top"], img["x1"], img["bottom"])
                w, h = (img["x1"] - img["x0"]), (img["bottom"] - img["top"])
                if w < 30 or h < 30:
                    continue

                img_filename = f"p{page_num}_img{j+1}.png"
                img_path = os.path.join(self.img_dir, img_filename)

                try:
                    page.within_bbox(bbox).to_image(resolution=300).save(
                        img_path
                    )
                    pub_url = f"{PUBLIC_ASSET_BASE}/{self.course_id}/images/{img_filename}"
                    visuals.append(
                        {
                            "top": img["top"],
                            "type": "image",
                            "content": f"\n![Image]({pub_url})\n",
                        }
                    )
                except Exception as e:
                    print(
                        f"  Warning: Raster image failed on p{page_num}: {e}"
                    )

        # 2. Vector Graphics (Graphs/Charts)
        # Find rects and curves that likely form a chart
        vectors = page.rects + page.curves
        if vectors:
            # Group contiguous vector elements into a single bounding box
            # Clip to page boundaries
            v_x0 = max(0, min(v["x0"] for v in vectors))
            v_top = max(0, min(v["top"] for v in vectors))
            v_x1 = min(page.width, max(v["x1"] for v in vectors))
            v_bottom = min(page.height, max(v["bottom"] for v in vectors))

            v_w = v_x1 - v_x0
            v_h = v_bottom - v_top

            # If it's a significant drawing area
            if v_w > 100 and v_h > 100:
                # Check if this overlaps with text too much (heuristic)
                # If it's mostly drawings, render it
                graph_filename = f"p{page_num}_graph.png"
                graph_path = os.path.join(self.img_dir, graph_filename)

                try:
                    bbox = (v_x0, v_top, v_x1, v_bottom)
                    page.within_bbox(bbox).to_image(resolution=300).save(
                        graph_path
                    )
                    pub_url = f"{PUBLIC_ASSET_BASE}/{self.course_id}/images/{graph_filename}"
                    visuals.append(
                        {
                            "top": v_top,
                            "type": "image",
                            "content": f"\n![Graph/Illustration]({pub_url})\n",
                        }
                    )
                except Exception as e:
                    print(
                        f"  Warning: Vector graph failed on p{page_num}: {e}"
                    )

        return visuals

    def process_page(self, page, page_num) -> str:
        """Process a single page, interleaving text, tables, and images."""
        objects = []

        # 1. Extract Text
        chars = page.chars
        if chars:
            # ... (rest of the text extraction logic remains same)
            # Calculate median font size for body text detection
            sizes = [round(c["size"], 2) for c in chars]
            median_size = Counter(sizes).most_common(1)[0][0] if sizes else 10

            lines = []
            current_line = []
            last_top = chars[0]["top"]

            for char in chars:
                if abs(char["top"] - last_top) > 3:  # Line threshold
                    lines.append(current_line)
                    current_line = []
                current_line.append(char)
                last_top = char["top"]
            lines.append(current_line)

            seen_lines = set()
            for line in lines:
                if not line:
                    continue

                raw_text = "".join([c["text"] for c in line]).strip()
                norm_text = re.sub(r"\s+", " ", raw_text).lower()
                if not norm_text or norm_text in seen_lines:
                    continue
                seen_lines.add(norm_text)

                line_sizes = [round(c["size"], 2) for c in line]
                line_size = Counter(line_sizes).most_common(1)[0][0]
                top_coord = min(c["top"] for c in line)
                bottoms = [round(c["bottom"], 1) for c in line]
                baseline = Counter(bottoms).most_common(1)[0][0]

                prefix = ""
                if line_size > median_size * 1.4:
                    prefix = "## "
                elif line_size > median_size * 1.15:
                    prefix = "### "

                bullet_match = re.match(r"^[•\-\*]\s*", raw_text)
                bullet = bullet_match.group(0) if bullet_match else ""

                chunks = []

                def get_full_style(char):
                    s = self.get_font_style(char)
                    if (
                        char["bottom"] < baseline - 1.5
                        and char["size"] < line_size * 0.95
                    ):
                        return s + "|sup"
                    if (
                        char["top"] > top_coord + 1.5
                        and char["size"] < line_size * 0.95
                    ):
                        return s + "|sub"
                    return s

                curr_text = ""
                curr_style = get_full_style(line[0])
                for char in line:
                    style = get_full_style(char)
                    text = self.normalize_text(char["text"])
                    if style == curr_style:
                        curr_text += text
                    else:
                        chunks.append((curr_text, curr_style))
                        curr_text = text
                        curr_style = style
                chunks.append((curr_text, curr_style))

                line_text = ""
                is_math_line = False
                for i, (text, style) in enumerate(chunks):
                    pure_style = style.split("|")[0]
                    is_sup = "|sup" in style
                    is_sub = "|sub" in style
                    if "math" in pure_style or is_sup or is_sub:
                        is_math_line = True
                    processed_text = text
                    if is_sup:
                        processed_text = f"^{{{processed_text}}}"
                    elif is_sub:
                        processed_text = f"_{{{processed_text}}}"

                    if not pure_style or "math" in pure_style:
                        line_text += processed_text
                    else:
                        sym = (
                            pure_style.replace("bolditalic", "***")
                            .replace("bold", "**")
                            .replace("italic", "*")
                        )
                        if (
                            i == 0
                            and bullet
                            and processed_text.startswith(bullet)
                        ):
                            line_text += bullet
                            processed_text = processed_text[len(bullet) :]
                        l_space = " " if processed_text.startswith(" ") else ""
                        r_space = " " if processed_text.endswith(" ") else ""
                        t = processed_text.strip()
                        if t:
                            line_text += f"{l_space}{sym}{t}{sym}{r_space}"
                        else:
                            line_text += processed_text

                math_ops = [
                    "=",
                    "+",
                    "−",
                    "×",
                    "÷",
                    "√",
                    "∑",
                    "∫",
                    "≈",
                    "≠",
                    "≤",
                    "≥",
                    "±",
                    "−",
                    "∗",
                    "×",
                ]
                if not is_math_line and any(
                    op in line_text for op in math_ops
                ):
                    words = [w for w in line_text.split() if w.strip()]
                    alpha_count = sum(c.isalpha() for c in line_text)
                    if len(words) < 8 or alpha_count < len(line_text) * 0.5:
                        is_math_line = True

                if is_math_line:
                    line_text = re.sub(r"}\^{", "", line_text)
                    line_text = re.sub(r"}_{", "", line_text)
                    x0 = min(c["x0"] for c in line)
                    x1 = max(c["x1"] for c in line)
                    is_centered = abs((x0 + x1) / 2 - page.width / 2) < 30
                    if not prefix:
                        if (is_centered or len(line_text.split()) < 5) and len(
                            line_text.strip()
                        ) > 2:
                            line_text = f"$$\n{line_text.strip()}\n$$"
                        else:
                            line_text = f"${line_text.strip()}$"
                else:
                    line_text = self.sanitize_markdown(line_text)

                if not is_math_line:
                    line_text = re.sub(r"^[•\-\*]\s*", "- ", line_text.strip())

                objects.append(
                    {
                        "top": top_coord,
                        "type": "text",
                        "content": prefix + line_text,
                    }
                )

        # 2. Extract Tables
        tables = page.find_tables()
        for table_obj in tables:
            md_table = self.to_markdown_table(table_obj.extract())
            objects.append(
                {
                    "top": table_obj.bbox[1],
                    "type": "table",
                    "content": md_table,
                }
            )

        # 3. Extract Visuals (Images & Graphs)
        visuals = self.extract_visuals(page, page_num)
        objects.extend(visuals)

        # Sort all objects by vertical position
        objects.sort(key=lambda x: x["top"])
        return "\n".join([obj["content"] for obj in objects])

    def split_chapters(self):
        """Split text into chapters based on headers."""
        print("--- Splitting into chapters ---")

        chapter_pattern = re.compile(
            r"^(##\s+.*|"
            r"(?:Chapter|Section|Scenario)\s+\d+[:.]?.*|"
            r".*?\?$|"
            r"^Methodology of.*|"
            r"^Data Protection.*|"
            r"^Citation.*|"
            r"^Contact information.*)",
            re.MULTILINE,
        )

        matches = list(chapter_pattern.finditer(self.raw_text))

        if not matches:
            print("No chapter markers found. Treating as one chapter.")
            self.chapters.append(
                {
                    "id": f"{self.course_id}-ch1",
                    "title": "Module 1",
                    "content": self.raw_text.strip(),
                    "quiz": self.generate_quiz(self.raw_text),
                }
            )
            return

        for i in range(len(matches)):
            start = matches[i].start()
            nxt = i + 1
            end = (
                matches[nxt].start()
                if nxt < len(matches)
                else len(self.raw_text)
            )

            title = matches[i].group(0).replace("##", "").strip()
            content = self.raw_text[start:end].strip()

            sections = self.split_sections(content)
            chapter = {"id": f"{self.course_id}-ch{i+1}", "title": title}

            if sections:
                chapter["sections"] = sections
            else:
                chapter["content"] = content

            chapter["quiz"] = self.generate_quiz(content)
            self.chapters.append(chapter)

    def split_sections(self, content: str) -> list:
        """Identify sub-sections (###) within a chapter."""
        pattern = (
            r"^(###\s+.*|\d+\.\d+\s+[a-zA-Z]{3,}.*|"
            r"[A-Z]\.\s+[a-zA-Z]{3,}.*|Section[:\s].*)"
        )
        section_pattern = re.compile(pattern, re.MULTILINE)
        matches = list(section_pattern.finditer(content))

        if not matches or len(matches) < 2:
            return []

        sections = []
        for i in range(len(matches)):
            start = matches[i].start()
            nxt = i + 1
            end = matches[nxt].start() if nxt < len(matches) else len(content)

            title = matches[i].group(0).replace("###", "").strip()
            sec_content = content[start:end].strip()

            sections.append(
                {
                    "id": f"sec-{i+1}",
                    "title": title,
                    "content": sec_content,
                }
            )
        return sections

    def generate_quiz(self, content: str) -> Dict:
        """Produces a 5-question knowledge check."""
        return {
            "quizTitle": "Knowledge Check",
            "quizSynopsis": "Validate your understanding of this chapter.",
            "nrOfQuestions": "5",
            "timerInMinutes": 5,
            "questions": [
                {
                    "question": "What is the primary focus of this section?",
                    "questionType": "text",
                    "answerSelectionType": "single",
                    "answers": [
                        "Data Collection",
                        "Strategic Planning",
                        "Income Analysis",
                        "Other",
                    ],
                    "correctAnswer": "3",
                    "messageForCorrectAnswer": "Correct!",
                    "messageForIncorrectAnswer": "Incorrect.",
                    "explanation": "This focuses on analyzing income drivers.",
                    "point": "20",
                },
            ],
        }

    def save_course(self):
        """Save the transformed course to JSON."""
        output_data = {
            "courseId": self.course_id,
            "title": self.course_id.replace("-", " ").title(),
            "chapters": self.chapters,
        }
        output_path = os.path.join(COURSE_DIR, f"{self.course_id}.json")
        os.makedirs(COURSE_DIR, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(output_data, f, indent=4)
        print(f"Successfully transformed: {output_path}")


def main():
    if not os.path.exists(RAW_DIR):
        print(f"Raw directory {RAW_DIR} not found.")
        return
    files = [f for f in os.listdir(RAW_DIR) if f.endswith(".pdf")]
    for file in files:
        transformer = PDFToCourseTransformer(os.path.join(RAW_DIR, file))
        transformer.extract_text()
        transformer.split_chapters()
        transformer.save_course()


if __name__ == "__main__":
    main()
