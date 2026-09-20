import re
import io
import pdfplumber
from typing import List, Dict, Any, Optional, Tuple

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Normalize multiple whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove excessive blank lines
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    return text.strip()

def normalize_match_str(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    # Normalize accents
    for a, b in [('á', 'a'), ('à', 'a'), ('ã', 'a'), ('â', 'a'),
                 ('é', 'e'), ('ê', 'e'),
                 ('í', 'i'),
                 ('ó', 'o'), ('õ', 'o'), ('ô', 'o'),
                 ('ú', 'u'),
                 ('ç', 'c')]:
        s = s.replace(a, b)
    # Remove punctuation
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

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
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial|www\.pciconcursos|terra\s+prova|petro|transp).*$'
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

def extract_textual_references_from_pdf(pdf: pdfplumber.PDF) -> List[Dict[str, Any]]:
    """
    Identifies reading passages / text references in the PDF (e.g. Portuguese / English texts).
    Does NOT assign them to questions, according to business rules.
    """
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial|www\.pciconcursos|terra\s+prova|petro|transp).*$'
    )
    q_pattern_explicit = re.compile(r'^(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$', re.IGNORECASE)
    q_pattern_numbered = re.compile(r'^([0-9]{1,3})[\.\-\)]\s+(.*)$')
    q_pattern_standalone = re.compile(r'^([0-9]{1,3})$')

    all_streams: List[str] = []
    for p in pdf.pages:
        text = p.extract_text() or ""
        if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', text):
            continue
        width, height = p.width, p.height
        midpoint = width / 2
        words = p.extract_words()
        left_words = [w for w in words if w['x1'] <= midpoint + 20]
        right_words = [w for w in words if w['x0'] >= midpoint - 20]
        if len(left_words) > 15 and len(right_words) > 15:
            try:
                left_crop = p.crop((0, 0, midpoint, height))
                right_crop = p.crop((midpoint, 0, width, height))
                all_streams.append(left_crop.extract_text() or "")
                all_streams.append(right_crop.extract_text() or "")
                continue
            except Exception:
                pass
        all_streams.append(text)

    raw_blocks: List[List[str]] = []
    current_block: List[str] = []
    in_question = False

    for stream in all_streams:
        for line in stream.splitlines():
            line_s = line.strip()
            if not line_s or noise_pattern.match(line_s):
                continue
            is_q = bool(
                q_pattern_explicit.match(line_s) or 
                q_pattern_numbered.match(line_s) or 
                (q_pattern_standalone.match(line_s) and 1 <= int(q_pattern_standalone.match(line_s).group(1)) <= 200)
            )
            if is_q:
                in_question = True
                if len(current_block) >= 6:
                    raw_blocks.append(current_block)
                current_block = []
            else:
                if not in_question:
                    current_block.append(line_s)
                else:
                    # Check if a new language / reading passage section starts
                    if re.match(r'^(?:L[ÍI]NGUA\s+INGLESA|L[ÍI]NGUA\s+PORTUGUESA|TEXTO\s+[I|V|X|\d]+)\b', line_s, re.I):
                        in_question = False
                        current_block = [line_s]

    if len(current_block) >= 6:
        raw_blocks.append(current_block)

    references: List[Dict[str, Any]] = []
    for idx, block in enumerate(raw_blocks):
        # Determine Title, Author/Source, and Body Content
        title = ""
        author = ""
        source = ""
        body_lines: List[str] = []

        # Check section header in first lines (e.g. LÍNGUA PORTUGUESA / CONHECIMENTOS BÁSICOS)
        start_idx = 0
        section_prefix = ""
        while start_idx < min(4, len(block)):
            candidate = block[start_idx]
            if re.match(r'^(?:CONHECIMENTOS\s+B[ÁA]SICOS|CONHECIMENTOS\s+ESPEC[ÍI]FICOS)\b', candidate, re.I):
                start_idx += 1
            elif re.match(r'^(?:L[ÍI]NGUA\s+PORTUGUESA|L[ÍI]NGUA\s+INGLESA|TEXTO\s+[I|V|X|\d]+)\b', candidate, re.I):
                section_prefix = candidate
                start_idx += 1
            else:
                break

        # Next line(s) usually form the title if it doesn't start with paragraph numbering
        title_lines = []
        while start_idx < min(6, len(block)):
            cand = block[start_idx]
            if re.match(r'^\d+\s+[A-ZÀ-Ú]', cand) or len(cand) > 70:
                break
            title_lines.append(cand)
            start_idx += 1

        if title_lines:
            raw_title = " ".join(title_lines).strip()
            title = f"{section_prefix} - {raw_title}" if section_prefix and raw_title else (raw_title or section_prefix)
        else:
            title = section_prefix if section_prefix else f"Texto {idx + 1}"

        # Check the end lines for bibliographic citations (Author / Source)
        end_idx = len(block)
        citation_lines = []
        while end_idx > start_idx and len(citation_lines) < 4:
            cand = block[end_idx - 1]
            if re.search(r'(?i)(?:dispon[íi]vel\s+em|available\s+at|retrieved\s+on|fragmento\s+adaptado|adaptad[oa]|rio\s+de\s+janeiro|s[ãa]o\s+paulo|ed\.|p\.\d+|\.com|\.org)', cand) or re.match(r'^[A-ZÀ-Ú\s,]{4,}\.', cand):
                citation_lines.insert(0, cand)
                end_idx -= 1
            else:
                break

        if citation_lines:
            full_citation = " ".join(citation_lines).strip()
            # If citation has Author. Work, try splitting
            m_auth = re.match(r'^([A-ZÀ-Ú\s,]{4,}\.)\s*(.*)$', full_citation)
            if m_auth:
                author = m_auth.group(1).strip()
                source = m_auth.group(2).strip()
            else:
                source = full_citation

        # The rest is the content
        body_lines = block[start_idx:end_idx]
        content = "\n".join(body_lines)

        references.append({
            "id": f"ref_{idx + 1}",
            "title": clean_text(title),
            "content": clean_text(content),
            "author": clean_text(author) or None,
            "source": clean_text(source) or None,
        })

    return references

def parse_exam_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Parses an exam PDF and extracts questions, enunciados, alternatives,
    and identifies textual references (passages).
    """
    all_questions: List[Dict[str, Any]] = []
    textual_references: List[Dict[str, Any]] = []
    detected_title: Optional[str] = None

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        # Detect exam title from first pages
        for p in pdf.pages[:3]:
            text = p.extract_text() or ""
            m_title = re.search(r'(?i)(PROVA\s*\d+\s*[-–]\s*[^\n]+)', text)
            if m_title:
                detected_title = clean_text(m_title.group(1))
                break
            m_cargo = re.search(r'(?i)(AN[ÁA]LISE\s+DE\s+SISTEMAS\s*[-–]\s*[^\n]+)', text)
            if m_cargo:
                detected_title = clean_text(m_cargo.group(1))
                break

        # Extract textual references
        textual_references = extract_textual_references_from_pdf(pdf)

        # Extract questions
        for p in pdf.pages:
            p_text = p.extract_text() or ""
            if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', p_text):
                continue

            width, height = p.width, p.height
            words = p.extract_words()
            if not words:
                continue

            midpoint = width / 2
            left_words = [w for w in words if w['x1'] <= midpoint + 20]
            right_words = [w for w in words if w['x0'] >= midpoint - 20]

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

    return {
        "questions": all_questions,
        "textualReferences": textual_references,
        "detectedTitle": detected_title
    }

def parse_answer_key_pdf(pdf_bytes: bytes, prova_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses an answer key PDF (gabarito) and maps question identifiers to correct alternatives.
    Identifies all available provas in the gabarito and supports flexible filtering by prova_name.
    """
    answers_map: Dict[str, str] = {}
    available_provas: List[Dict[str, str]] = []
    seen_provas: set = set()

    prova_norm = normalize_match_str(prova_name) if prova_name else None

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        # First pass: identify all available provas and their columns
        prova_col_specs: List[Dict[str, Any]] = []

        for p_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables() or []
            for t_idx, table in enumerate(tables):
                if not table or len(table) < 3:
                    continue

                # Check if this table has PROVA X headers
                prova_cells = [
                    (r_idx, c_idx, str(c).strip())
                    for r_idx in range(min(5, len(table)))
                    for c_idx, c in enumerate(table[r_idx])
                    if c and re.search(r'PROVA\s*\d+', str(c), re.I)
                ]

                if not prova_cells:
                    continue

                # Group by column index to assemble full multi-line header
                headers_by_col: Dict[int, str] = {}
                for r, c, val in prova_cells:
                    parts = [val]
                    for next_r in range(r + 1, min(6, len(table))):
                        cell_val = table[next_r][c]
                        if cell_val and not re.search(r'^\d+\s*[\-\:]', str(cell_val)):
                            parts.append(str(cell_val).strip())
                    full_name = " ".join(parts).replace("\n", " ")
                    full_name = re.sub(r'\s+', ' ', full_name).strip()
                    headers_by_col[c] = full_name

                sorted_cols = sorted(headers_by_col.keys())
                for i, col_idx in enumerate(sorted_cols):
                    col_name = headers_by_col[col_idx]
                    col_start = 0 if i == 0 else col_idx
                    col_end = sorted_cols[i + 1] if i + 1 < len(sorted_cols) else len(table[0])

                    m_code = re.search(r'(PROVA\s*\d+)', col_name, re.I)
                    code = m_code.group(1).upper() if m_code else col_name

                    if code not in seen_provas:
                        seen_provas.add(code)
                        available_provas.append({
                            "id": code,
                            "name": col_name
                        })

                    prova_col_specs.append({
                        "p_idx": p_idx,
                        "t_idx": t_idx,
                        "id": code,
                        "name": col_name,
                        "col_start": col_start,
                        "col_end": col_end,
                        "table": table
                    })

        # Determine target prova
        stopwords = {'prova', 'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com'}
        target_spec: Optional[Dict[str, Any]] = None
        if prova_norm:
            m_code = re.search(r'prova\s*(\d+)', prova_norm)
            if m_code:
                code_str = f"PROVA {m_code.group(1)}"
                for spec in prova_col_specs:
                    if spec["id"].upper() == code_str:
                        target_spec = spec
                        break

            if not target_spec:
                words = [w for w in prova_norm.split() if len(w) >= 3 and w not in stopwords]
                best_spec = None
                best_score = 0
                for spec in prova_col_specs:
                    s_norm = normalize_match_str(spec["name"])
                    score = sum(1 for w in words if w in s_norm)
                    if score > best_score:
                        best_score = score
                        best_spec = spec
                if best_score > 0:
                    target_spec = best_spec

        # If no target matched yet and only 1 prova exists in the doc, select it
        if not target_spec and len(available_provas) == 1:
            target_spec = prova_col_specs[0]

        # Extract answers from standard text (e.g. Page 1 Conhecimentos Básicos 1-20)
        for page in pdf.pages:
            tables = page.extract_tables() or []
            has_multi_prova = any(
                re.search(r'PROVA\s*\d+', str(c), re.I)
                for t in tables if t and len(t) >= 3
                for r in t[:3] for c in r if c
            )
            if has_multi_prova:
                continue

            p_text = page.extract_text() or ""
            matches = re.findall(r'(?:^|\s)([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', p_text)
            for q_id, ans in matches:
                q_num = str(int(q_id))
                if q_num not in answers_map:
                    answers_map[q_num] = ans.upper()

        # If a target prova was matched/selected, extract its specific columns (e.g. 21 to 70)
        selected_prova_name: Optional[str] = None
        if target_spec:
            selected_prova_name = target_spec["name"]
            table = target_spec["table"]
            col_start = target_spec["col_start"]
            col_end = target_spec["col_end"]

            for row in table[3:]:
                sub_cells = [str(c).strip() for c in row[col_start:col_end] if c]
                sub_text = " ".join(sub_cells)
                matches = re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', sub_text)
                for q_id, ans in matches:
                    answers_map[str(int(q_id))] = ans.upper()

    result_answers = [{"identifier": q_id, "correctAlternative": ans} for q_id, ans in answers_map.items()]
    result_answers.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)

    return {
        "answers": result_answers,
        "availableProvas": available_provas,
        "selectedProva": selected_prova_name
    }
