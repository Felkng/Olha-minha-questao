import re
import io
import pdfplumber
from typing import List, Dict, Any, Optional, Tuple

def sanitize_text_noise(text: str) -> str:
    if not text:
        return ""
    # Remove reversed/spaced watermarks like O H N U C S A R, R A S C U N H O
    text = re.sub(r'(?i)\bO\s*H\s*N\s*U\s*C\s*S\s*A\s*R\b', '', text)
    text = re.sub(r'(?i)\bR\s*A\s*S\s*C\s*U\s*N\s*H\s*O\b', '', text)
    text = re.sub(r'(?i)\bG\s*A\s*B\s*A\s*R\s*I\s*T\s*O\b', '', text)
    text = re.sub(r'(?i)\bD\s*E\s*S\s*T\s*A\s*Q\s*U\s*E\b', '', text)
    text = re.sub(r'(?i)\bF\s*O\s*L\s*H\s*A\s+D\s*E\s+R\s*E\s*S\s*P\s*O\s*S\s*T\s*A\s*S?\b', '', text)
    text = re.sub(r'(?i)\bP[ÁA]GINA\s+\d+\s+DE\s+\d+\b', '', text)
    text = re.sub(r'(?i)pcimarkpci[a-z0-9_]*', '', text)
    # Clean up whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = sanitize_text_noise(text)
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

    # Sanitize noise from enunciados and alternatives
    for q in raw_questions:
        q["enunciado"] = sanitize_text_noise(q.get("enunciado", ""))
        for alt in q.get("alternatives", []):
            alt["text"] = sanitize_text_noise(alt.get("text", ""))

    return raw_questions

def format_body_paragraphs(body_lines: List[str]) -> str:
    """
    Groups and formats narrative / reference lines into clean, distinct paragraphs.
    Correctly merges multi-line sentences, handles line-break hyphenation (e.g. 'repen-' + 'te' -> 'repente'),
    and separates distinct paragraphs with double newlines.
    """
    paragraphs: List[List[str]] = []
    current_lines: List[str] = []
    
    # Pattern indicating start of a new numbered paragraph e.g. '1 ', '2 ', '10 ', 'I ', '§ '
    new_p_pattern = re.compile(r'^(?:[0-9]{1,3}\s+[A-ZÀ-Úa-zà-ú]|§\s*\d+|[IVXLCDM]+\s*[\.\-–\s]+[A-ZÀ-Ú])')
    
    for line in body_lines:
        line = line.strip()
        if not line:
            if current_lines:
                paragraphs.append(current_lines)
                current_lines = []
            continue
            
        if new_p_pattern.match(line):
            if current_lines:
                paragraphs.append(current_lines)
            current_lines = [line]
        else:
            if not current_lines:
                current_lines = [line]
            else:
                prev_line = current_lines[-1]
                if prev_line.endswith('-') and not prev_line.endswith(' -'):
                    current_lines[-1] = prev_line[:-1] + line
                elif prev_line.endswith('–') or prev_line.endswith('—'):
                    current_lines[-1] = prev_line + ' ' + line
                else:
                    current_lines[-1] = prev_line + ' ' + line
                    
    if current_lines:
        paragraphs.append(current_lines)
        
    formatted = []
    for p in paragraphs:
        p_text = ' '.join(p)
        p_text = re.sub(r'[ \t]+', ' ', p_text).strip()
        if p_text:
            formatted.append(p_text)
            
    return '\n\n'.join(formatted)

def extract_textual_references_from_pdf(pdf: pdfplumber.PDF) -> List[Dict[str, Any]]:
    """
    Identifies reading passages / text references in the PDF (e.g. Portuguese / English texts).
    Accurately handles multi-column and multi-page texts, correctly reconstructing complete paragraphs
    and extracting title, subtitle, author, and citation sources.
    """
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest.*|confidencial|www\.pciconcursos.*|terra\s+prova|petro|transp|terra|prova\s*\d+\s*[-–].*)$'
    )
    passage_header_pattern = re.compile(
        r'^(?:L[ÍI]NGUA\s+INGLESA|L[ÍI]NGUA\s+PORTUGUESA|L[ÍI]NGUA\s+ESPANHOLA|TEXTO\s+[I|V|X|\d]+|TEXTO\s+PARA\s+AS\s+QUEST[ÕO]ES|LEIA\s+O\s+TEXTO|TEXTO\s+\d+|INGL[ÊE]S|PORTUGU[ÊE]S|REDA[ÇC][ÃA]O|CONHECIMENTOS\s+B[ÁA]SICOS|CONHECIMENTOS\s+ESPEC[ÍI]FICOS)\b',
        re.I
    )
    q_explicit_pattern = re.compile(r'^(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$', re.IGNORECASE)
    alt_pattern = re.compile(r'^[(\[]?([A-Ea-e])[)\]\.\-]\s*(.*)$')

    # Step 1: Collect sequential line streams across all pages and columns
    flat_lines: List[str] = []
    for p in pdf.pages:
        text = p.extract_text() or ""
        if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', text):
            continue
        width = getattr(p, 'width', 0)
        height = getattr(p, 'height', 0)
        
        col_texts = []
        if isinstance(width, (int, float)) and isinstance(height, (int, float)) and width > 0 and height > 0:
            midpoint = width / 2
            top_m = 35
            bot_m = height - 40
            words = p.extract_words() if hasattr(p, 'extract_words') else []
            left_words = [w for w in words if w['x1'] <= midpoint + 20 and top_m <= w['top'] <= bot_m]
            right_words = [w for w in words if w['x0'] >= midpoint - 20 and top_m <= w['top'] <= bot_m]

            if len(left_words) > 15 and len(right_words) > 15:
                try:
                    l_crop = p.crop((0, top_m, midpoint, bot_m))
                    r_crop = p.crop((midpoint, top_m, width, bot_m))
                    col_texts = [l_crop.extract_text() or "", r_crop.extract_text() or ""]
                except Exception:
                    col_texts = [p.crop((0, top_m, width, bot_m)).extract_text() or ""]
            else:
                try:
                    col_texts = [p.crop((0, top_m, width, bot_m)).extract_text() or ""]
                except Exception:
                    col_texts = [text]
        else:
            col_texts = [text]

        for col_t in col_texts:
            lines = [sanitize_text_noise(l) for l in col_t.splitlines()]
            valid_lines = [l for l in lines if l and not noise_pattern.match(l)]
            # If the very last line of the column is just the page number (e.g. '2', '4'), filter it out
            if valid_lines and re.match(r'^\d{1,3}$', valid_lines[-1]):
                valid_lines.pop()
            flat_lines.extend(valid_lines)

    # Step 2: Separate passages and questions
    raw_passages: List[List[str]] = []
    current_passage: List[str] = []
    in_passage = False

    for i, line in enumerate(flat_lines):
        is_passage_start = bool(passage_header_pattern.match(line))
        is_q_explicit = bool(q_explicit_pattern.match(line))
        is_q_numbered = False
        m_num = re.match(r'^([0-9]{1,3})[\.\-\)]?\s*(.*)$', line)
        if m_num and not is_passage_start:
            num_val = int(m_num.group(1))
            if 1 <= num_val <= 200:
                has_alts = any(alt_pattern.match(flat_lines[j]) for j in range(i + 1, min(i + 10, len(flat_lines))))
                if has_alts:
                    is_q_numbered = True

        is_question = is_q_explicit or is_q_numbered

        if is_passage_start:
            if current_passage and len(current_passage) >= 5:
                raw_passages.append(current_passage)
            current_passage = [line]
            in_passage = True
            continue

        if is_question:
            if in_passage:
                if len(current_passage) >= 5:
                    raw_passages.append(current_passage)
                current_passage = []
                in_passage = False
            continue

        if in_passage:
            current_passage.append(line)

    if current_passage and len(current_passage) >= 5:
        raw_passages.append(current_passage)

    # Step 3: Parse metadata and structured body from each passage
    references: List[Dict[str, Any]] = []
    for idx, block in enumerate(raw_passages):
        start_idx = 0
        section_prefix = ""
        while start_idx < min(4, len(block)):
            cand = block[start_idx]
            if re.match(r'^(?:CONHECIMENTOS\s+B[ÁA]SICOS|CONHECIMENTOS\s+ESPEC[ÍI]FICOS)\b', cand, re.I):
                start_idx += 1
            elif re.match(r'^(?:L[ÍI]NGUA\s+PORTUGUESA|L[ÍI]NGUA\s+INGLESA|L[ÍI]NGUA\s+ESPANHOLA|TEXTO\s+[I|V|X|\d]+)\b', cand, re.I):
                section_prefix = cand
                start_idx += 1
            else:
                break

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

        subtitle = ""
        if start_idx < len(block):
            cand = block[start_idx]
            if (not re.match(r'^\d+\s+[A-ZÀ-Ú]', cand) 
                    and len(cand) < 60 
                    and not cand.endswith('.') 
                    and not re.match(r'^(?:par[áa]grafo|texto|cap[íi]tulo|o\s+|a\s+|os\s+|as\s+|um\s+|uma\s+)\b', cand, re.I)):
                subtitle = cand
                start_idx += 1

        end_idx = len(block)
        citation_lines = []
        while end_idx > start_idx and len(citation_lines) < 4:
            cand = block[end_idx - 1]
            if (re.search(r'(?i)(?:dispon[íi]vel\s+em|available\s+at|retrieved\s+on|fragmento\s+adaptado|adaptad[oa]|rio\s+de\s+janeiro|s[ãa]o\s+paulo|ed\.|p\.\s*\d+|\.com|\.org|https?://)', cand) 
                    or re.match(r'^[A-ZÀ-Ú]{2,}(?:,\s+[A-ZÀ-Úa-zà-ú\s\.]+)\.', cand)
                    or re.match(r'^[A-ZÀ-Ú\s,]{4,}\.', cand)):
                citation_lines.insert(0, cand)
                end_idx -= 1
            else:
                break

        author = ""
        source = ""
        reference = ""
        if citation_lines:
            full_citation = " ".join(citation_lines).strip()
            full_citation = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', full_citation)
            url_match = re.search(r'(https?://[^\s<>"]+|www\.[^\s<>"]+)', full_citation)
            if url_match:
                reference = url_match.group(1).rstrip('.,;')
            else:
                m_disp = re.search(r'(?i)dispon[íi]vel\s+em[:\s]+<?([^\s>]+)>?', full_citation)
                if m_disp:
                    reference = m_disp.group(1).rstrip('.,;')
                else:
                    reference = full_citation

            m_auth = re.match(r'^([A-ZÀ-Ú]{2,}(?:,\s+[A-ZÀ-Úa-zà-ú\s\.]+))\.\s*(.*)$', full_citation)
            if not m_auth:
                m_auth = re.match(r'^([A-ZÀ-Ú\s,]{4,}\.)\s*(.*)$', full_citation)

            if m_auth:
                author = m_auth.group(1).strip()
                source = m_auth.group(2).strip()
            else:
                source = full_citation

        body_lines = block[start_idx:end_idx]
        caption = ""
        filtered_body: List[str] = []
        for bline in body_lines:
            m_cap = re.match(r'(?i)^(?:legenda|figura\s*\d*|tabela\s*\d*|quadro\s*\d*)[:\.\-\s]+(.+)$', bline)
            if m_cap:
                caption = bline.strip()
            else:
                filtered_body.append(bline)

        formatted_content = format_body_paragraphs(filtered_body)

        references.append({
            "id": f"ref_{idx + 1}",
            "title": clean_text(title) or None,
            "subtitle": clean_text(subtitle) or None,
            "content": formatted_content or None,
            "author": clean_text(author) or None,
            "reference": clean_text(reference) or None,
            "caption": clean_text(caption) or None,
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

            width, height = getattr(p, 'width', 0), getattr(p, 'height', 0)
            words = p.extract_words() if hasattr(p, 'extract_words') else []
            if words and width > 0:
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
