import re
import io
import pdfplumber
from typing import List, Dict, Any, Optional, Tuple
from ocr import (
    is_scanned_pdf,
    extract_exam_from_scanned_pdf,
    extract_answer_key_from_scanned_pdf,
    normalize_big_o_notation,
    format_enunciado_with_code_blocks
)

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

def is_two_column_page(page: Any, width: float, height: float) -> bool:
    """
    Determines if a page is truly 2-column or single-column layout.
    Checks if there is a vertical gutter down the middle and whether words cross the center.
    """
    if not isinstance(width, (int, float)) or not isinstance(height, (int, float)) or width <= 0 or height <= 0:
        return False
    if not hasattr(page, 'extract_words'):
        return False
    try:
        words = page.extract_words()
    except Exception:
        return False

    if not isinstance(words, list) or len(words) < 25:
        return False

    top_m = 35
    bot_m = height - 40
    midpoint = width / 2
    body_words = [w for w in words if isinstance(w, dict) and 'top' in w and 'x0' in w and 'x1' in w and top_m <= w['top'] <= bot_m]
    if len(body_words) < 25:
        return False

    gutter_center_words = [w for w in body_words if (midpoint - 10) <= (w['x0'] + w['x1'])/2 <= (midpoint + 10)]
    left_col = [w for w in body_words if w['x1'] <= midpoint - 5]
    right_col = [w for w in body_words if w['x0'] >= midpoint + 5]

    gutter_ratio = len(gutter_center_words) / len(body_words)
    return len(left_col) >= 30 and len(right_col) >= 30 and gutter_ratio <= 0.015

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
    alt_inline_pattern = re.compile(
        r'(?:^|\s+)(?:(\()([A-Ea-e])\)|(\[)([A-Ea-e])\]|([A-Ea-e])[\.\-\)])\s*'
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

        # Check inline horizontal alternatives (must form a strict consecutive ascending sequence: A->B->C...)
        raw_matches = list(alt_inline_pattern.finditer(line))
        inline_alts: Optional[List[Dict[str, str]]] = None
        if len(raw_matches) >= 2:
            parsed_letters = [
                (m, (m.group(2) or m.group(4) or m.group(5)).upper())
                for m in raw_matches
            ]
            is_consecutive_seq = True
            for i in range(len(parsed_letters) - 1):
                curr_c = ord(parsed_letters[i][1])
                next_c = ord(parsed_letters[i + 1][1])
                if next_c != curr_c + 1:
                    is_consecutive_seq = False
                    break

            if is_consecutive_seq:
                inline_alts = []
                for idx, (m, letter) in enumerate(parsed_letters):
                    start = m.end()
                    end = parsed_letters[idx + 1][0].start() if idx + 1 < len(parsed_letters) else len(line)
                    inline_alts.append({
                        "identifier": letter,
                        "text": line[start:end].strip()
                    })

        if inline_alts and len(inline_alts) >= 2:
            if current_alt:
                current_q["alternatives"].append(current_alt)
                current_alt = None
            current_q["alternatives"].extend(inline_alts)
            state = "ALTERNATIVE"
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
    and separates distinct paragraphs and subheadings with double newlines.
    """
    paragraphs: List[List[str]] = []
    current_lines: List[str] = []
    
    # Pattern indicating start of a new numbered paragraph e.g. '1 ', '2 ', '10 ', 'I ', '§ '
    new_p_pattern = re.compile(r'^(?:[0-9]{1,3}\s+[A-ZÀ-Úa-zà-ú]|§\s*\d+|[IVXLCDM]+\s*[\.\-–\s]+[A-ZÀ-Ú])')
    heading_pattern = re.compile(
        r'^(?:(?:Responsibility|Section|Part|Capítulo|Seção|Tópico)\s+(?:Number\s+\w+|\d+|[IVXLCDM]+).*|Additional\s+Employee\s+Responsibilities|Concluding\s+Remarks|Considera[çc][õo]es\s+Finais|Introdu[çc][ãa]o|Conclus[ãa]o)$',
        re.I
    )
    
    for line in body_lines:
        line = line.strip()
        if not line:
            if current_lines:
                paragraphs.append(current_lines)
                current_lines = []
            continue
            
        if heading_pattern.match(line):
            if current_lines:
                paragraphs.append(current_lines)
                current_lines = []
            paragraphs.append([line])
        elif new_p_pattern.match(line):
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

def extract_conhecimentos_basicos(text: str) -> Dict[str, str]:
    ans = {}
    m_bas = re.search(r'CONHECIMENTOS\s+B[ÁA]SICOS\b', text, re.I)
    m_esp = re.search(r'CONHECIMENTOS\s+ESPEC[ÍI]FICOS\b', text, re.I)
    if m_bas and m_esp:
        sub = text[m_bas.end():m_esp.start()]
    elif m_bas:
        sub = text[m_bas.end():m_bas.end() + 1000]
    else:
        sub = text

    for q_id, a in re.findall(r'(?:^|\s)([0-9]{1,2})\s+([A-Ea-e])(?=\s|$)', sub):
        q_num = int(q_id)
        if 1 <= q_num <= 20:
            ans[str(q_num)] = a.upper()
    return ans

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
    q_pattern_numbered = re.compile(r'^([0-9]{1,3})[\.\-\)]\s+(.*)$')
    q_pattern_standalone = re.compile(r'^([0-9]{1,3})$')
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
            top_m = 35
            bot_m = height - 40
            if is_two_column_page(p, width, height):
                midpoint = width / 2
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
        m_num = q_pattern_numbered.match(line) or q_pattern_standalone.match(line)
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
        if start_idx < len(block):
            first_cand = block[start_idx]
            if not re.match(r'^\d+\s+[A-ZÀ-Ú]', first_cand) and not re.search(r'(?i)(?:dispon[íi]vel\s+em|available\s+at)', first_cand):
                title_lines.append(first_cand)
                start_idx += 1

                if start_idx < len(block):
                    second_cand = block[start_idx]
                    if (not re.search(r'[\.\!\?]$', first_cand) 
                            and len(second_cand) < 50
                            and not re.match(r'^\d+\s+[A-ZÀ-Ú]', second_cand)
                            and not re.match(r'^(?:O|A|Os|As|Um|Uma|De|Em|No|Na|Como|Quando|Se|Mas|E|Por|Para|Hoje|Today)\b', second_cand)
                            and not re.search(r'[\.\!\?]$', second_cand)):
                        title_lines.append(second_cand)
                        start_idx += 1

        if title_lines:
            raw_title = " ".join(title_lines).strip()
            title = f"{section_prefix} - {raw_title}" if section_prefix and raw_title else (raw_title or section_prefix)
        else:
            title = section_prefix if section_prefix else f"Texto {idx + 1}"

        subtitle = ""

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
            full_citation = re.sub(r'(https?://[^\s<>]+)\s+([a-zA-Z0-9_\-\.\/\?=&]+)', r'\1\2', full_citation)
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
    Automatically falls back to OCR if the PDF is scanned / image-based.
    """
    if is_scanned_pdf(pdf_bytes):
        return extract_exam_from_scanned_pdf(pdf_bytes)

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
            m_cargo = re.search(r'(?i)(AN[ÁA]LIS[ET]\s+DE\s+SISTEMAS[^\n]*(?:\n[^\n]+)?)', text)
            if m_cargo:
                cargo_text = m_cargo.group(1).replace('\n', ' - ')
                detected_title = clean_text(re.sub(r'\s+', ' ', cargo_text))
                break

        # Extract textual references
        textual_references = extract_textual_references_from_pdf(pdf)

        # Extract questions
        for p in pdf.pages:
            p_text = p.extract_text() or ""
            if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', p_text):
                continue

            width, height = getattr(p, 'width', 0), getattr(p, 'height', 0)
            if isinstance(width, (int, float)) and isinstance(height, (int, float)) and width > 0 and height > 0 and is_two_column_page(p, width, height):
                midpoint = width / 2
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

    # Clean text content, format code blocks, and normalize notation
    for q in all_questions:
        raw_lines = [l.strip() for l in q.get("enunciado", "").splitlines() if l.strip()]
        q["enunciado"] = format_enunciado_with_code_blocks(raw_lines)
        if "images" not in q:
            q["images"] = []
        for a in q["alternatives"]:
            a["text"] = normalize_big_o_notation(clean_text(a["text"]))

    return {
        "questions": all_questions,
        "textualReferences": textual_references,
        "detectedTitle": detected_title
    }

def parse_answer_key_pdf(pdf_bytes: bytes, prova_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses an answer key PDF (gabarito) and maps question identifiers to correct alternatives.
    Identifies all available provas/areas/colors in the gabarito and supports flexible filtering by prova_name.
    Automatically falls back to OCR if the PDF is scanned / image-based.
    """
    if is_scanned_pdf(pdf_bytes):
        return extract_answer_key_from_scanned_pdf(pdf_bytes, prova_name=prova_name)

    answers_map: Dict[str, str] = {}
    available_provas: List[Dict[str, str]] = []
    seen_provas: set = set()
    prova_specs: List[Dict[str, Any]] = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        has_vertical_tables = False
        vertical_provas_meta: Dict[int, str] = {}

        for page in pdf.pages:
            tables = page.extract_tables() or []
            for t in tables:
                if not t or len(t) < 3:
                    continue
                for r_idx in range(min(5, len(t))):
                    row_clean = re.sub(r'\s+', '', ' '.join([str(c) for c in t[r_idx] if c])).upper()
                    if 'AVORP' in row_clean:
                        has_vertical_tables = True
                        break

        if has_vertical_tables:
            # First pass: collect all vertical / reversed headers for available provas
            for page in pdf.pages:
                tables = page.extract_tables() or []
                for t in tables:
                    if not t or len(t) < 3:
                        continue
                    h_idx = None
                    for r_idx in range(min(5, len(t))):
                        row_clean = re.sub(r'\s+', '', ' '.join([str(c) for c in t[r_idx] if c])).upper()
                        if 'AVORP' in row_clean:
                            h_idx = r_idx
                            break
                    if h_idx is None:
                        continue

                    row = t[h_idx]
                    for c_idx, cell in enumerate(row):
                        if not cell:
                            continue
                        c_clean = re.sub(r'\s+', '', str(cell)).upper()
                        m_p = re.search(r'([0-9]{1,2})AVORP', c_clean) or re.search(r'AVORP([0-9]{1,2})', c_clean)
                        if m_p:
                            digits = m_p.group(1)
                            if len(digits) == 2:
                                digits = digits[::-1]
                            p_num = int(digits)

                            descs = []
                            for next_c in range(c_idx + 1, min(c_idx + 10, len(row))):
                                v = row[next_c]
                                if v:
                                    if 'AVORP' in re.sub(r'\s+', '', str(v)).upper():
                                        break
                                    clean_tok = str(v)[::-1].replace('\n', ' ')
                                    clean_tok = re.sub(r'(\b\w)\s+(\w\b)', r'\1\2', clean_tok)
                                    clean_tok = re.sub(r'(\b\w)\s+(\w\b)', r'\1\2', clean_tok)
                                    if not re.search(r'PROVA\s*\d+', clean_tok, re.I):
                                        descs.append(clean_tok.strip())

                            full_desc = ' '.join(descs).strip()
                            full_desc = re.sub(r'\s+', ' ', full_desc)
                            p_code = f'PROVA {p_num}'
                            p_full_name = f'{p_code} - {full_desc}' if full_desc else p_code
                            if p_num not in vertical_provas_meta:
                                vertical_provas_meta[p_num] = p_full_name

            for p_num in sorted(vertical_provas_meta.keys()):
                p_code = f'PROVA {p_num}'
                available_provas.append({'id': p_code, 'name': vertical_provas_meta[p_num]})

            # Target prova matching
            target_p_num = 1
            if prova_name:
                m_num = re.search(r'\d+', prova_name)
                if m_num and int(m_num.group(0)) in vertical_provas_meta:
                    target_p_num = int(m_num.group(0))
                else:
                    p_norm = normalize_match_str(prova_name)
                    best_n = 1
                    best_s = -1
                    for p_num, full_n in vertical_provas_meta.items():
                        score = sum(1 for w in p_norm.split() if w in normalize_match_str(full_n))
                        if score > best_s:
                            best_s = score
                            best_n = p_num
                    target_p_num = best_n

            selected_prova_name = f'PROVA {target_p_num}'

            # Extract basic questions (1-20)
            if target_p_num <= 16 and len(pdf.pages) > 0:
                p1_text = pdf.pages[0].extract_text() or ''
                answers_map.update(extract_conhecimentos_basicos(p1_text))
            elif target_p_num > 16 and len(pdf.pages) > 3:
                p4_text = pdf.pages[3].extract_text() or ''
                answers_map.update(extract_conhecimentos_basicos(p4_text))

            # Extract specific questions (21-70)
            for page in pdf.pages:
                tables = page.extract_tables() or []
                for t in tables:
                    if not t or len(t) < 3:
                        continue
                    h_idx = None
                    for r_idx in range(min(5, len(t))):
                        row_clean = re.sub(r'\s+', '', ' '.join([str(c) for c in t[r_idx] if c])).upper()
                        if 'AVORP' in row_clean:
                            h_idx = r_idx
                            break
                    if h_idx is None:
                        continue

                    provas_in_t = []
                    for c_idx, cell in enumerate(t[h_idx]):
                        if not cell:
                            continue
                        c_clean = re.sub(r'\s+', '', str(cell)).upper()
                        m_p = re.search(r'([0-9]{1,2})AVORP', c_clean) or re.search(r'AVORP([0-9]{1,2})', c_clean)
                        if m_p:
                            digits = m_p.group(1)
                            if len(digits) == 2:
                                digits = digits[::-1]
                            provas_in_t.append((c_idx, int(digits)))

                    if not provas_in_t:
                        continue

                    provas_in_t.sort(key=lambda x: x[0])
                    for i, (col_center, p_n) in enumerate(provas_in_t):
                        if p_n != target_p_num:
                            continue
                        prev_c = provas_in_t[i-1][0] if i > 0 else 0
                        next_c = provas_in_t[i+1][0] if i + 1 < len(provas_in_t) else len(t[h_idx])
                        col_s = (prev_c + col_center) // 2 if i > 0 else 0
                        col_e = (col_center + next_c) // 2 if i + 1 < len(provas_in_t) else len(t[h_idx])

                        for r_idx in range(h_idx + 1, len(t)):
                            row = t[r_idx]
                            sub = [str(c).strip() for c in row[col_s:col_e] if c is not None and str(c).strip() != '']
                            if not sub:
                                continue
                            sub_text = ' '.join(sub)
                            for q_id, ans in re.findall(r'([0-9]{1,2})\s*[\-\:\.]?\s*([A-Ea-e]|Anulada|ANULADA|X)\b', sub_text, re.I):
                                q_val = int(q_id)
                                if q_val > 20:
                                    answers_map[str(q_val)] = ans.upper() if len(ans) == 1 else 'X'
                            if len(sub) >= 2 and sub[0].isdigit() and int(sub[0]) > 20 and re.match(r'^[A-Ea-e]$', sub[-1]):
                                answers_map[str(int(sub[0]))] = sub[-1].upper()

        else:
            for p_idx, page in enumerate(pdf.pages):
                tables = page.extract_tables() or []
                for t_idx, table in enumerate(tables):
                    if not table or len(table) < 3:
                        continue

                    # Pattern 1: Check for Area + Color tables (e.g. Row 0 = Area, Row 1 = AMARELA, AZUL)
                    first_row = [c for c in table[0] if c]
                    area_cand = first_row[0].strip() if first_row else ""

                    color_row = table[1] if len(table) > 1 else []
                    colors_with_cols: List[Tuple[int, str]] = []
                    for c_idx, cell in enumerate(color_row):
                        if cell and re.match(r'(?i)^(?:AMARELA|AZUL|BRANCA|VERDE|ROSA|CINZA|PRETA|VERMELHA|LARANJA)', str(cell).strip()):
                            colors_with_cols.append((c_idx, str(cell).strip().upper()))

                    if area_cand and colors_with_cols:
                        area_name = re.sub(r'\s+', ' ', area_cand).strip()
                        for i, (col_idx, color_name) in enumerate(colors_with_cols):
                            next_col = colors_with_cols[i + 1][0] if i + 1 < len(colors_with_cols) else len(table[0])
                            p_id = f"{area_name} - {color_name}"
                            p_name = f"{area_name} - Cor {color_name}"
                            if p_id not in seen_provas:
                                seen_provas.add(p_id)
                                available_provas.append({"id": p_id, "name": p_name})

                            prova_specs.append({
                                "id": p_id,
                                "name": p_name,
                                "type": "area_color_table",
                                "col_start": col_idx,
                                "col_end": next_col,
                                "rows": table[2:]
                            })
                        continue

                    # Pattern 2: PROVA X columns (e.g. PROVA 1 - ENGENHARIA CIVIL)
                    prova_cells = [
                        (r_idx, c_idx, str(c).strip())
                        for r_idx in range(min(5, len(table)))
                        for c_idx, c in enumerate(table[r_idx])
                        if c and re.search(r'PROVA\s*\d+', str(c), re.I)
                    ]

                    if prova_cells:
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
                                available_provas.append({"id": code, "name": col_name})

                            prova_specs.append({
                                "id": code,
                                "name": col_name,
                                "type": "multi_prova_table",
                                "col_start": col_start,
                                "col_end": col_end,
                                "rows": table[3:]
                            })

            # Match target prova
            prova_norm = normalize_match_str(prova_name) if prova_name else None
            target_spec: Optional[Dict[str, Any]] = None

            if prova_norm and prova_specs:
                for spec in prova_specs:
                    if normalize_match_str(spec["id"]) == prova_norm or normalize_match_str(spec["name"]) == prova_norm:
                        target_spec = spec
                        break

                if not target_spec:
                    stopwords = {'prova', 'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'cor'}
                    query_words = [w for w in prova_norm.split() if len(w) >= 3 and w not in stopwords]
                    best_spec = None
                    best_score = -1
                    for spec in prova_specs:
                        spec_norm = normalize_match_str(spec["name"])
                        score = sum(1 for w in query_words if w in spec_norm)
                        for color in ['amarela', 'azul', 'branca', 'verde', 'rosa', 'cinza', 'preta', 'vermelha', 'laranja']:
                            if color in prova_norm and color in spec_norm:
                                score += 5
                        if score > best_score and score > 0:
                            best_score = score
                            best_spec = spec
                    if best_spec:
                        target_spec = best_spec

            if not target_spec and prova_specs:
                target_spec = prova_specs[0]

            selected_prova_name = target_spec["id"] if target_spec else None

            if target_spec:
                if target_spec["type"] == "area_color_table":
                    col_s, col_e = target_spec["col_start"], target_spec["col_end"]
                    for row in target_spec["rows"]:
                        sub_cells = [str(c).strip() for c in row[col_s:col_e] if c]
                        sub_text = " ".join(sub_cells)
                        matches = re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', sub_text, re.I)
                        for q_id, ans in matches:
                            q_num = str(int(q_id))
                            answers_map[q_num] = ans.upper() if len(ans) == 1 else "X"

                elif target_spec["type"] == "multi_prova_table":
                    for page in pdf.pages:
                        tables = page.extract_tables() or []
                        has_multi = any(re.search(r'PROVA\s*\d+', str(c), re.I) for t in tables if t for r in t[:3] for c in r if c)
                        if has_multi:
                            continue
                        p_text = page.extract_text() or ""
                        for q_id, ans in re.findall(r'(?:^|\s)([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', p_text):
                            answers_map[str(int(q_id))] = ans.upper()

                    col_s, col_e = target_spec["col_start"], target_spec["col_end"]
                    for row in target_spec["rows"]:
                        sub_cells = [str(c).strip() for c in row[col_s:col_e] if c]
                        sub_text = " ".join(sub_cells)
                        for q_id, ans in re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e])\b', sub_text):
                            answers_map[str(int(q_id))] = ans.upper()

            if not answers_map:
                for page in pdf.pages:
                    p_text = page.extract_text() or ""
                    for q_id, ans in re.findall(r'(?:^|\s)([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', p_text, re.I):
                        q_num = str(int(q_id))
                        answers_map[q_num] = ans.upper() if len(ans) == 1 else "X"

    result_answers = [{"identifier": q_id, "correctAlternative": ans} for q_id, ans in answers_map.items()]
    result_answers.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)

    return {
        "answers": result_answers,
        "availableProvas": available_provas,
        "selectedProva": selected_prova_name
    }
