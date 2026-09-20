import re
import io
import pdfplumber
from typing import List, Dict, Any, Optional

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize multiple whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove excessive blank lines
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    return text.strip()

def extract_text_from_page(page: pdfplumber.page.Page) -> str:
    """
    Extracts text from a page, handling 2-column layouts if present.
    """
    width = page.width
    height = page.height

    # Check if there is a 2-column layout by examining word distribution
    words = page.extract_words()
    if not words:
        return page.extract_text() or ""

    midpoint = width / 2
    left_words = [w for w in words if w['x1'] <= midpoint + 20]
    right_words = [w for w in words if w['x0'] >= midpoint - 20]

    # If both sides have significant amount of words, process column-wise
    if len(left_words) > 20 and len(right_words) > 20:
        left_box = (0, 0, midpoint + 10, height)
        right_box = (midpoint - 10, 0, width, height)
        try:
            left_crop = page.crop(left_box)
            right_crop = page.crop(right_box)
            left_text = left_crop.extract_text() or ""
            right_text = right_crop.extract_text() or ""
            return left_text + "\n" + right_text
        except Exception:
            pass

    return page.extract_text() or ""

def parse_exam_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Parses an exam PDF and extracts questions, enunciados and alternatives.
    """
    all_text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = extract_text_from_page(page)
            if page_text:
                all_text += "\n" + page_text

    if not all_text.strip():
        return []

    lines = all_text.splitlines()

    # Regex patterns for question headers
    # e.g.: "QUESTÃO 01", "Questão 1", "ITEM 01", "1.", "01 -", "01)"
    q_pattern_explicit = re.compile(
        r'^(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$',
        re.IGNORECASE
    )
    q_pattern_numbered = re.compile(
        r'^([0-9]{1,3})[\.\-\)]\s+(.*)$'
    )

    # Alternative pattern: e.g. "A)", "(A)", "A.", "a)", "[A]"
    alt_pattern = re.compile(
        r'^[(\[]?([A-Ea-e])[)\]\.\-]\s*(.*)$'
    )

    # Noise header/footer filter
    noise_pattern = re.compile(
        r'(?i)^(?:p[áa]gina\s+\d+|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial).*$'
    )

    raw_questions: List[Dict[str, Any]] = []
    current_q: Optional[Dict[str, Any]] = None
    current_alt: Optional[Dict[str, str]] = None
    state = "NONE"  # "ENUNCIADO" or "ALTERNATIVE"

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        if noise_pattern.match(line):
            continue

        # Check if line starts a new question
        match_q = q_pattern_explicit.match(line)
        if not match_q:
            match_q = q_pattern_numbered.match(line)

        if match_q:
            # Save previous question
            if current_q:
                if current_alt:
                    current_q["alternatives"].append(current_alt)
                    current_alt = None
                raw_questions.append(current_q)

            q_id = str(int(match_q.group(1)))  # Normalize '01' to '1'
            remaining_enunciado = match_q.group(2).strip()

            current_q = {
                "identifier": q_id,
                "enunciado": remaining_enunciado,
                "alternatives": []
            }
            state = "ENUNCIADO"
            current_alt = None
            continue

        if current_q is None:
            continue

        # Check if line is an alternative (A, B, C, D, E)
        match_alt = alt_pattern.match(line)
        if match_alt:
            letter = match_alt.group(1).upper()
            alt_text = match_alt.group(2).strip()

            if current_alt:
                current_q["alternatives"].append(current_alt)

            current_alt = {
                "identifier": letter,
                "text": alt_text
            }
            state = "ALTERNATIVE"
            continue

        # Check for inline alternatives on the same line (e.g. "(A) 10 (B) 20 (C) 30 (D) 40 (E) 50")
        inline_alts = re.findall(r'^[(\[]?([A-Ea-e])[)\]\.\-]\s*([^(\[]+)', line)
        if len(inline_alts) >= 2:
            if current_alt:
                current_q["alternatives"].append(current_alt)
                current_alt = None
            for item in inline_alts:
                current_q["alternatives"].append({
                    "identifier": item[0].upper(),
                    "text": item[1].strip()
                })
            state = "ALTERNATIVE"
            continue

        # Append to current context
        if state == "ENUNCIADO":
            if current_q["enunciado"]:
                current_q["enunciado"] += "\n" + line
            else:
                current_q["enunciado"] = line
        elif state == "ALTERNATIVE" and current_alt:
            if current_alt["text"]:
                current_alt["text"] += " " + line
            else:
                current_alt["text"] = line

    # Save last question
    if current_q:
        if current_alt:
            current_q["alternatives"].append(current_alt)
        raw_questions.append(current_q)

    # Post-process questions: clean texts and ensure valid alternatives
    cleaned_questions = []
    for q in raw_questions:
        q["enunciado"] = clean_text(q["enunciado"])
        cleaned_alts = []
        for alt in q.get("alternatives", []):
            alt["text"] = clean_text(alt["text"])
            cleaned_alts.append(alt)
        q["alternatives"] = cleaned_alts
        cleaned_questions.append(q)

    return cleaned_questions

def parse_answer_key_pdf(pdf_bytes: bytes) -> List[Dict[str, str]]:
    """
    Parses an answer key PDF (gabarito) and maps question identifiers to correct alternatives.
    """
    answers_map: Dict[str, str] = {}

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            # 1. Try table extraction
            try:
                tables = page.extract_tables() or []
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    # Check each cell in table
                    for row in table:
                        if not row:
                            continue
                        clean_row = [str(c).strip() if c is not None else "" for c in row]
                        # Look for pair of (number, letter)
                        # Could be in columns: [1, A, 2, B, 3, C] or [Questão, Gabarito]
                        for i in range(len(clean_row) - 1):
                            cell_q = clean_row[i]
                            cell_ans = clean_row[i+1]
                            # Check if cell_q is number and cell_ans is A-E
                            if re.match(r'^[0-9]{1,3}$', cell_q) and re.match(r'^[A-Ea-e]$', cell_ans):
                                q_id = str(int(cell_q))
                                answers_map[q_id] = cell_ans.upper()
            except Exception:
                pass

            # 2. Text regex extraction as fallback/supplement
            text = page.extract_text() or ""
            # Matches "1 - A", "01. B", "Questão 1: C", "1 A", "1=A"
            matches = re.findall(
                r'(?i)(?:QUEST[ÃA]O|ITEM)?\s*([0-9]{1,3})\s*[\s\-\:\.\=]+\s*([A-Ea-e])\b',
                text
            )
            for m in matches:
                q_id = str(int(m[0]))
                ans = m[1].upper()
                if q_id not in answers_map:
                    answers_map[q_id] = ans

    # Convert to list sorted by integer identifier
    result = []
    for q_id, ans in answers_map.items():
        result.append({
            "identifier": q_id,
            "correctAlternative": ans
        })

    result.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else x["identifier"])
    return result
