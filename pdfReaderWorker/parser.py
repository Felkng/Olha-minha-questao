import re
import io
import base64
import pdfplumber
from typing import List, Dict, Any, Optional, Tuple
from ocr import (
    is_scanned_pdf,
    extract_exam_from_scanned_pdf,
    extract_answer_key_from_scanned_pdf,
    normalize_big_o_notation,
    format_enunciado_with_code_blocks
)

SYMBOL_PUA_MAP = {
    0xF020: ' ', 0xF021: '!', 0xF022: '∀', 0xF023: '#', 0xF024: '∃', 0xF025: '%',
    0xF026: '&', 0xF027: '∍', 0xF028: '(', 0xF029: ')', 0xF02A: '∗', 0xF02B: '+',
    0xF02C: ',', 0xF02D: '−', 0xF02E: '.', 0xF02F: '/',
    0xF03A: ':', 0xF03B: ';', 0xF03C: '<', 0xF03D: '=', 0xF03E: '>', 0xF03F: '?',
    0xF040: '≅', 0xF041: 'Α', 0xF042: 'Β', 0xF043: 'Χ', 0xF044: 'Δ', 0xF045: 'Ε',
    0xF046: 'Φ', 0xF047: 'Γ', 0xF048: 'Η', 0xF049: 'Ι', 0xF04A: 'ϑ', 0xF04B: 'Κ',
    0xF04C: 'Λ', 0xF04D: 'Μ', 0xF04E: 'Ν', 0xF04F: 'Ο', 0xF050: 'Π', 0xF051: 'Θ',
    0xF052: 'Ρ', 0xF053: 'Σ', 0xF054: 'Τ', 0xF055: 'Υ', 0xF056: 'ς', 0xF057: 'Ω',
    0xF058: 'Ξ', 0xF059: 'Ψ', 0xF05A: 'Ζ', 0xF05B: '[', 0xF05C: '∴', 0xF05D: ']',
    0xF05E: '⊥', 0xF05F: '_', 0xF060: '‾', 0xF061: 'α', 0xF062: 'β', 0xF063: 'χ',
    0xF064: 'δ', 0xF065: 'ε', 0xF066: 'φ', 0xF067: 'γ', 0xF068: 'η', 0xF069: 'ι',
    0xF06A: 'ϕ', 0xF06B: 'κ', 0xF06C: 'λ', 0xF06D: 'μ', 0xF06E: 'ν', 0xF06F: 'ο',
    0xF070: 'π', 0xF071: 'θ', 0xF072: 'ρ', 0xF073: 'σ', 0xF074: 'τ', 0xF075: 'υ',
    0xF076: 'ϖ', 0xF077: 'ω', 0xF078: 'ξ', 0xF079: 'ψ', 0xF07A: 'ζ', 0xF07B: '{',
    0xF07C: '|', 0xF07D: '}', 0xF07E: '∼',
    0xF0A0: '€', 0xF0A1: 'ϒ', 0xF0A2: '′', 0xF0A3: '≤', 0xF0A4: '⁄', 0xF0A5: '∞',
    0xF0A6: 'ƒ', 0xF0A7: '♣', 0xF0A8: '♦', 0xF0A9: '♥', 0xF0AA: '♠', 0xF0AB: '↔',
    0xF0AC: '←', 0xF0AD: '↑', 0xF0AE: '→', 0xF0AF: '↓', 0xF0B0: '°', 0xF0B1: '±',
    0xF0B2: '″', 0xF0B3: '≥', 0xF0B4: '×', 0xF0B5: '∝', 0xF0B6: '∂', 0xF0B7: '•',
    0xF0B8: '÷', 0xF0B9: '≠', 0xF0BA: '≡', 0xF0BB: '≈', 0xF0BC: '…',
    0xF0C0: 'ℵ', 0xF0C1: 'ℑ', 0xF0C2: 'ℜ', 0xF0C3: '℘', 0xF0C4: '⊗', 0xF0C5: '⊕',
    0xF0C6: '∅', 0xF0C7: '∩', 0xF0C8: '∪', 0xF0C9: '⊃', 0xF0CA: '⊇', 0xF0CB: '⊄',
    0xF0CC: '⊂', 0xF0CD: '⊆', 0xF0CE: '∈', 0xF0CF: '∉', 0xF0D0: '∠', 0xF0D1: '∇',
    0xF0D2: '®', 0xF0D3: '©', 0xF0D4: '™', 0xF0D5: '∏', 0xF0D6: '√', 0xF0D7: '⋅',
    0xF0D8: '¬', 0xF0D9: '∧', 0xF0DA: '∨', 0xF0DB: '⇔', 0xF0DC: '⇐', 0xF0DD: '⇑',
    0xF0DE: '⇒', 0xF0DF: '⇓', 0xF0E0: '◊', 0xF0E1: '⟨', 0xF0E5: '∑', 0xF0F1: '⟩',
    0xF0F2: '∫'
}

def decode_symbols(text: str) -> str:
    if not text:
        return ""
    return text.translate(str.maketrans({chr(k): v for k, v in SYMBOL_PUA_MAP.items()}))

def sanitize_text_noise(text: str) -> str:
    if not text:
        return ""
    text = decode_symbols(text)
    # Remove reversed/spaced watermarks like O H N U C S A R, R A S C U N H O
    text = re.sub(r'(?i)\bO\s*H\s*N\s*U\s*C\s*S\s*A\s*R\b', '', text)
    text = re.sub(r'(?i)\bR\s*A\s*S\s*C\s*U\s*N\s*H\s*O\b', '', text)
    text = re.sub(r'(?i)\bG\s*A\s*B\s*A\s*R\s*I\s*T\s*O\b', '', text)
    text = re.sub(r'(?i)\bD\s+E\s+S\s+T\s+A\s+Q\s+U\s+E\b', '', text)
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

def table_to_markdown(table_data: List[List[Any]]) -> str:
    if not table_data or len(table_data) < 2:
        return ""
    clean_rows = []
    for row in table_data:
        row_cells = [str(c).replace('\n', ' ').strip() if c is not None else '' for c in row]
        if any(row_cells) and not all('TRANSPETRO' in c or 'ANSPET' in c for c in row_cells if c):
            clean_rows.append(row_cells)

    if len(clean_rows) < 2 or max(len(r) for r in clean_rows) < 2:
        return ""

    num_cols = max(len(r) for r in clean_rows)
    padded = [r + [''] * (num_cols - len(r)) for r in clean_rows]

    header = '| ' + ' | '.join(padded[0]) + ' |'
    separator = '| ' + ' | '.join([':---'] * num_cols) + ' |'
    data_rows = ['| ' + ' | '.join(r) + ' |' for r in padded[1:]]

    return '\n' + '\n'.join([header, separator] + data_rows) + '\n'

def is_valid_data_table(t: Any, t_data: List[List[Any]]) -> bool:
    if not t_data or len(t_data) < 2:
        return False
    bbox = getattr(t, 'bbox', None)
    if bbox:
        height = bbox[3] - bbox[1]
        if height > 220 or height < 20:
            return False
    num_rows = len(t_data)
    num_cols = max(len(r) for r in t_data)
    if num_cols < 2 or num_cols > 8 or num_rows < 2 or num_rows > 15:
        return False

    total_cells = 0
    valid_cells = 0
    for r in t_data:
        for c in r:
            total_cells += 1
            if c is not None and str(c).strip():
                c_str = str(c).strip()
                if any(n in c_str.upper() for n in ['TRANSPETRO', 'PCIMARKPCI', 'ANALISTA DE SISTEMAS']):
                    return False
                if len(c_str) > 50:
                    return False
                valid_cells += 1

    if total_cells == 0 or (valid_cells / total_cells) < 0.6:
        return False

    first_row = [str(c).strip() for c in t_data[0] if c is not None]
    if all(re.match(r'^J\d+$', c) for c in first_row):
        return False

    return True

def extract_rich_text_from_crop(crop: Any) -> str:
    """
    Extracts text from a crop (column or page) while preserving bold (**...**),
    underline (<u>...</u>), structured markdown tables, text-aligned tables,
    raster images, vector diagrams, and monospace codes.
    """
    crop_h = getattr(crop, 'height', 1000)
    crop_w = getattr(crop, 'width', 1000)
    crop_bbox = getattr(crop, 'bbox', (0, 0, crop_w, crop_h))

    # 1. Detect Structured Data Tables (pdfplumber find_tables)
    found_tables = []
    if hasattr(crop, 'find_tables'):
        try:
            found_tables = crop.find_tables() or []
        except Exception:
            found_tables = []

    valid_table_bboxes = []
    table_items = []

    for t in found_tables:
        try:
            t_data = t.extract()
            if not is_valid_data_table(t, t_data):
                continue
            t_md = table_to_markdown(t_data)
            if t_md:
                valid_table_bboxes.append(t.bbox)
                table_items.append({"top": t.bbox[1], "md": t_md, "bbox": t.bbox})
        except Exception:
            continue

    # Extract underlines and words first to detect text-aligned tables
    underlines = []
    if hasattr(crop, 'lines'):
        underlines += [l for l in crop.lines if abs(l.get('top', 0) - l.get('bottom', 0)) < 3 and abs(l.get('x1', 0) - l.get('x0', 0)) > 3]
    if hasattr(crop, 'rects'):
        underlines += [r for r in crop.rects if r.get('height', 0) < 3 and r.get('width', 0) > 3]

    words = []
    if hasattr(crop, 'extract_words'):
        try:
            words = crop.extract_words(
                extra_attrs=["fontname", "size"],
                keep_blank_chars=False,
                use_text_flow=True
            )
        except Exception:
            words = []

    # Exclude words inside structured find_tables
    initial_non_table_words = []
    for w in words:
        in_tb = any(tb[0] <= w.get('x0', 0) and w.get('x1', 0) <= tb[2] and tb[1] <= w.get('top', 0) and w.get('bottom', 0) <= tb[3] for tb in valid_table_bboxes)
        if not in_tb:
            initial_non_table_words.append(w)

    # Group words into preliminary lines
    prelim_lines = []
    curr_line = []
    curr_top = None
    for w in sorted(initial_non_table_words, key=lambda x: (x.get('top', 0), x.get('x0', 0))):
        w_top = w.get('top', 0)
        if curr_top is None or abs(w_top - curr_top) <= 3.5:
            curr_line.append(w)
            curr_top = w_top if curr_top is None else (curr_top + w_top) / 2
        else:
            prelim_lines.append({"top": curr_top, "words": sorted(curr_line, key=lambda x: x.get('x0', 0))})
            curr_line = [w]
            curr_top = w_top
    if curr_line:
        prelim_lines.append({"top": curr_top, "words": sorted(curr_line, key=lambda x: x.get('x0', 0))})

    # 2. Detect Text-Aligned Tables (e.g. Job scheduling table in Q55)
    text_table_words = []
    i = 0
    while i < len(prelim_lines):
        line_words = prelim_lines[i]['words']
        line_txt = ' '.join(w.get('text', '') for w in line_words)
        header_keywords = ['job', 'processo', 'coluna', 'atributo', 'entidade', 'serviço', 'servidor', 'tabela', 'instrução', 'instrucao', 'etapa', 'fase', 'prioridade', 'tempo', 'endereço', 'página', 'frame']
        is_header = any(re.search(r'\b' + kw + r'\b', line_txt, re.I) for kw in header_keywords)
        if is_header and len(line_words) >= 2:
            cols = []
            curr_col = [line_words[0]]
            for w in line_words[1:]:
                if w['x0'] - curr_col[-1]['x1'] >= 18:
                    cols.append(curr_col)
                    curr_col = [w]
                else:
                    curr_col.append(w)
            if curr_col:
                cols.append(curr_col)

            if len(cols) >= 2:
                col_ranges = [(c[0]['x0'] - 20, c[-1]['x1'] + 20) for c in cols]
                data_rows = []
                j = i + 1
                while j < len(prelim_lines) and j < i + 15:
                    r_words = prelim_lines[j]['words']
                    r_txt = ' '.join(w.get('text', '') for w in r_words)
                    if re.match(r'^(?:\([A-E]\)|\d{1,3}$|Tabela\s+de\s+|O\s+algoritmo|Considerando)', r_txt):
                        break
                    row_cells = [''] * len(cols)
                    assigned = 0
                    for w in r_words:
                        w_mid = (w['x0'] + w['x1']) / 2
                        for col_idx, (cx0, cx1) in enumerate(col_ranges):
                            if cx0 <= w_mid <= cx1:
                                row_cells[col_idx] = (row_cells[col_idx] + ' ' + w.get('text', '')).strip()
                                assigned += 1
                                break
                    non_empty = [c for c in row_cells if c]
                    if len(non_empty) >= 2 and assigned >= len(r_words) * 0.7:
                        data_rows.append((j, row_cells))
                        j += 1
                    else:
                        break

                if len(data_rows) >= 2:
                    header_cells = [' '.join(w.get('text', '') for w in c) for c in cols]
                    num_c = len(cols)
                    header_line = '| ' + ' | '.join(header_cells) + ' |'
                    sep_line = '| ' + ' | '.join([':---'] * num_c) + ' |'
                    data_lines = ['| ' + ' | '.join(r) + ' |' for _, r in data_rows]
                    md = '\n' + '\n'.join([header_line, sep_line] + data_lines) + '\n'

                    t_words = [w for w in line_words]
                    for r_idx, _ in data_rows:
                        t_words.extend(prelim_lines[r_idx]['words'])
                    text_table_words.extend(t_words)

                    tb_x0 = min(w['x0'] for w in t_words) - 5
                    tb_y0 = min(w['top'] for w in t_words) - 5
                    tb_x1 = max(w['x1'] for w in t_words) + 5
                    tb_y1 = max(w['bottom'] for w in t_words) + 5
                    valid_table_bboxes.append((tb_x0, tb_y0, tb_x1, tb_y1))
                    table_items.append({'top': prelim_lines[i]['top'], 'md': md})
                    i = j
                    continue
        i += 1

    # 3. Detect Raster Images
    valid_image_bboxes = []
    image_items = []
    if hasattr(crop, 'images') and hasattr(crop, 'to_image'):
        try:
            for img in crop.images:
                w = img.get("width", 0)
                h = img.get("height", 0)
                x0 = img.get("x0", 0)
                top = img.get("top", 0)
                x1 = img.get("x1", 0)
                bottom = img.get("bottom", 0)
                # Filter bottom-left background watermarks
                if x0 <= 5 and bottom >= crop_h - 10:
                    continue
                if w < 25 or h < 25:
                    continue
                bbox = (x0, top, x1, bottom)
                img_crop = crop.crop(bbox)
                p_img = img_crop.to_image(resolution=150)
                buf = io.BytesIO()
                p_img.save(buf, format="PNG")
                b64 = base64.b64encode(buf.getvalue()).decode("ascii")
                data_url = f"data:image/png;base64,{b64}"
                valid_image_bboxes.append(bbox)
                image_items.append({"top": top, "md": f"![Figura]({data_url})", "data_url": data_url, "bbox": bbox})
        except Exception:
            pass

    # 4. Detect Vector Diagrams (connected lines & rects)
    if hasattr(crop, 'lines') or hasattr(crop, 'rects'):
        diag_lines = []
        for l in getattr(crop, 'lines', []):
            w = abs(l.get('x1', 0) - l.get('x0', 0))
            h = abs(l.get('bottom', 0) - l.get('top', 0))
            top = l.get('top', 0)
            bot = l.get('bottom', 0)
            if top <= crop_bbox[1] + 25 or bot >= crop_bbox[3] - 25:
                continue
            if w > crop_w * 0.75 or h > crop_h * 0.75:
                continue
            if h >= 8 or (w >= 8 and w < crop_w * 0.75):
                diag_lines.append(l)

        diag_rects = []
        for r in getattr(crop, 'rects', []):
            w = r.get('width', 0)
            h = r.get('height', 0)
            top = r.get('top', 0)
            bot = r.get('bottom', 0)
            if top <= crop_bbox[1] + 25 or bot >= crop_bbox[3] - 25:
                continue
            if w >= 8 and h >= 8 and w < crop_w * 0.75 and h < crop_h * 0.75:
                diag_rects.append(r)

        all_objs = diag_lines + diag_rects
        if all_objs:
            clusters = []
            for obj in all_objs:
                clusters.append({
                    'x0': obj.get('x0', 0),
                    'y0': obj.get('top', 0),
                    'x1': obj.get('x1', 0),
                    'y1': obj.get('bottom', 0),
                    'objs': [obj]
                })

            changed = True
            while changed:
                changed = False
                new_clusters = []
                while clusters:
                    c = clusters.pop(0)
                    merged = False
                    for other in clusters:
                        if not (c['x1'] < other['x0'] - 12 or c['x0'] > other['x1'] + 12 or c['y1'] < other['y0'] - 12 or c['y0'] > other['y1'] + 12):
                            other['x0'] = min(c['x0'], other['x0'])
                            other['y0'] = min(c['y0'], other['y0'])
                            other['x1'] = max(c['x1'], other['x1'])
                            other['y1'] = max(c['y1'], other['y1'])
                            other['objs'].extend(c['objs'])
                            merged = True
                            changed = True
                            break
                    if not merged:
                        new_clusters.append(c)
                clusters = new_clusters

            alt_words = [w for w in words if re.match(r'^\([A-E]\)$', w.get('text', ''))]

            for c in clusters:
                overlaps = False
                for tb in valid_table_bboxes + valid_image_bboxes:
                    if not (c['x1'] < tb[0] or c['x0'] > tb[2] or c['y1'] < tb[1] or c['y0'] > tb[3]):
                        overlaps = True
                        break
                if overlaps:
                    continue

                cw = c['x1'] - c['x0']
                ch = c['y1'] - c['y0']
                num_rects = len([o for o in c['objs'] if o.get('width', 0) >= 8 and o.get('height', 0) >= 8])
                if cw < 40 or ch < 20 or ch > 350:
                    continue
                if num_rects == 0 and len(c['objs']) < 6:
                    continue

                has_alts = any(c['y0'] - 15 <= w['top'] and w['bottom'] <= c['y1'] + 15 for w in alt_words)
                if has_alts:
                    continue

                words_in_c = [w for w in words if c['x0']-25 <= w.get('x0',0) and w.get('x1',0) <= c['x1']+25 and c['y0']-15 <= w.get('top',0) and w.get('bottom',0) <= c['y1']+15]

                pad_x0 = max(crop_bbox[0], c['x0'] - 6)
                pad_y0 = max(crop_bbox[1], c['y0'] - 6)
                pad_x1 = min(crop_bbox[2], c['x1'] + 6)
                pad_y1 = min(crop_bbox[3], c['y1'] + 6)

                if words_in_c:
                    pad_x0 = max(crop_bbox[0], min(pad_x0, min(w['x0'] for w in words_in_c) - 2))
                    pad_y0 = max(crop_bbox[1], min(pad_y0, min(w['top'] for w in words_in_c) - 2))
                    pad_x1 = min(crop_bbox[2], max(pad_x1, max(w['x1'] for w in words_in_c) + 2))
                    pad_y1 = min(crop_bbox[3], max(pad_y1, max(w['bottom'] for w in words_in_c) + 2))

                diag_bbox = (pad_x0, pad_y0, pad_x1, pad_y1)
                try:
                    diag_crop = crop.crop(diag_bbox)
                    p_img = diag_crop.to_image(resolution=150)
                    buf = io.BytesIO()
                    p_img.save(buf, format="PNG")
                    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
                    data_url = f"data:image/png;base64,{b64}"
                    valid_image_bboxes.append(diag_bbox)
                    image_items.append({"top": pad_y0, "md": f"![Figura]({data_url})", "data_url": data_url, "bbox": diag_bbox})
                except Exception:
                    pass

    # Final words list excluding tables, text_table_words, and images
    final_words = []
    for w in words:
        if w in text_table_words:
            continue
        in_excluded = False
        for bbox in valid_table_bboxes + valid_image_bboxes:
            if bbox[0] <= w.get('x0', 0) and w.get('x1', 0) <= bbox[2] and bbox[1] <= w.get('top', 0) and w.get('bottom', 0) <= bbox[3]:
                in_excluded = True
                break
        if not in_excluded:
            final_words.append(w)

    # Group final words into lines
    lines = []
    curr_line = []
    curr_top = None
    for w in sorted(final_words, key=lambda x: (x.get('top', 0), x.get('x0', 0))):
        w_top = w.get('top', 0)
        if curr_top is None or abs(w_top - curr_top) <= 3.5:
            curr_line.append(w)
            curr_top = w_top if curr_top is None else (curr_top + w_top) / 2
        else:
            lines.append({"top": curr_top, "words": sorted(curr_line, key=lambda x: x.get('x0', 0))})
            curr_line = [w]
            curr_top = w_top
    if curr_line:
        lines.append({"top": curr_top, "words": sorted(curr_line, key=lambda x: x.get('x0', 0))})

    all_elements = []
    for l in lines:
        all_elements.append({"type": "line", "top": l["top"], "words": l["words"]})
    for t in table_items:
        all_elements.append({"type": "table", "top": t["top"], "md": t["md"]})
    for im in image_items:
        all_elements.append({"type": "image", "top": im["top"], "md": im["md"]})

    all_elements.sort(key=lambda x: x["top"])

    formatted_output = []
    for el in all_elements:
        if el["type"] == "table" or el["type"] == "image":
            formatted_output.append(el["md"])
            continue

        line_words = el["words"]
        line_str_parts = []
        for w in line_words:
            t = w.get("text", "")
            fn = w.get("fontname", "").lower()
            is_bold = "bold" in fn or "black" in fn
            is_courier = "courier" in fn or "mono" in fn

            w_bottom = w.get("bottom", 0)
            w_x0 = w.get("x0", 0)
            w_x1 = w.get("x1", 0)

            is_underlined = any(
                abs(u.get("top", 0) - w_bottom) <= 3.5 and
                not (u.get("x1", 0) < w_x0 or u.get("x0", 0) > w_x1)
                for u in underlines
            )

            t = t.replace("(cid:2)", "l.")

            if re.match(r"^\d{1,3}$", t) and len(line_words) == 1:
                is_bold = False

            w_formatted = t
            if is_bold:
                w_formatted = f"**{w_formatted}**"
            if is_underlined:
                w_formatted = f"<u>{w_formatted}</u>"
            line_str_parts.append(w_formatted)

        l_text = " ".join(line_str_parts)
        l_text = re.sub(r"\*\*\s+\*\*", " ", l_text)
        l_text = re.sub(r"</u>\s+<u>", " ", l_text)
        formatted_output.append(l_text)

    return "\n".join(formatted_output)

def is_two_column_page(page: Any, width: float, height: float) -> bool:
    """
    Determines if a page is truly 2-column or single-column layout.
    Detects continuous sentence transitions across the page center vs distinct column gutters.
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

    mid = width / 2
    body_words = [w for w in words if 40 <= w.get("top", 0) <= height - 40]
    if len(body_words) < 25:
        return False

    lines = []
    curr_line = []
    curr_top = None
    for w in sorted(body_words, key=lambda x: (x.get("top", 0), x.get("x0", 0))):
        w_top = w.get("top", 0)
        if curr_top is None or abs(w_top - curr_top) <= 3.5:
            curr_line.append(w)
            curr_top = w_top if curr_top is None else (curr_top + w_top) / 2
        else:
            lines.append(sorted(curr_line, key=lambda x: x.get("x0", 0)))
            curr_line = [w]
            curr_top = w_top
    if curr_line:
        lines.append(sorted(curr_line, key=lambda x: x.get("x0", 0)))

    full_sentence_lines = 0
    two_col_lines = 0

    for l_words in lines:
        txt = " ".join(w.get("text", "") for w in l_words)
        if any(n in txt.lower() for n in ["pcimarkpci", "analista de sistemas", "transpetro", "rascunho", "concursos", "terra"]):
            continue

        for i in range(len(l_words) - 1):
            w1 = l_words[i]
            w2 = l_words[i+1]
            if w1.get("x0", 0) < mid and w2.get("x1", 0) > mid:
                gap = w2.get("x0", 0) - w1.get("x1", 0)
                if gap <= 18:
                    full_sentence_lines += 1
                    break
                elif gap >= 22:
                    two_col_lines += 1
                    break

    if two_col_lines >= 15 and two_col_lines > 2 * full_sentence_lines:
        return True

    if full_sentence_lines >= 2:
        return False

    return two_col_lines >= 3

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
        r'(?:\(([A-Ea-e])\)|\[([A-Ea-e])\]|(?:\b|\s|^)([A-Ea-e])[\.\-\)])'
    )
    noise_pattern = re.compile(
        r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest.*|confidencial|www\.pciconcursos.*|terra\s+prova|petro|transp|terra|prova\s*\d+\s*[-–].*|.*(?:analista|t[ée]cnico|engenheiro|m[ée]dico|administrador|advogado|contador|economista|enfermeiro|profissional)\s+.*prova\s*\d+.*)$'
    )
    continuation_pattern = re.compile(r'(?i)^\(?continua[çc][ãa]o\s+da\s+quest[ãa]o\s*\d+\)?$')

    raw_questions: List[Dict[str, Any]] = []
    current_q: Optional[Dict[str, Any]] = None
    current_alt: Optional[Dict[str, str]] = None
    state = "NONE"

    for line in lines:
        line = line.strip()
        if not line or noise_pattern.match(line) or continuation_pattern.match(line):
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
                    current_q["alternatives"].sort(key=lambda x: ord(x["identifier"]) if len(x.get("identifier", "")) == 1 else 999)
                    raw_questions.append(current_q)

            q_id = str(int(match_q.group(1)))
            enunc = "" if standalone else match_q.group(2).strip()
            current_q = {
                "identifier": q_id,
                "enunciado": enunc,
                "alternatives": [],
                "images": []
            }
            state = "ENUNCIADO"
            current_alt = None
            continue

        if not current_q:
            continue

        imgs_in_line = re.findall(r'!\[.*?\]\((data:image/[^)]+)\)', line)
        for img_url in imgs_in_line:
            if img_url not in current_q["images"]:
                current_q["images"].append(img_url)

        # Check inline horizontal alternatives (must form a strictly ascending sequence without duplicates: A < B < C or A < D, etc.)
        raw_matches = list(alt_inline_pattern.finditer(line))
        inline_alts: Optional[List[Dict[str, str]]] = None
        if len(raw_matches) >= 2:
            parsed_letters = [
                (m, (m.group(1) or m.group(2) or m.group(3)).upper())
                for m in raw_matches
            ]
            is_ascending = all(
                ord(parsed_letters[i][1]) < ord(parsed_letters[i + 1][1])
                for i in range(len(parsed_letters) - 1)
            )
            if is_ascending:
                first_m = parsed_letters[0][0]
                if line[:first_m.start()].strip() == '':
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
                if current_q["enunciado"].endswith('-') and not current_q["enunciado"].endswith(' -'):
                    current_q["enunciado"] = current_q["enunciado"][:-1] + line
                else:
                    current_q["enunciado"] += "\n" + line
            else:
                current_q["enunciado"] = line
        elif state == "ALTERNATIVE" and current_alt:
            if current_alt["text"]:
                if current_alt["text"].endswith('-') and not current_alt["text"].endswith(' -'):
                    current_alt["text"] = current_alt["text"][:-1] + line
                else:
                    current_alt["text"] += " " + line
            else:
                current_alt["text"] = line

    if current_q:
        if current_alt:
            current_q["alternatives"].append(current_alt)
        if len(current_q["alternatives"]) >= 2:
            current_q["alternatives"].sort(key=lambda x: ord(x["identifier"]) if len(x.get("identifier", "")) == 1 else 999)
            raw_questions.append(current_q)

    # Sanitize noise from enunciados and alternatives
    for q in raw_questions:
        q["enunciado"] = sanitize_text_noise(q.get("enunciado", ""))
        for alt in q.get("alternatives", []):
            alt["text"] = sanitize_text_noise(alt.get("text", ""))

    return raw_questions

def strip_markup(text: str) -> str:
    """
    Removes Markdown and HTML formatting tokens for regex/pattern matching purposes.
    """
    if not text:
        return ""
    return re.sub(r'[*_~`]|</?[a-z0-9]+>', '', text).strip()

def format_body_paragraphs(body_lines: List[str]) -> str:
    """
    Groups and formats narrative / reference lines into clean, distinct paragraphs.
    Correctly merges multi-line sentences, handles line-break hyphenation (e.g. 'repen-' + 'te' -> 'repente'),
    preserves bold/underline/markdown table structures, and separates distinct paragraphs and subheadings with double newlines.
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
            
        clean_l = strip_markup(line)
        if line.startswith('|') and line.endswith('|'):
            if current_lines:
                paragraphs.append(current_lines)
                current_lines = []
            paragraphs.append([line])
        elif heading_pattern.match(clean_l):
            if current_lines:
                paragraphs.append(current_lines)
                current_lines = []
            paragraphs.append([line])
        elif new_p_pattern.match(clean_l):
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
                elif re.search(r'-(\*\*|</u>|</em>|</b>)$', prev_line):
                    current_lines[-1] = re.sub(r'-(\*\*|</u>|</em>|</b>)$', r'\1', prev_line) + line
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
        p_text = re.sub(r'\*\*\s+\*\*', ' ', p_text)
        p_text = re.sub(r'</u>\s+<u>', ' ', p_text)
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
    with rich markup (bold, underline, tables) and extracting title, subtitle, author, and citation sources.
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

    # Step 1: Collect sequential line streams across all pages and columns with rich text formatting
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
                    col_texts = [extract_rich_text_from_crop(l_crop), extract_rich_text_from_crop(r_crop)]
                except Exception:
                    col_texts = [extract_rich_text_from_crop(p.crop((0, top_m, width, bot_m)))]
            else:
                try:
                    col_texts = [extract_rich_text_from_crop(p.crop((0, top_m, width, bot_m)))]
                except Exception:
                    col_texts = [text]
        else:
            col_texts = [text]

        for col_t in col_texts:
            lines = [sanitize_text_noise(l) for l in col_t.splitlines()]
            valid_lines = [l for l in lines if l and not noise_pattern.match(strip_markup(l))]
            # If the very last line of the column is just the page number (e.g. '2', '4'), filter it out
            if valid_lines and re.match(r'^\d{1,3}$', strip_markup(valid_lines[-1])):
                valid_lines.pop()
            flat_lines.extend(valid_lines)

    # Step 2: Separate passages and questions
    raw_passages: List[List[str]] = []
    current_passage: List[str] = []
    in_passage = False

    for i, line in enumerate(flat_lines):
        clean_l = strip_markup(line)
        is_passage_start = bool(passage_header_pattern.match(clean_l))
        is_q_explicit = bool(q_explicit_pattern.match(clean_l))
        is_q_numbered = False
        m_num = q_pattern_numbered.match(clean_l) or q_pattern_standalone.match(clean_l)
        if m_num and not is_passage_start:
            num_val = int(m_num.group(1))
            if 1 <= num_val <= 200:
                has_alts = any(alt_pattern.match(strip_markup(flat_lines[j])) for j in range(i + 1, min(i + 10, len(flat_lines))))
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
            cand = strip_markup(block[start_idx])
            if re.match(r'^(?:CONHECIMENTOS\s+B[ÁA]SICOS|CONHECIMENTOS\s+ESPEC[ÍI]FICOS)\b', cand, re.I):
                start_idx += 1
            elif re.match(r'^(?:L[ÍI]NGUA\s+PORTUGUESA|L[ÍI]NGUA\s+INGLESA|L[ÍI]NGUA\s+ESPANHOLA|TEXTO\s+[I|V|X|\d]+)\b', cand, re.I):
                section_prefix = cand
                start_idx += 1
            else:
                break

        title_lines = []
        if start_idx < len(block):
            first_cand = strip_markup(block[start_idx])
            if not re.match(r'^\d+\s+[A-ZÀ-Ú]', first_cand) and not re.search(r'(?i)(?:dispon[íi]vel\s+em|available\s+at)', first_cand):
                title_lines.append(first_cand)
                start_idx += 1

                if start_idx < len(block):
                    second_cand = strip_markup(block[start_idx])
                    if (not re.search(r'[\.\!\?]$', first_cand) 
                            and len(second_cand) < 40
                            and not re.search(r'[\,\;\:\-\–\—]$', second_cand)
                            and not re.match(r'^\d+\s+[A-ZÀ-Ú]', second_cand)
                            and not re.match(r'^(?:O|A|Os|As|Um|Uma|De|Em|No|Na|Como|Quando|Se|Mas|E|Por|Para|Hoje|Today|Lobo)\b', second_cand)
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
            cand = strip_markup(block[end_idx - 1])
            if (re.search(r'(?i)(?:dispon[íi]vel\s+em|available\s+at|retrieved\s+on|fragmento\s+adaptado|adaptad[oa]|rio\s+de\s+janeiro|s[ãa]o\s+paulo|ed\.|p\.\s*\d+|\.com|\.org|https?://)', cand) 
                    or re.match(r'^[A-ZÀ-Ú]{2,}(?:,\s+[A-ZÀ-Úa-zà-ú\s\.]+)\.', cand)
                    or re.match(r'^[A-ZÀ-Ú\s,]{4,}\.', cand)):
                citation_lines.insert(0, block[end_idx - 1])
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
            clean_cit = strip_markup(full_citation)
            url_match = re.search(r'(https?://[^\s<>"]+|www\.[^\s<>"]+)', clean_cit)
            if url_match:
                reference = url_match.group(1).rstrip('.,;')
            else:
                m_disp = re.search(r'(?i)dispon[íi]vel\s+em[:\s]+<?([^\s>]+)>?', clean_cit)
                if m_disp:
                    reference = m_disp.group(1).rstrip('.,;')
                else:
                    reference = clean_cit

            m_auth = re.match(r'^([A-ZÀ-Ú]{2,}(?:,\s+[A-ZÀ-Úa-zà-ú\s\.]+))\.\s*(.*)$', clean_cit)
            if not m_auth:
                m_auth = re.match(r'^([A-ZÀ-Ú\s,]{4,}\.)\s*(.*)$', clean_cit)

            if m_auth:
                author = m_auth.group(1).strip()
                source = m_auth.group(2).strip()
            else:
                source = clean_cit

        body_lines = block[start_idx:end_idx]
        caption = ""
        filtered_body: List[str] = []
        for bline in body_lines:
            m_cap = re.match(r'(?i)^(?:legenda|figura\s*\d*|tabela\s*\d*|quadro\s*\d*)[:\.\-\s]+(.+)$', strip_markup(bline))
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
            "source": clean_text(source) or None,
            "reference": clean_text(reference) or None,
            "caption": clean_text(caption) or None,
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

        # Extract questions via unified continuous stream across pages and columns
        noise_pattern = re.compile(
            r'(?i)^(?:pcimarkpci.*|transpetro|enem\s+\d{4}|vestibular|caderno\s+de\s+quest.*|confidencial|www\.pciconcursos.*|terra\s+prova|petro|transp|terra|prova\s*\d+\s*[-–].*|.*(?:analista|t[ée]cnico|engenheiro|m[ée]dico|administrador|advogado|contador|economista|enfermeiro|profissional)\s+.*prova\s*\d+.*)$'
        )
        flat_exam_lines = []
        for p in pdf.pages:
            p_text = decode_symbols(p.extract_text() or "")
            if re.search(r'(?i)LEIA ATENTAMENTE AS INSTRU[ÇC][ÕO]ES', p_text):
                continue

            width, height = getattr(p, 'width', 0), getattr(p, 'height', 0)
            top_m = 35
            bot_m = height - 40
            col_texts = []
            if isinstance(width, (int, float)) and isinstance(height, (int, float)) and width > 0 and height > 0:
                if is_two_column_page(p, width, height):
                    midpoint = width / 2
                    try:
                        col_texts = [
                            extract_rich_text_from_crop(p.crop((0, top_m, midpoint, bot_m))),
                            extract_rich_text_from_crop(p.crop((midpoint, top_m, width, bot_m)))
                        ]
                    except Exception:
                        col_texts = [extract_rich_text_from_crop(p.crop((0, top_m, width, bot_m)))]
                else:
                    try:
                        col_texts = [extract_rich_text_from_crop(p.crop((0, top_m, width, bot_m)))]
                    except Exception:
                        col_texts = [extract_rich_text_from_crop(p)]
            else:
                col_texts = [extract_rich_text_from_crop(p)]

            for c_t in col_texts:
                c_dec = decode_symbols(c_t)
                lines = [sanitize_text_noise(l) for l in c_dec.splitlines()]
                valid = [l for l in lines if l and not noise_pattern.match(l)]
                while valid and re.match(r'^(?:\*\*)?\d{1,3}(?:\*\*)?$', valid[-1]):
                    valid.pop()
                flat_exam_lines.extend(valid)

        clean_exam_lines = []
        for l in flat_exam_lines:
            if re.match(r'(?i)^\(?continua[çc][ãa]o\s+da\s+quest[ãa]o\s*\d+\)?$', l):
                continue
            clean_exam_lines.append(l)

        all_questions = parse_column_text('\n'.join(clean_exam_lines))

    # Deduplicate questions with the same identifier (keep the one with most alternatives / longest enunciado)
    deduped_questions_dict: Dict[str, Any] = {}
    for q in all_questions:
        q_id = q.get("identifier")
        if q_id not in deduped_questions_dict:
            deduped_questions_dict[q_id] = q
        else:
            prev = deduped_questions_dict[q_id]
            if len(q.get("alternatives", [])) > len(prev.get("alternatives", [])) or len(q.get("enunciado", "")) > len(prev.get("enunciado", "")):
                deduped_questions_dict[q_id] = q
    all_questions = list(deduped_questions_dict.values())

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

        # Check for multi-prova text blocks (e.g. PROVA 1 – TÉCNICO..., PROVA 14 – ANALISTA...)
        text_provas: List[Dict[str, Any]] = []
        seen_text_provas = set()
        for page in pdf.pages:
            t = page.extract_text() or ''
            for m in re.finditer(r'(PROVA\s*(\d+)\s*[-–]\s*([^\n]+))', t, re.I):
                p_code = f'PROVA {int(m.group(2))}'
                p_desc = m.group(3).strip()
                p_full = f'{p_code} – {p_desc}'
                if p_code not in seen_text_provas:
                    seen_text_provas.add(p_code)
                    text_provas.append({'id': p_code, 'name': p_full, 'num': int(m.group(2))})

        text_provas.sort(key=lambda x: x['num'])

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

        elif len(text_provas) >= 2:
            available_provas = [{'id': p['id'], 'name': p['name']} for p in text_provas]
            target_num = 1
            if prova_name:
                m_num = re.search(r'\d+', prova_name)
                if m_num:
                    target_num = int(m_num.group(0))
                else:
                    p_norm = normalize_match_str(prova_name)
                    best_n = 1
                    best_s = -1
                    for p in text_provas:
                        score = sum(1 for w in p_norm.split() if w in normalize_match_str(p['name']))
                        if score > best_s:
                            best_s = score
                            best_n = p['num']
                    target_num = best_n

            selected_prova_name = f'PROVA {target_num}'

            # Extract basic questions (1-20)
            for page in pdf.pages:
                t = page.extract_text() or ''
                if 'CONHECIMENTOS BÁSICOS' in t:
                    is_superior = 'Nível Superior' in t or 'Língua Inglesa' in t
                    if (target_num >= 10 and is_superior) or (target_num < 10 and not is_superior):
                        for q_id, ans in re.findall(r'(?:^|\s)([0-9]{1,2})\s*[\-\:\.]\s*([A-Ea-e])\b', t):
                            q_n = int(q_id)
                            if 1 <= q_n <= 20:
                                answers_map[str(q_n)] = ans.upper()

            # Extract specific questions (21-70)
            for page in pdf.pages:
                t = page.extract_text() or ''
                lines = t.splitlines()
                in_target = False
                for line in lines:
                    if f'PROVA {target_num}' in line.upper():
                        in_target = True
                        continue
                    if in_target:
                        if 'PROVA ' in line.upper() or 'CONHECIMENTOS BÁSICOS' in line.upper():
                            break
                        for q_id, ans in re.findall(r'([0-9]{1,2})\s*[\-\:\.]\s*([A-Ea-e]|Anulada|ANULADA|X)\b', line, re.I):
                            q_n = int(q_id)
                            if q_n >= 21:
                                answers_map[str(q_n)] = ans.upper() if len(ans) == 1 else 'X'

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
                                "rows": table[2:]
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
