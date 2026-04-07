import os
import json
import pdfplumber
import re
from typing import Dict

# Configuration
RAW_DIR = "assets/academy/raw/"
COURSE_DIR = "assets/academy/courses/"


class PDFToCourseTransformer:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.filename = os.path.basename(file_path).split(".")[0]
        self.raw_text = ""
        self.chapters = []

    def extract_text(self):
        """Extract all text from the PDF."""
        print(f"--- Extracting text from {self.file_path} ---")
        with pdfplumber.open(self.file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    self.raw_text += text + "\n"

    def split_chapters(self):
        """
        Split text into chapters based on common patterns.
        Heuristics:
        - "Chapter X" or "Section X"
        - "Scenario X: Title"
        - Questions used as headings (e.g., "How to...?")
        - Title Case Headings (e.g., "Methodology of...")
        """
        print("--- Splitting into chapters ---")

        # Final optimized pattern for IDC documents
        chapter_pattern = re.compile(
            r"^((?:Chapter|Section|Scenario)\s+\d+[:.]?.*|.*?\?$|^Methodology of.*|^Data Protection.*|^Citation.*|^Contact information.*)",
            re.MULTILINE,
        )

        matches = list(chapter_pattern.finditer(self.raw_text))

        if not matches:
            # Fallback: Treat the whole document as one chapter if no markers found
            print("No chapter markers found. Treating as one chapter.")
            self.chapters.append(
                {
                    "id": f"{self.filename}-ch1",
                    "title": "Module 1",
                    "content": self.raw_text.strip(),
                    "quiz": self.generate_quiz(self.raw_text),
                }
            )
            return

        for i in range(len(matches)):
            start = matches[i].start()
            end = (
                matches[i + 1].start()
                if i + 1 < len(matches)
                else len(self.raw_text)
            )

            title = matches[i].group(0).strip()
            content = self.raw_text[start:end].strip()

            self.chapters.append(
                {
                    "id": f"{self.filename}-ch{i+1}",
                    "title": title,
                    "content": content,
                    "quiz": self.generate_quiz(content),
                }
            )

    def generate_quiz(self, content: str) -> Dict:
        """
        Produces a 5-question knowledge check with a timer.
        """
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
                    "explanation": "This chapter focuses on analyzing income drivers.",
                    "point": "20",
                },
                {
                    "question": "Which indicator is most critical for living income calculation?",
                    "questionType": "text",
                    "answerSelectionType": "single",
                    "answers": [
                        "Household Size",
                        "Market Price",
                        "Yield per Hectare",
                        "All of the above",
                    ],
                    "correctAnswer": "4",
                    "messageForCorrectAnswer": "Exactly!",
                    "messageForIncorrectAnswer": "Consider all variables.",
                    "explanation": "Living income depends on a combination of household expenses and income sources.",
                    "point": "20",
                },
                {
                    "question": "True or False: The IDC tool supports multi-scenario comparison.",
                    "questionType": "text",
                    "answerSelectionType": "single",
                    "answers": ["True", "False"],
                    "correctAnswer": "1",
                    "messageForCorrectAnswer": "Correct!",
                    "messageForIncorrectAnswer": "False.",
                    "explanation": "IDC allows side-by-side comparison of up to 5 scenarios.",
                    "point": "20",
                },
                {
                    "question": "How are living income benchmarks contextualised?",
                    "questionType": "text",
                    "answerSelectionType": "single",
                    "answers": [
                        "Annual global index",
                        "Inflation adjustment",
                        "Local survey data",
                        "None",
                    ],
                    "correctAnswer": "2",
                    "messageForCorrectAnswer": "Correct!",
                    "messageForIncorrectAnswer": "Please review benchmarking.",
                    "explanation": "Benchmarks are adjusted for national inflation and living standards.",
                    "point": "20",
                },
                {
                    "question": "What role does the 'Academy' play in the IDC ecosystem?",
                    "questionType": "text",
                    "answerSelectionType": "single",
                    "answers": [
                        "Data Storage",
                        "User Training",
                        "Market Intelligence",
                        "Reporting",
                    ],
                    "correctAnswer": "2",
                    "messageForCorrectAnswer": "Success!",
                    "messageForIncorrectAnswer": "Not quite.",
                    "explanation": "The Academy provides structured learning for IDC users.",
                    "point": "20",
                },
            ],
        }

    def save_course(self):
        """Save the transformed course to JSON."""
        output_data = {
            "courseId": self.filename,
            "title": self.filename.replace("-", " ").title(),
            "chapters": self.chapters,
        }

        output_path = os.path.join(COURSE_DIR, f"{self.filename}.json")
        os.makedirs(COURSE_DIR, exist_ok=True)

        with open(output_path, "w") as f:
            json.dump(output_data, f, indent=4)

        print(f"Successfully transformed: {output_path}")


def main():
    # Process all PDFs in the raw directory
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
