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

def parse_column_text(text: str) -> List[Dict[str, Any]]:
    """
    Parses a single text stream (or column) into questions and alternatives.
    """
    lines = text.splitlines()

    q_pattern_explicit = re.compile(
        r'^(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$',
        re.IGNORECASE
    )
    q_pattern_numbered = re.compile(
        r'^([0-9]{1,3})[\.\-\)]\s+(.*)$'
    )
    q_pattern_standalone = re.compile(
        r'^([0-9]{1,3})$'
    )
    alt_pattern = re.compile(
        r'^[(\[]?([A-Ea-e])[)\]\.\-]\s*(.*)$'
    )
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial|www\.pciconcursos).*$'
    )

    raw_questions: List[Dict[str, Any]] = []
    current_q: Optional[Dict[str, Any]] = None
    current_alt: Optional[Dict[str, str]] = None
    state = "NONE"

    for line in lines:
        line = line.strip()
        if not line or noise_pattern.match(line):
            continue

        match_q = q_pattern_explicit.match(line) or q_pattern_numbered.match(line)
        standalone = False
        if not match_q:
            match_stand = q_pattern_standalone.match(line)
            if match_stand:
                num = int(match_stand.group(1))
                if 1 <= num <= 200:
                    match_q = match_stand
                    standalone = True

        if match_q:
            if current_q:
                if current_alt:
                    current_q["alternatives"].append(current_alt)
                    current_alt = None
                if len(current_q["alternatives"]) >= 2:
                    raw_questions.append(current_q)

            q_id = str(int(match_q.group(1)))
            enunc = "" if standalone else match_q.group(2).strip()
            current_q = {
                "identifier": q_id,
                "enunciado": enunc,
                "alternatives": []
            }
            state = "ENUNCIADO"
            current_alt = None
            continue

        if not current_q:
            continue

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

        if state == "ENUNCIADO":
            if current_q["enunciado"]:
                if current_q["enunciado"].endswith('-'):
                    current_q["enunciado"] = current_q["enunciado"][:-1] + line
                else:
                    current_q["enunciado"] += " " + line
            else:
                current_q["enunciado"] = line
        elif state == "ALTERNATIVE" and current_alt:
            if current_alt["text"]:
                if current_alt["text"].endswith('-'):
                    current_alt["text"] = current_alt["text"][:-1] + line
                else:
                    current_alt["text"] += " " + line
            else:
                current_alt["text"] = line

    if current_q:
        if current_alt:
            current_q["alternatives"].append(current_alt)
        if len(current_q["alternatives"]) >= 2:
            raw_questions.append(current_q)

    return raw_questions

def parse_exam_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Parses an exam PDF and extracts questions, enunciados and alternatives.
    Handles cover instruction pages, 2-column layouts, and standalone numbering.
    """
    all_questions: List[Dict[str, Any]] = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for p in pdf.pages:
            p_text = p.extract_text() or ""
            # Skip cover instruction pages
            if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', p_text):
                continue

            width, height = p.width, p.height
            words = p.extract_words()
            if not words:
                continue

            midpoint = width / 2
            left_words = [w for w in words if w['x1'] <= midpoint + 20]
            right_words = [w for w in words if w['x0'] >= midpoint - 20]

            # Detect 2-column layout
            if len(left_words) > 15 and len(right_words) > 15:
                try:
                    left_crop = p.crop((0, 0, midpoint, height))
                    right_crop = p.crop((midpoint, 0, width, height))
                    all_questions.extend(parse_column_text(left_crop.extract_text() or ""))
                    all_questions.extend(parse_column_text(right_crop.extract_text() or ""))
                    continue
                except Exception:
                    pass

            all_questions.extend(parse_column_text(p_text))

    # Sort questions by integer identifier
    all_questions.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)

    # Clean text content
    for q in all_questions:
        q["enunciado"] = clean_text(q["enunciado"])
        for a in q["alternatives"]:
            a["text"] = clean_text(a["text"])

    return all_questions

def parse_answer_key_pdf(pdf_bytes: bytes, prova_name: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Parses an answer key PDF (gabarito) and maps question identifiers to correct alternatives.
    Supports multi-prova answer keys using prova_name (e.g. 'PROVA 5' or cargo name).
    """
    answers_map: Dict[str, str] = {}
    prova_clean = prova_name.strip().lower() if prova_name else None

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            p_text = page.extract_text() or ""
            tables = page.extract_tables() or []

            is_multi_prova_page = False
            for table in tables:
                if not table or len(table) < 3:
                    continue

                # Check if header contains PROVA X
                has_prova_header = any(
                    re.search(r'PROVA\s*\d+', str(c), re.I)
                    for r in table[:3] for c in r if c
                )

                if has_prova_header:
                    is_multi_prova_page = True
                    target_col_start = None
                    target_col_end = None

                    for r_idx in range(min(5, len(table))):
                        row = table[r_idx]
                        headers = [
                            (c_idx, str(c).strip())
                            for c_idx, c in enumerate(row)
                            if c and re.search(r'PROVA\s*\d+', str(c), re.I)
                        ]
                        for i, (c_idx, text) in enumerate(headers):
                            if prova_clean and prova_clean in text.lower():
                                target_col_start = 0 if i == 0 else headers[i][0]
                                target_col_end = headers[i+1][0] if i + 1 < len(headers) else len(row)
                                break
                        if target_col_start is not None:
                            break

                    if target_col_start is not None:
                        for row in table:
                            sub_cells = [str(c).strip() for c in row[target_col_start:target_col_end] if c]
                            sub_text = " ".join(sub_cells)
                            matches = re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', sub_text)
                            for q_id, ans in matches:
                                answers_map[str(int(q_id))] = ans.upper()

            if is_multi_prova_page:
                continue

            # Standard extraction for general pages (like Conhecimentos Básicos)
            matches = re.findall(r'(?:^|\s)([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', p_text)
            for q_id, ans in matches:
                q_num = str(int(q_id))
                if q_num not in answers_map:
                    answers_map[q_num] = ans.upper()

    result = [{"identifier": q_id, "correctAlternative": ans} for q_id, ans in answers_map.items()]
    result.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)
    return result
