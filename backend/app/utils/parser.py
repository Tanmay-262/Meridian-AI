import os
from pypdf import PdfReader
import docx


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text page-by-page from a PDF file.
    """
    reader = PdfReader(file_path)
    text_content = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_content.append(page_text)

    return "\n\n".join(text_content)


def extract_text_from_docx(file_path: str) -> str:
    """
    Extracts text paragraph-by-paragraph from a DOCX file.
    """
    doc = docx.Document(file_path)
    text_content = []

    for para in doc.paragraphs:
        if para.text.strip():
            text_content.append(para.text)

    # Also extract text from tables inside the docx
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                text_content.append(" | ".join(row_text))

    return "\n".join(text_content)


def extract_text_from_file(file_path: str) -> str:
    """
    Parses a file based on its extension and returns the extracted raw text.
    Throws ValueError for unsupported formats.
    """
    _, ext = os.path.splitext(file_path.lower())

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
