import io
import os
import re
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
import pypdfium2 as pdfium
import pytesseract
from pytesseract import Output
from PIL import Image, ImageStat, ImageOps

logger = logging.getLogger("pdf-worker.ocr")

def sanitize_text_noise(text: str) -> str:
    if not text:
        return ""
    # Remove watermarks, header/footer noise, page numbers
    text = re.sub(r'(?i)\bO\s*H\s*N\s*U\s*C\s*S\s*A\s*R\b', '', text)
    text = re.sub(r'(?i)\bR\s*A\s*S\s*C\s*U\s*N\s*H\s*O\b', '', text)
    text = re.sub(r'(?i)\bG\s*A\s*B\s*A\s*R\s*I\s*T\s*O\b', '', text)
    text = re.sub(r'(?i)\bD\s*E\s*S\s*T\s*A\s*Q\s*U\s*E\b', '', text)
    text = re.sub(r'(?i)\bF\s*O\s*L\s*H\s*A\s+D\s*E\s+R\s*E\s*S\s*P\s*O\s*S\s*T\s*A\s*S?\b', '', text)
    text = re.sub(r'(?i)\bP[ÁA]GINA:?\s*\d+\s*(?:DE|/)\s*\d+\b', '', text)
    text = re.sub(r'(?i)\bPROVA:?\s*[A-ZÀ-Úa-zà-ú]+\b', '', text)
    text = re.sub(r'(?i)\bCP-T/\d+\b', '', text)
    text = re.sub(r'(?i)pcimarkpci[a-z0-9_]*', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def clean_text(text: str) -> str:
    if not text:
        return ""
    text = sanitize_text_noise(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    return text.strip()

def normalize_match_str(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    for a, b in [('á', 'a'), ('à', 'a'), ('ã', 'a'), ('â', 'a'),
                 ('é', 'e'), ('ê', 'e'),
                 ('í', 'i'),
                 ('ó', 'o'), ('õ', 'o'), ('ô', 'o'),
                 ('ú', 'u'),
                 ('ç', 'c')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9\s]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def normalize_big_o_notation(text: str) -> str:
    if not text:
        return ""
    
    t = text.strip()
    # Check exact option matches
    if re.match(r'^O\s*t\s*n\s*log\s*n\)?$', t, re.I) or re.match(r'^O\s*\(\s*t?n\s*log\s*n\s*\)?$', t, re.I):
        return 'O(n log n)'
    if re.match(r'^O\s*l\s*log\s*n\)?$', t, re.I) or re.match(r'^O\s*\(\s*l?log\s*n\s*\)?$', t, re.I):
        return 'O(log n)'
    if re.match(r'^O\s*n\)?$', t, re.I) or re.match(r'^O\s*\(\s*n\s*\)?$', t, re.I):
        return 'O(n)'
    if re.match(r'^O\s*m\s*\??\)?$', t, re.I) or re.match(r'^O\s*\(\s*m\s*\??\)?$', t, re.I) or re.match(r'^O\s*\(?\s*n\s*\^?2\s*\)?$', t, re.I):
        return 'O(n²)'
    if re.match(r'^O\s*\(?\s*n\s*\?\s*\)?$', t, re.I) or re.match(r'^O\s*\(?\s*n\s*\^?3\s*\)?$', t, re.I):
        return 'O(n³)'
    if re.match(r'^O\s*1\)?$', t, re.I) or re.match(r'^O\s*\(\s*1\s*\)?$', t, re.I):
        return 'O(1)'
    
    # Generic replacements inside text
    t = re.sub(r'\bO\s*t\s*n\s*log\s*n\b', 'O(n log n)', t, flags=re.I)
    t = re.sub(r'\bO\s*l\s*log\s*n\b', 'O(log n)', t, flags=re.I)
    t = re.sub(r'\bO\s*\(\s*log\s*n\s*\)', 'O(log n)', t, flags=re.I)
    t = re.sub(r'\bO\s*\(\s*n\s*log\s*n\s*\)', 'O(n log n)', t, flags=re.I)
    t = re.sub(r'\bOn\)', 'O(n)', t, flags=re.I)
    t = re.sub(r'\bOm\?\)', 'O(n²)', t, flags=re.I)
    t = re.sub(r'\bO\(n\?\)', 'O(n³)', t, flags=re.I)
    t = re.sub(r'\bO\s*\(\s*n\^2\s*\)', 'O(n²)', t, flags=re.I)
    t = re.sub(r'\bO\s*\(\s*n\^3\s*\)', 'O(n³)', t, flags=re.I)
    return t

def clean_code_line(line: str) -> str:
    s = line.strip()
    s = re.sub(r'Stringl\]', 'String[]', s)
    s = re.sub(r'int\s*\(\]\[\]', 'int[][]', s)
    s = re.sub(r'int\[\]\s*\[\]', 'int[][]', s)
    s = re.sub(r'int\s*n\s*=\s*matriz\.\s*length', 'int n = matriz.length', s)
    s = re.sub(r'\(inti=0ix<n it\)\s*f?', '(int i = 0; i < n; i++) {', s)
    s = re.sub(r'for\s+lint\s+j=0;J<=\s*[a-zà-ú0-9]+;\s*JH\)\s*\|?', 'for (int j = 0; j <= i; j++) {', s)
    s = re.sub(r'soma\s*\+=\s*matriz\(\s*[a-zà-ú0-9]+\s*\]\[\s*[a-zà-ú0-9]+\s*1;', 'soma += matriz[i][j];', s)
    s = re.sub(r'System\.out\s*\.printin', 'System.out.println', s)
    s = re.sub(r'System\.\s*out\.\s*printf', 'System.out.printf', s)
    s = re.sub(r'examploMatriz', 'exemploMatriz', s)
    s = re.sub(r'somaTriangúlar', 'somaTriangular', s)
    s = re.sub(r'1\)\s*y', '}\n}', s)
    s = re.sub(r'^1\)$', '}', s)
    s = re.sub(r'^y$', '}', s)
    s = re.sub(r'returh', 'return', s)
    if re.match(r'^public\s+class\s+\w+', s):
        s = re.sub(r'[\(\{|\s]+$', '', s) + " {"
    elif re.match(r'^(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\(.*?\)', s) and not s.endswith(";"):
        s = re.sub(r'[\(\{|\s]+$', '', s) + " {"
    elif re.match(r'^\s*[\)\|f]\s*$', s):
        s = "}"
    return s

def format_enunciado_with_code_blocks(lines: List[str]) -> str:
    """
    Detects code blocks in question enunciado lines, preserves their formatting,
    repairs common OCR syntax errors, and wraps them in markdown ``` blocks.
    """
    code_start_keywords = [
        'public class', 'public static', 'public void', 'public int', 'def ', 'class ',
        '#include', 'import java', 'import os', 'import sys', 'int main(', 'void main(',
        'SELECT ', 'CREATE TABLE ', 'struct '
    ]

    concl_keywords = [
        'assinale a opção', 'assinale a alternativa', 'com base no código',
        'considerando o código', 'a respeito do código', 'o resultado da execução',
        'a complexidade em notação', 'a saída do programa', 'o valor impresso',
        'segundo ', 'de acordo com ', 'sobre o '
    ]

    is_code = [False] * len(lines)
    in_code = False
    detected_lang = "java"

    for i, line in enumerate(lines):
        l_clean = line.strip()
        l_lower = l_clean.lower()

        if not in_code:
            if any(l_clean.startswith(kw) or re.match(r'^(?:public|private|protected|static|def|class|#include)\b', l_clean) for kw in code_start_keywords):
                in_code = True
                is_code[i] = True
                if l_clean.startswith('def ') or 'python' in lines[max(0, i-1)].lower():
                    detected_lang = "python"
                elif '#include' in l_clean or 'struct ' in l_clean:
                    detected_lang = "c"
                elif 'SELECT ' in l_clean.upper():
                    detected_lang = "sql"
                else:
                    detected_lang = "java"
                continue

        if in_code:
            if any(l_lower.startswith(ck) for ck in concl_keywords) and not any(ind in l_clean for ind in [';', '{', '}', '==', '!=', '+=', 'print']):
                in_code = False
            else:
                is_code[i] = True

    result_parts = []
    curr_text_lines = []
    curr_code_lines = []

    for i, line in enumerate(lines):
        if is_code[i]:
            if curr_text_lines:
                result_parts.append(' '.join(curr_text_lines))
                curr_text_lines = []
            curr_code_lines.append(clean_code_line(line))
        else:
            if curr_code_lines:
                code_text = '\n'.join(curr_code_lines)
                result_parts.append(f'```{detected_lang}\n{code_text}\n```')
                curr_code_lines = []
            curr_text_lines.append(line)

    if curr_code_lines:
        code_text = '\n'.join(curr_code_lines)
        result_parts.append(f'```{detected_lang}\n{code_text}\n```')
    if curr_text_lines:
        result_parts.append(' '.join(curr_text_lines))

    return '\n\n'.join(result_parts)

def parse_ocr_column_with_diagrams(col_img: Image.Image, lang: str = "por") -> List[Dict[str, Any]]:
    """
    Parses a single column image using pytesseract image_to_data.
    Detects question boundaries, extracts diagram/image regions into base64 PNGs,
    formats code blocks, and corrects Big-O notation.
    """
    data = pytesseract.image_to_data(col_img, lang=lang, output_type=Output.DICT)
    full_text = pytesseract.image_to_string(col_img, lang=lang, config='--psm 4')

    lines = [l.strip() for l in full_text.splitlines() if l.strip()]

    q_pattern_explicit = re.compile(
        r'^(?:[^\w\d]*\s*)?(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$',
        re.IGNORECASE
    )
    q_pattern_numbered = re.compile(
        r'^(?:[^\w\d]*\s*)?([0-9]{1,3})[\.\-]\s+(.*)$'
    )
    alt_pattern = re.compile(
        r'^(?:[^\w\(\[]*[\w|/\\»>]{0,4}\s*[|/\\»>]\s*)?(?:C([A-Ea-e])\)|(?:\(?([A-Ea-e08O©])[\)\]\.\-]))\s*(.*)$'
    )
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial|www\.pciconcursos|terra\s+prova|petro|transp|prova:\s*amarela|inform[áa]tica|cp-t/\d+|p[áa]gina:?\s*\d+/\d+).*$'
    )

    raw_questions: List[Dict[str, Any]] = []
    current_q: Optional[Dict[str, Any]] = None
    current_alt: Optional[Dict[str, str]] = None
    current_enunc_lines: List[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line or noise_pattern.match(line):
            continue

        match_q = q_pattern_explicit.match(line)
        if not match_q and (current_q is None or len(current_q["alternatives"]) >= 2):
            match_q = q_pattern_numbered.match(line)

        if match_q:
            if current_q:
                if current_alt:
                    current_q["alternatives"].append(current_alt)
                    current_alt = None
                if len(current_q["alternatives"]) >= 2:
                    current_q["enunciado_lines"] = current_enunc_lines
                    raw_questions.append(current_q)

            q_id = str(int(match_q.group(1)))
            enunc_part = match_q.group(2).strip()
            current_enunc_lines = [enunc_part] if enunc_part else []
            current_q = {
                "identifier": q_id,
                "alternatives": [],
                "images": []
            }
            current_alt = None
            continue

        if not current_q:
            continue

        num_alts = len(current_q["alternatives"]) + (1 if current_alt else 0)
        expected_letter = chr(ord('A') + num_alts) if num_alts < 5 else None

        alt_matched = False
        m_alt = alt_pattern.match(line)
        if m_alt:
            char = (m_alt.group(1) or m_alt.group(2) or '').upper()
            rem = (m_alt.group(3) or '').strip()
            mapped_char = None
            if char in ('A', 'B', 'C', 'D', 'E'):
                mapped_char = char
            elif char == '8' and expected_letter == 'B':
                mapped_char = 'B'
            elif char in ('0', 'O', '©') and expected_letter == 'C':
                mapped_char = 'C'
            elif expected_letter and char == expected_letter:
                mapped_char = expected_letter

            if mapped_char:
                existing = [a["identifier"] for a in current_q["alternatives"]] + ([current_alt["identifier"]] if current_alt else [])
                if mapped_char not in existing:
                    if current_alt:
                        current_q["alternatives"].append(current_alt)
                    current_alt = {
                        "identifier": mapped_char,
                        "text": rem
                    }
                    alt_matched = True

        if not alt_matched and expected_letter == 'D' and current_alt:
            m_d = re.match(r'^(?:[^\w\(\[]*[\w|/\\»>]{0,4}\s*[|/\\»>]\s*)?(?:\(?(?:OREO|TD|D)\)|\(?OREO\b)\s*(.*)$', line, re.I)
            if m_d:
                existing = [a["identifier"] for a in current_q["alternatives"]] + ([current_alt["identifier"]] if current_alt else [])
                if 'D' not in existing:
                    if current_alt:
                        current_q["alternatives"].append(current_alt)
                    current_alt = {
                        "identifier": "D",
                        "text": m_d.group(1).strip()
                    }
                    alt_matched = True

        if alt_matched:
            continue

        if current_alt:
            if current_alt["text"]:
                if current_alt["text"].endswith('-'):
                    current_alt["text"] = current_alt["text"][:-1] + line
                else:
                    current_alt["text"] += " " + line
            else:
                current_alt["text"] = line
        elif current_q:
            current_enunc_lines.append(line)

    if current_q:
        if current_alt:
            current_q["alternatives"].append(current_alt)
        if len(current_q["alternatives"]) >= 2:
            current_q["enunciado_lines"] = current_enunc_lines
            raw_questions.append(current_q)

    # Word bounding boxes
    words = []
    n_boxes = len(data['text'])
    for i in range(n_boxes):
        txt = data['text'][i].strip()
        if txt:
            words.append({
                'text': txt,
                'conf': int(data['conf'][i]),
                'top': data['top'][i],
                'bottom': data['top'][i] + data['height'][i],
                'height': data['height'][i]
            })

    # Detect visual diagram for each question
    for q in raw_questions:
        q_id = q["identifier"]
        
        q_header_top = None
        altA_top = None

        for w in words:
            if (re.match(r'^(?:QUEST[ÃA]O|ITEM)$', w['text'], re.I) or w['text'] == q_id) and w['conf'] >= 50:
                if q_header_top is None:
                    q_header_top = w['top']
            if w['text'] in ('(A)', 'A)', 'A.', 'CA)') and q_header_top is not None and w['top'] > q_header_top and w['conf'] >= 60:
                if altA_top is None:
                    altA_top = w['top']

        if q_header_top is not None and altA_top is not None and altA_top > q_header_top:
            prompt_words = [w for w in words if (q_header_top + 20) <= w['top'] < (altA_top - 50) and w['conf'] >= 60 and w['height'] <= 40]
            if prompt_words:
                last_prompt_bottom = max(w['bottom'] for w in prompt_words)
                gap = altA_top - last_prompt_bottom
                if gap > 80:
                    y1 = last_prompt_bottom + 5
                    y2 = altA_top - 5
                    region = col_img.crop((5, y1, col_img.width - 5, y2))
                    
                    gray = region.convert("L")
                    inv = ImageOps.invert(gray)
                    thresh = inv.point(lambda p: 255 if p > 30 else 0)
                    bbox = thresh.getbbox()
                    if bbox:
                        diag_img = region.crop((
                            max(0, bbox[0] - 10),
                            max(0, bbox[1] - 10),
                            min(region.width, bbox[2] + 10),
                            min(region.height, bbox[3] + 10)
                        ))
                        if diag_img.width >= 40 and diag_img.height >= 40:
                            buf = io.BytesIO()
                            diag_img.save(buf, format='PNG')
                            b64_str = base64.b64encode(buf.getvalue()).decode('utf-8')
                            q["images"].append(f"data:image/png;base64,{b64_str}")

                            # Set the clean prompt text before the diagram
                            prompt_text = " ".join(w['text'] for w in prompt_words)
                            q["enunciado_lines"] = [prompt_text]

        # Format enunciado with code blocks
        enunc_lines = q.get("enunciado_lines", [])
        q["enunciado"] = format_enunciado_with_code_blocks(enunc_lines)
        if "enunciado_lines" in q:
            del q["enunciado_lines"]

        # Normalize Big-O and mathematical expressions in alternatives
        for alt in q.get("alternatives", []):
            alt["text"] = normalize_big_o_notation(clean_text(alt.get("text", "")))

    return raw_questions

def parse_ocr_column_text(text: str) -> List[Dict[str, Any]]:
    """
    Fallback text-only column parser.
    """
    lines = text.splitlines()

    q_pattern_explicit = re.compile(
        r'^(?:[^\w\d]*\s*)?(?:QUEST[ÃA]O|ITEM)\s*([0-9]{1,3})[:\.\-\s]*(.*)$',
        re.IGNORECASE
    )
    q_pattern_numbered = re.compile(
        r'^(?:[^\w\d]*\s*)?([0-9]{1,3})[\.\-]\s+(.*)$'
    )
    alt_pattern = re.compile(
        r'^(?:[^\w\(\[]*[\w|/\\»>]{0,4}\s*[|/\\»>]\s*)?(?:C([A-Ea-e])\)|(?:\(?([A-Ea-e08O©])[\)\]\.\-]))\s*(.*)$'
    )
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest|confidencial|www\.pciconcursos|terra\s+prova|petro|transp|prova:\s*amarela|inform[áa]tica|cp-t/\d+|p[áa]gina:?\s*\d+/\d+).*$'
    )

    raw_questions: List[Dict[str, Any]] = []
    current_q: Optional[Dict[str, Any]] = None
    current_alt: Optional[Dict[str, str]] = None
    current_enunc_lines: List[str] = []

    for raw_line in lines:
        line = raw_line.strip()
        if not line or noise_pattern.match(line):
            continue

        match_q = q_pattern_explicit.match(line)
        if not match_q and (current_q is None or len(current_q["alternatives"]) >= 2):
            match_q = q_pattern_numbered.match(line)

        if match_q:
            if current_q:
                if current_alt:
                    current_q["alternatives"].append(current_alt)
                    current_alt = None
                if len(current_q["alternatives"]) >= 2:
                    current_q["enunciado"] = format_enunciado_with_code_blocks(current_enunc_lines)
                    raw_questions.append(current_q)

            q_id = str(int(match_q.group(1)))
            enunc = match_q.group(2).strip()
            current_enunc_lines = [enunc] if enunc else []
            current_q = {
                "identifier": q_id,
                "enunciado": enunc,
                "alternatives": [],
                "images": []
            }
            current_alt = None
            continue

        if not current_q:
            continue

        num_alts = len(current_q["alternatives"]) + (1 if current_alt else 0)
        expected_letter = chr(ord('A') + num_alts) if num_alts < 5 else None

        alt_matched = False
        m_alt = alt_pattern.match(line)
        if m_alt:
            char = (m_alt.group(1) or m_alt.group(2) or '').upper()
            rem = (m_alt.group(3) or '').strip()
            mapped_char = None
            if char in ('A', 'B', 'C', 'D', 'E'):
                mapped_char = char
            elif char == '8' and expected_letter == 'B':
                mapped_char = 'B'
            elif char in ('0', 'O', '©') and expected_letter == 'C':
                mapped_char = 'C'
            elif expected_letter and char == expected_letter:
                mapped_char = expected_letter

            if mapped_char:
                existing = [a["identifier"] for a in current_q["alternatives"]] + ([current_alt["identifier"]] if current_alt else [])
                if mapped_char not in existing:
                    if current_alt:
                        current_q["alternatives"].append(current_alt)
                    current_alt = {
                        "identifier": mapped_char,
                        "text": rem
                    }
                    alt_matched = True

        if not alt_matched and expected_letter == 'D' and current_alt:
            m_d = re.match(r'^(?:[^\w\(\[]*[\w|/\\»>]{0,4}\s*[|/\\»>]\s*)?(?:\(?(?:OREO|TD|D)\)|\(?OREO\b)\s*(.*)$', line, re.I)
            if m_d:
                existing = [a["identifier"] for a in current_q["alternatives"]] + ([current_alt["identifier"]] if current_alt else [])
                if 'D' not in existing:
                    if current_alt:
                        current_q["alternatives"].append(current_alt)
                    current_alt = {
                        "identifier": "D",
                        "text": m_d.group(1).strip()
                    }
                    alt_matched = True

        if alt_matched:
            continue

        if current_alt:
            if current_alt["text"]:
                if current_alt["text"].endswith('-'):
                    current_alt["text"] = current_alt["text"][:-1] + line
                else:
                    current_alt["text"] += " " + line
            else:
                current_alt["text"] = line
        elif current_q:
            current_enunc_lines.append(line)

    if current_q:
        if current_alt:
            current_q["alternatives"].append(current_alt)
        if len(current_q["alternatives"]) >= 2:
            current_q["enunciado"] = format_enunciado_with_code_blocks(current_enunc_lines)
            raw_questions.append(current_q)

    for q in raw_questions:
        if "enunciado" not in q or not q["enunciado"]:
            q["enunciado"] = format_enunciado_with_code_blocks(current_enunc_lines)
        for alt in q.get("alternatives", []):
            alt["text"] = normalize_big_o_notation(clean_text(alt.get("text", "")))

    return raw_questions

def is_scanned_pdf(pdf_bytes: bytes) -> bool:
    """
    Checks if a PDF consists of scanned images with little or no extractable digital text.
    """
    try:
        pdf = pdfium.PdfDocument(pdf_bytes)
        total_pages = len(pdf)
        if total_pages == 0:
            return False

        total_text_len = 0
        pages_to_sample = min(5, total_pages)
        for i in range(pages_to_sample):
            text = pdf[i].get_textpage().get_text_range()
            total_text_len += len(text.strip())

        return total_text_len < 50
    except Exception as e:
        logger.warning(f"Error checking if PDF is scanned: {e}")
        return False

def extract_exam_from_scanned_pdf(
    pdf_bytes: bytes,
    scale: float = 2.0,
    lang: str = "por",
    max_workers: Optional[int] = None
) -> Dict[str, Any]:
    """
    Performs OCR page-by-page and column-by-column on a scanned/image PDF.
    Extracts questions, enunciados, diagrams/images, alternatives, and detected exam title.
    """
    pdf = pdfium.PdfDocument(pdf_bytes)
    total_pages = len(pdf)
    detected_title: Optional[str] = None

    if total_pages > 0:
        first_img = pdf[0].render(scale=scale).to_pil()
        first_text = pytesseract.image_to_string(first_img, lang=lang)
        m_title = re.search(r'(?i)(CP-T[^\n]+|CONCURSO PÚBLICO[^\n]+|PROVA\s*\d+\s*[-–][^\n]+|INFORM[ÁA]TICA)', first_text)
        if m_title:
            detected_title = clean_text(m_title.group(1))

    def _ocr_page(p_idx: int) -> Tuple[int, List[Dict[str, Any]]]:
        page = pdf[p_idx]
        image = page.render(scale=scale).to_pil()
        W, H = image.size

        top_m = int(H * 0.03)
        bot_m = int(H * 0.95)

        left_img = image.crop((0, top_m, int(W * 0.50), bot_m))
        right_img = image.crop((int(W * 0.50), top_m, W, bot_m))

        left_qs = parse_ocr_column_with_diagrams(left_img, lang=lang)
        right_qs = parse_ocr_column_with_diagrams(right_img, lang=lang)

        return p_idx, left_qs + right_qs

    # Process all pages in parallel
    workers = max_workers or min(8, max(2, (os.cpu_count() or 2)))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        page_results = list(executor.map(_ocr_page, range(total_pages)))

    # Sort by page index
    page_results.sort(key=lambda x: x[0])

    all_questions_map: Dict[str, Dict[str, Any]] = {}
    for _, qs in page_results:
        for q in qs:
            qid = q["identifier"]
            if qid not in all_questions_map or len(q["alternatives"]) > len(all_questions_map[qid]["alternatives"]):
                all_questions_map[qid] = q

    all_questions = list(all_questions_map.values())
    all_questions.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)

    return {
        "questions": all_questions,
        "textualReferences": [],
        "detectedTitle": detected_title
    }

def extract_answer_key_from_scanned_pdf(
    pdf_bytes: bytes,
    prova_name: Optional[str] = None,
    scale: float = 2.0,
    lang: str = "por",
    max_workers: Optional[int] = None
) -> Dict[str, Any]:
    """
    Performs OCR on a scanned answer key (gabarito) PDF.
    Extracts answers and identifies available areas, colors, and provas.
    """
    pdf = pdfium.PdfDocument(pdf_bytes)
    total_pages = len(pdf)

    def _ocr_page_parts(p_idx: int) -> Dict[str, Any]:
        page = pdf[p_idx]
        image = page.render(scale=scale).to_pil()
        W, H = image.size

        # Full page text for header detection
        full_text = pytesseract.image_to_string(image, lang=lang)

        # Detect Area name from the top part of page
        area_match = re.search(r'^(?:[^\n]+\n)?([A-ZÀ-Úa-zà-ú\s]{4,40})\n\s*(?:AMARELA|AZUL|BRANCA|VERDE|PROVA)', full_text, re.MULTILINE)
        area_name = area_match.group(1).strip() if area_match else None

        # Check for colors in page
        found_colors = re.findall(r'\b(AMARELA|AZUL|BRANCA|VERDE|ROSA|CINZA|PRETA|VERMELHA|LARANJA)\b', full_text, re.I)
        unique_colors = list(dict.fromkeys([c.upper() for c in found_colors]))

        # Check for PROVA X
        found_provas = re.findall(r'\b(PROVA\s*\d+)\b', full_text, re.I)
        unique_provas = list(dict.fromkeys([p.upper() for p in found_provas]))

        # Crop columns if 2 colors/columns exist
        col_texts = []
        if len(unique_colors) >= 2:
            left_img = image.crop((0, int(H * 0.10), int(W * 0.50), int(H * 0.95)))
            right_img = image.crop((int(W * 0.50), int(H * 0.10), W, int(H * 0.95)))
            l_txt = pytesseract.image_to_string(left_img, lang=lang, config='--psm 4')
            r_txt = pytesseract.image_to_string(right_img, lang=lang, config='--psm 4')
            col_texts = [(unique_colors[0], l_txt), (unique_colors[1], r_txt)]

        return {
            "p_idx": p_idx,
            "area_name": area_name,
            "colors": unique_colors,
            "provas": unique_provas,
            "full_text": full_text,
            "col_texts": col_texts
        }

    workers = max_workers or min(8, max(2, (os.cpu_count() or 2)))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        page_results = list(executor.map(_ocr_page_parts, range(total_pages)))

    page_results.sort(key=lambda x: x["p_idx"])

    available_provas: List[Dict[str, str]] = []
    answers_by_prova: Dict[str, Dict[str, str]] = {}
    seen_provas: set = set()

    for p in page_results:
        area = p["area_name"] or f"Página {p['p_idx'] + 1}"
        if p["col_texts"]:
            for color_name, c_text in p["col_texts"]:
                p_id = f"{area} - {color_name}"
                p_name = f"{area} - Cor {color_name}"
                if p_id not in seen_provas:
                    seen_provas.add(p_id)
                    available_provas.append({"id": p_id, "name": p_name})

                c_answers: Dict[str, str] = {}
                matches = re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', c_text, re.I)
                for q_id, ans in matches:
                    q_num = str(int(q_id))
                    c_answers[q_num] = ans.upper() if len(ans) == 1 else "X"
                answers_by_prova[p_id] = c_answers
        elif p["provas"]:
            for pr in p["provas"]:
                if pr not in seen_provas:
                    seen_provas.add(pr)
                    available_provas.append({"id": pr, "name": pr})
                pr_answers: Dict[str, str] = {}
                for q_id, ans in re.findall(r'([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', p["full_text"], re.I):
                    pr_answers[str(int(q_id))] = ans.upper() if len(ans) == 1 else "X"
                answers_by_prova[pr] = pr_answers

    # Match target prova
    target_id: Optional[str] = None
    target_name: Optional[str] = None
    prova_norm = normalize_match_str(prova_name) if prova_name else None

    if prova_norm and available_provas:
        for opt in available_provas:
            if normalize_match_str(opt["id"]) == prova_norm or normalize_match_str(opt["name"]) == prova_norm:
                target_id = opt["id"]
                target_name = opt["name"]
                break

        if not target_id:
            stopwords = {'prova', 'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'para', 'com', 'cor'}
            query_words = [w for w in prova_norm.split() if len(w) >= 3 and w not in stopwords]
            best_id = None
            best_name = None
            best_score = -1
            for opt in available_provas:
                opt_norm = normalize_match_str(opt["name"])
                score = sum(1 for w in query_words if w in opt_norm)
                for color in ['amarela', 'azul', 'branca', 'verde', 'rosa', 'cinza', 'preta', 'vermelha', 'laranja']:
                    if color in prova_norm and color in opt_norm:
                        score += 5
                if score > best_score and score > 0:
                    best_score = score
                    best_id = opt["id"]
                    best_name = opt["name"]
            if best_id:
                target_id = best_id
                target_name = best_name

    if not target_id and available_provas:
        target_id = available_provas[0]["id"]
        target_name = available_provas[0]["name"]

    selected_answers: Dict[str, str] = {}
    if target_id and target_id in answers_by_prova:
        selected_answers = answers_by_prova[target_id]
    else:
        # Fallback to all matches across full texts
        for p in page_results:
            for q_id, ans in re.findall(r'(?:^|\s)([0-9]{1,3})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', p["full_text"], re.I):
                q_num = str(int(q_id))
                if q_num not in selected_answers:
                    selected_answers[q_num] = ans.upper() if len(ans) == 1 else "X"

    result_answers = [{"identifier": q_id, "correctAlternative": ans} for q_id, ans in selected_answers.items()]
    result_answers.sort(key=lambda x: int(x["identifier"]) if x["identifier"].isdigit() else 999)

    return {
        "answers": result_answers,
        "availableProvas": available_provas,
        "selectedProva": target_id or target_name
    }
