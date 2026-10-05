import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

import unittest
from parser import parse_exam_pdf, parse_answer_key_pdf

class TestRealPdfExtraction(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        possible_exam_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'analise_de_sistema_seguranca_cibernetica_e_da_informacao.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'analise_de_sistema_seguranca_cibernetica_e_da_informacao.pdf'),
            '/app/prova_pdf/analise_de_sistema_seguranca_cibernetica_e_da_informacao.pdf',
        ]
        possible_key_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'gabarito (1).pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'gabarito (1).pdf'),
            '/app/prova_pdf/gabarito (1).pdf',
        ]

        possible_prova3_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf'),
            '/app/prova_pdf/prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf',
        ]

        possible_gabaritos_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'gabaritos.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'gabaritos.pdf'),
            '/app/prova_pdf/gabaritos.pdf',
        ]

        possible_infra2018_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'analista_de_sistemas_junior_infraestrutura.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'analista_de_sistemas_junior_infraestrutura.pdf'),
            '/app/prova_pdf/analista_de_sistemas_junior_infraestrutura.pdf',
        ]

        possible_gab_definitivo_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'gabarito_definitivo.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'gabarito_definitivo.pdf'),
            '/app/prova_pdf/gabarito_definitivo.pdf',
        ]

        possible_infra_transpetro_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'analise_de_sistema_infraestrutura.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'analise_de_sistema_infraestrutura.pdf'),
            '/app/prova_pdf/analise_de_sistema_infraestrutura.pdf',
        ]

        cls.exam_pdf_path = next((p for p in possible_exam_paths if os.path.exists(p)), None)
        cls.answer_key_pdf_path = next((p for p in possible_key_paths if os.path.exists(p)), None)
        cls.prova3_pdf_path = next((p for p in possible_prova3_paths if os.path.exists(p)), None)
        cls.gabaritos_pdf_path = next((p for p in possible_gabaritos_paths if os.path.exists(p)), None)
        cls.infra2018_pdf_path = next((p for p in possible_infra2018_paths if os.path.exists(p)), None)
        cls.gab_definitivo_pdf_path = next((p for p in possible_gab_definitivo_paths if os.path.exists(p)), None)
        cls.infra_transpetro_pdf_path = next((p for p in possible_infra_transpetro_paths if os.path.exists(p)), None)

        possible_scanned_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'CP-T-2024_INFORMÁTICA_AMARELA.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'CP-T-2024_INFORMÁTICA_AMARELA.pdf'),
            '/app/prova_pdf/CP-T-2024_INFORMÁTICA_AMARELA.pdf',
        ]
        cls.scanned_pdf_path = next((p for p in possible_scanned_paths if os.path.exists(p)), None)

        possible_gab_final_paths = [
            os.path.join(base_dir, 'backend', 'src', 'test', 'prova_pdf', 'GabFinal_CP-T2024.pdf'),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), 'prova_pdf', 'GabFinal_CP-T2024.pdf'),
            '/app/prova_pdf/GabFinal_CP-T2024.pdf',
        ]
        cls.gab_final_pdf_path = next((p for p in possible_gab_final_paths if os.path.exists(p)), None)

        if not cls.exam_pdf_path:
            raise FileNotFoundError(f"Arquivo da prova não encontrado. Procurado em: {possible_exam_paths}")
        if not cls.answer_key_pdf_path:
            raise FileNotFoundError(f"Arquivo do gabarito não encontrado. Procurado em: {possible_key_paths}")

        with open(cls.exam_pdf_path, 'rb') as f:
            cls.exam_bytes = f.read()

        with open(cls.answer_key_pdf_path, 'rb') as f:
            cls.answer_key_bytes = f.read()

        cls.prova3_bytes = None
        if cls.prova3_pdf_path:
            with open(cls.prova3_pdf_path, 'rb') as f:
                cls.prova3_bytes = f.read()

        cls.gabaritos_bytes = None
        if cls.gabaritos_pdf_path:
            with open(cls.gabaritos_pdf_path, 'rb') as f:
                cls.gabaritos_bytes = f.read()

        cls.infra2018_bytes = None
        if cls.infra2018_pdf_path:
            with open(cls.infra2018_pdf_path, 'rb') as f:
                cls.infra2018_bytes = f.read()

        cls.gab_definitivo_bytes = None
        if cls.gab_definitivo_pdf_path:
            with open(cls.gab_definitivo_pdf_path, 'rb') as f:
                cls.gab_definitivo_bytes = f.read()

        cls.infra_transpetro_bytes = None
        if cls.infra_transpetro_pdf_path:
            with open(cls.infra_transpetro_pdf_path, 'rb') as f:
                cls.infra_transpetro_bytes = f.read()

        cls.scanned_bytes = None
        if cls.scanned_pdf_path:
            with open(cls.scanned_pdf_path, 'rb') as f:
                cls.scanned_bytes = f.read()

        cls.gab_final_bytes = None
        if cls.gab_final_pdf_path:
            with open(cls.gab_final_pdf_path, 'rb') as f:
                cls.gab_final_bytes = f.read()

    def test_extract_real_exam_pdf(self):
        parsed = parse_exam_pdf(self.exam_bytes)
        questions = parsed["questions"]
        textual_references = parsed["textualReferences"]

        # 1. Total questions count
        self.assertEqual(len(questions), 70, f"Deveriam ser extraídas 70 questões, mas foram extraídas {len(questions)}")

        # 2. Identifiers sequence 1..70
        expected_identifiers = [str(i) for i in range(1, 71)]
        actual_identifiers = [q["identifier"] for q in questions]
        self.assertEqual(actual_identifiers, expected_identifiers, "A sequência de identificadores deve ser de 1 a 70")

        # 3. Check question 1
        q1 = questions[0]
        self.assertEqual(q1["identifier"], "1")
        self.assertTrue(len(q1["enunciado"]) > 20, "O enunciado da questão 1 deve estar preenchido")
        self.assertEqual(len(q1["alternatives"]), 5, "Questão 1 deve ter 5 alternativas (A-E)")
        self.assertEqual([a["identifier"] for a in q1["alternatives"]], ["A", "B", "C", "D", "E"])

        # 4. Check question 5
        q5 = questions[4]
        self.assertEqual(q5["identifier"], "5")
        self.assertIn("soneto à língua portuguesa", q5["enunciado"].lower())
        self.assertEqual(len(q5["alternatives"]), 5)
        self.assertEqual(q5["alternatives"][2]["identifier"], "C")
        self.assertIn("para a língua portuguesa", q5["alternatives"][2]["text"].lower())

        # 5. Check question 70 (last question)
        q70 = questions[69]
        self.assertEqual(q70["identifier"], "70")
        self.assertTrue(len(q70["enunciado"]) > 10)
        self.assertEqual(len(q70["alternatives"]), 5)

        # 6. Verify textual references (multi-column and multi-paragraph extraction)
        self.assertEqual(len(textual_references), 2, "Devem ser extraídas 2 referências textuais completas")

        # Ref 1: Língua Portuguesa (spans across column 1 and column 2)
        ref1 = textual_references[0]
        self.assertIn("LÍNGUA PORTUGUESA", ref1["title"])
        self.assertIn("À moda brasileira", ref1["title"])
        self.assertIn("TELLES, Lygia Fagundes", ref1["author"] or ref1["source"])
        # Check paragraphs from column 1
        self.assertIn("Estou me vendo debaixo de uma árvore", ref1["content"])
        self.assertIn("Olavo Bilac", ref1["content"])
        # Check paragraphs from column 2 (which previously failed due to column separation)
        self.assertIn("Fechei o livro e recuei", ref1["content"])
        self.assertIn("Tantos anos depois, quando me avisaram", ref1["content"])

        # Ref 2: Língua Inglesa (spans across column 1 and column 2)
        ref2 = textual_references[1]
        self.assertIn("LÍNGUA INGLESA", ref2["title"])
        self.assertIn("How space technology is bringing", ref2["title"])
        self.assertIn("cgi.com", ref2["reference"] or ref2["source"])
        # Check paragraphs from column 1
        self.assertIn("Space technology is developing fast", ref2["content"])
        self.assertIn("The benefits of space technology", ref2["content"])
        # Check paragraphs from column 2 (which previously failed due to column separation)
        self.assertIn("Satellite technology will increasingly be a part", ref2["content"])
        self.assertIn("At our company, we have been deeply embedded", ref2["content"])

    def test_extract_real_answer_key_pdf(self):
        answers = parse_answer_key_pdf(self.answer_key_bytes, prova_name="PROVA 5")["answers"]

        # 1. Total answers count
        self.assertEqual(len(answers), 70, f"Deveriam ser extraídas 70 respostas do gabarito, mas foram extraídas {len(answers)}")

        # 2. Convert to dictionary for easy lookup
        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}

        # 3. Conhecimentos Básicos - Língua Portuguesa (1 a 10)
        self.assertEqual(ans_map.get("1"), "E")
        self.assertEqual(ans_map.get("2"), "B")
        self.assertEqual(ans_map.get("3"), "B")
        self.assertEqual(ans_map.get("4"), "A")
        self.assertEqual(ans_map.get("5"), "C")
        self.assertEqual(ans_map.get("6"), "C")
        self.assertEqual(ans_map.get("7"), "D")
        self.assertEqual(ans_map.get("8"), "E")
        self.assertEqual(ans_map.get("9"), "B")
        self.assertEqual(ans_map.get("10"), "A")

        # 4. Conhecimentos Básicos - Língua Inglesa (11 a 20)
        self.assertEqual(ans_map.get("11"), "E")
        self.assertEqual(ans_map.get("14"), "A")
        self.assertEqual(ans_map.get("20"), "C")

        # 5. Conhecimentos Específicos - PROVA 5 (21 a 70)
        self.assertEqual(ans_map.get("21"), "E")
        self.assertEqual(ans_map.get("22"), "A")
        self.assertEqual(ans_map.get("45"), "B")
        self.assertEqual(ans_map.get("46"), "E")
        self.assertEqual(ans_map.get("50"), "A")
        self.assertEqual(ans_map.get("70"), "E")

    def test_match_exam_with_answer_key(self):
        questions = parse_exam_pdf(self.exam_bytes)["questions"]
        answers = parse_answer_key_pdf(self.answer_key_bytes, prova_name="PROVA 5")["answers"]

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}

        # Associate correct alternative with each question
        matched_count = 0
        for q in questions:
            correct_letter = ans_map.get(q["identifier"])
            if correct_letter:
                for alt in q["alternatives"]:
                    if alt["identifier"] == correct_letter:
                        alt["isCorrect"] = True
                        matched_count += 1
                        break

        self.assertEqual(matched_count, 70, "Todas as 70 questões devem ter uma alternativa correta associada")

    def test_extract_scanned_exam_pdf_ocr(self):
        if not self.scanned_bytes:
            self.skipTest("Arquivo escaneado CP-T-2024_INFORMÁTICA_AMARELA.pdf não encontrado")

        parsed = parse_exam_pdf(self.scanned_bytes)
        questions = parsed["questions"]

        # 1. Total questions count
        self.assertEqual(len(questions), 50, f"Deveriam ser extraídas 50 questões via OCR, mas foram extraídas {len(questions)}")

        # 2. Identifiers sequence 1..50
        expected_identifiers = [str(i) for i in range(1, 51)]
        actual_identifiers = [q["identifier"] for q in questions]
        self.assertEqual(actual_identifiers, expected_identifiers, "A sequência de identificadores deve ser de 1 a 50")

        # 3. Check question 1
        q1 = questions[0]
        self.assertEqual(q1["identifier"], "1")
        self.assertIn("MapReduce", q1["enunciado"])
        self.assertEqual(len(q1["alternatives"]), 5, "Questão 1 deve ter 5 alternativas (A-E)")
        self.assertEqual([a["identifier"] for a in q1["alternatives"]], ["A", "B", "C", "D", "E"])

        # 4. Check question 50 (last question)
        q50 = questions[49]
        self.assertEqual(q50["identifier"], "50")
        self.assertTrue(len(q50["enunciado"]) > 10)
        self.assertEqual(len(q50["alternatives"]), 5, "Questão 50 deve ter 5 alternativas (A-E)")

    def test_extract_gab_final_pdf_with_area_and_color(self):
        if not self.gab_final_bytes:
            self.skipTest("Arquivo GabFinal_CP-T2024.pdf não encontrado")

        # 1. Test Informática - AMARELA
        parsed_amarela = parse_answer_key_pdf(self.gab_final_bytes, prova_name="Informática - AMARELA")
        self.assertEqual(len(parsed_amarela["availableProvas"]), 18, "Devem ser identificadas 18 opções (9 áreas x 2 cores)")
        self.assertIn("Informática", parsed_amarela["selectedProva"])
        self.assertIn("AMARELA", parsed_amarela["selectedProva"])

        answers_amarela = parsed_amarela["answers"]
        self.assertEqual(len(answers_amarela), 50, "Devem ser extraídas 50 respostas para Informática AMARELA")
        ans_map_amarela = {a["identifier"]: a["correctAlternative"] for a in answers_amarela}
        self.assertEqual(ans_map_amarela.get("1"), "D")
        self.assertEqual(ans_map_amarela.get("2"), "B")
        self.assertEqual(ans_map_amarela.get("3"), "X") # Anulada
        self.assertEqual(ans_map_amarela.get("4"), "E")
        self.assertEqual(ans_map_amarela.get("5"), "B")
        self.assertEqual(ans_map_amarela.get("50"), "A")

        # 2. Test Informática - AZUL
        parsed_azul = parse_answer_key_pdf(self.gab_final_bytes, prova_name="Informática - AZUL")
        self.assertIn("Informática", parsed_azul["selectedProva"])
        self.assertIn("AZUL", parsed_azul["selectedProva"])
        answers_azul = parsed_azul["answers"]
        self.assertEqual(len(answers_azul), 50)
        ans_map_azul = {a["identifier"]: a["correctAlternative"] for a in answers_azul}
        self.assertEqual(ans_map_azul.get("1"), "A")
        self.assertEqual(ans_map_azul.get("2"), "D")
        self.assertEqual(ans_map_azul.get("3"), "A")
        self.assertEqual(ans_map_azul.get("4"), "B")
        self.assertEqual(ans_map_azul.get("5"), "E")

    def test_match_scanned_exam_with_gab_final(self):
        if not self.scanned_bytes or not self.gab_final_bytes:
            self.skipTest("Arquivos da prova escaneada ou gabarito não encontrados")

        questions = parse_exam_pdf(self.scanned_bytes)["questions"]
        answers = parse_answer_key_pdf(self.gab_final_bytes, prova_name="Informática - AMARELA")["answers"]

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}

        matched_count = 0
        for q in questions:
            correct_letter = ans_map.get(q["identifier"])
            if correct_letter and correct_letter in ('A', 'B', 'C', 'D', 'E'):
                for alt in q["alternatives"]:
                    if alt["identifier"] == correct_letter:
                        alt["isCorrect"] = True
                        matched_count += 1
                        break
            elif correct_letter == 'X':
                # Anulada
                matched_count += 1

        self.assertEqual(matched_count, 50, "Todas as 50 questões da prova escaneada devem ser associadas ao gabarito")

    def test_extract_prova_3_analista_infraestrutura(self):
        if not self.prova3_bytes:
            self.skipTest("Arquivo prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf não encontrado")

        parsed = parse_exam_pdf(self.prova3_bytes)
        questions = parsed["questions"]
        textual_references = parsed["textualReferences"]

        # 1. Total questions count (deve extrair 70 questões completas sem pular 49, 50, 63)
        self.assertEqual(len(questions), 70, f"Deveriam ser extraídas 70 questões, mas foram extraídas {len(questions)}")

        # 2. Identifiers sequence 1..70
        expected_identifiers = [str(i) for i in range(1, 71)]
        actual_identifiers = [q["identifier"] for q in questions]
        self.assertEqual(actual_identifiers, expected_identifiers, "A sequência de identificadores deve ser de 1 a 70")

        # 3. Check Questão 1
        q1 = questions[0]
        self.assertEqual(q1["identifier"], "1")
        self.assertEqual(len(q1["alternatives"]), 5)

        # 4. Check Questões com alternativas inline (49, 50, 63)
        q49 = next(q for q in questions if q["identifier"] == "49")
        self.assertEqual(len(q49["alternatives"]), 5, "Questão 49 deve ter 5 alternativas inline extraídas")
        self.assertEqual(q49["alternatives"][0]["identifier"], "A")
        self.assertIn("M e T", q49["alternatives"][0]["text"])
        self.assertEqual(q49["alternatives"][1]["identifier"], "B")
        self.assertIn("M e I", q49["alternatives"][1]["text"])

        q50 = next(q for q in questions if q["identifier"] == "50")
        self.assertEqual(len(q50["alternatives"]), 5, "Questão 50 deve ter 5 alternativas inline extraídas")
        self.assertEqual(q50["alternatives"][0]["identifier"], "A")
        self.assertIn("42,86", q50["alternatives"][0]["text"])

        q63 = next(q for q in questions if q["identifier"] == "63")
        self.assertEqual(len(q63["alternatives"]), 5, "Questão 63 deve ter 5 alternativas inline extraídas")
        self.assertEqual(q63["alternatives"][0]["identifier"], "A")
        self.assertIn("250", q63["alternatives"][0]["text"])

        # Check Questão 66 com sentenças lógicas (sem interpretar b) como alternativa)
        q66 = next(q for q in questions if q["identifier"] == "66")
        self.assertEqual(len(q66["alternatives"]), 5, "Questão 66 deve ter exatamente 5 alternativas (A-E)")
        self.assertEqual([a["identifier"] for a in q66["alternatives"]], ["A", "B", "C", "D", "E"])
        self.assertIn("¬a", q66["alternatives"][0]["text"])
        self.assertIn("(¬a b) (¬a b)", q66["alternatives"][2]["text"])
        self.assertIn("(¬a b) (a ¬b)", q66["alternatives"][4]["text"])

        # 5. Check referências textuais
        self.assertEqual(len(textual_references), 2, "Devem ser extraídas 2 referências textuais")
        ref1 = textual_references[0]
        self.assertIn("LÍNGUA PORTUGUESA", ref1["title"])
        self.assertIn("Science fiction", ref1["title"])
        self.assertNotIn("O marciano encontrou-me na rua", ref1["title"], "O primeiro verso não deve poluir o título")
        self.assertIn("O marciano encontrou-me na rua", ref1["content"])

        ref2 = textual_references[1]
        self.assertIn("LÍNGUA INGLESA", ref2["title"])
        self.assertIn("Safety Meeting Presentation", ref2["title"])
        self.assertNotIn("Today’s meeting is really about you", ref2["title"], "O início do texto não deve poluir o título")
        self.assertIn("Today’s meeting is really about you", ref2["content"])
        self.assertIn("Concluding Remarks", ref2["content"], "Deve incluir a seção Concluding Remarks")
        self.assertIn("While nothing we do can completely eliminate the", ref2["content"], "Deve incluir a linha 75")
        self.assertIn("Let’s keep communicating and continue to improve safety.", ref2["content"])
        self.assertEqual(ref2["reference"], "http://www.ncsu.edu/ehs/www99/right/training/meeting/emplores.html")
        self.assertIn("Retrieved on: April 1st, 2012", ref2["source"])

    def test_formatting_rich_text_and_code_blocks_prova_3(self):
        if not self.prova3_bytes:
            self.skipTest("Arquivo prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf não encontrado")

        parsed = parse_exam_pdf(self.prova3_bytes)
        q_map = {q["identifier"]: q for q in parsed["questions"]}

        # 1. Bold text preserved in alternatives
        q5 = q_map["5"]
        self.assertIn("**trago**", q5["alternatives"][0]["text"])
        self.assertIn("**suspendido**", q5["alternatives"][1]["text"])

        # 2. Bash Code Block in Q27
        q27 = q_map["27"]
        self.assertIn("```bash", q27["enunciado"])
        self.assertIn("#!/bin/bash", q27["enunciado"])
        self.assertIn("```", q27["enunciado"])

        # 3. Item structures on distinct lines in Q54
        q54 = q_map["54"]
        self.assertIn("I - Computação em grade", q54["enunciado"])
        self.assertIn("II - Computadores de baixo custo", q54["enunciado"])
        self.assertIn("III - É adequado construir", q54["enunciado"])
        self.assertIn("**APENAS**", q54["enunciado"])

        # 4. Java Code Block in Q58
        q58 = q_map["58"]
        self.assertIn("```java", q58["enunciado"])
        self.assertIn("int encontrar(int chaveBusca, int limiteInferior, int limiteSuperior)", q58["enunciado"])

        # 5. XML / DTD Code Block in Q62
        q62 = q_map["62"]
        self.assertIn("```xml", q62["enunciado"])
        self.assertIn("<!ELEMENT livros", q62["enunciado"])

        # 6. Tables and SQL Code Block in Q63
        q63 = q_map["63"]
        self.assertIn("| nome_loja | vendas |", q63["enunciado"])
        self.assertIn("| nome_regiao | nome_loja |", q63["enunciado"])
        self.assertIn("```sql", q63["enunciado"])
        self.assertIn("SELECT SUM( vendas ) FROM Lojas", q63["enunciado"])

        # 7. Non-textual image/diagram extraction in Q35 (network topology) and Q52 (memory partitions)
        q35 = q_map["35"]
        self.assertEqual(len(q35.get("images", [])), 1, "Questão 35 deve conter 1 imagem extraída da topologia de rede")
        self.assertTrue(q35["images"][0].startswith("data:image/png;base64,"), "A imagem deve ser codificada em Base64 Data URL")
        self.assertIn("![Figura](data:image/png;base64,", q35["enunciado"])

        q52 = q_map["52"]
        self.assertGreaterEqual(len(q52.get("images", [])), 1, "Questão 52 deve conter a imagem do diagrama de blocos de memória")
        self.assertTrue(q52["images"][0].startswith("data:image/png;base64,"))
        self.assertIn("![Figura](data:image/png;base64,", q52["enunciado"])

        # 8. Text-aligned Table in Q55 (Job scheduling table)
        q55 = q_map["55"]
        self.assertIn("| Job | Tempo de Execução (ms) | Prioridade |", q55["enunciado"])
        self.assertIn("| J1 | 13 | 4 |", q55["enunciado"])
        self.assertIn("| J5 | 7 | 2 |", q55["enunciado"])

    def test_extract_gabaritos_multi_page_pdf(self):
        if not self.gabaritos_bytes:
            self.skipTest("Arquivo gabaritos.pdf não encontrado")

        parsed = parse_answer_key_pdf(self.gabaritos_bytes, prova_name="PROVA 3")
        answers = parsed["answers"]

        # 1. Total answers count (70 respostas: 1-20 básicos + 21-70 específicos)
        self.assertEqual(len(answers), 70, f"Deveriam ser extraídas 70 respostas do gabarito, mas foram {len(answers)}")
        self.assertEqual(len(parsed["availableProvas"]), 28, "Devem ser detectadas 28 opções de prova no gabarito")
        self.assertEqual(parsed["selectedProva"], "PROVA 3")

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}

        # Conhecimentos Básicos - Português (1 a 10)
        self.assertEqual(ans_map.get("1"), "B")
        self.assertEqual(ans_map.get("2"), "E")
        self.assertEqual(ans_map.get("3"), "C")
        self.assertEqual(ans_map.get("4"), "D")
        self.assertEqual(ans_map.get("5"), "E")
        self.assertEqual(ans_map.get("10"), "A")

        # Conhecimentos Básicos - Inglês (11 a 20)
        self.assertEqual(ans_map.get("11"), "E")
        self.assertEqual(ans_map.get("12"), "D")
        self.assertEqual(ans_map.get("20"), "B")

        # Conhecimentos Específicos - PROVA 3 (21 a 70)
        self.assertEqual(ans_map.get("21"), "E")
        self.assertEqual(ans_map.get("22"), "B")
        self.assertEqual(ans_map.get("40"), "C")
        self.assertEqual(ans_map.get("41"), "C")
        self.assertEqual(ans_map.get("49"), "B")
        self.assertEqual(ans_map.get("50"), "B")
        self.assertEqual(ans_map.get("55"), "C")
        self.assertEqual(ans_map.get("56"), "D")
        self.assertEqual(ans_map.get("70"), "D")

    def test_match_prova_3_with_gabaritos(self):
        if not self.prova3_bytes or not self.gabaritos_bytes:
            self.skipTest("Arquivos da prova 3 ou gabaritos não encontrados")

        questions = parse_exam_pdf(self.prova3_bytes)["questions"]
        answers = parse_answer_key_pdf(self.gabaritos_bytes, prova_name="PROVA 3")["answers"]

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}
        matched_count = 0
        for q in questions:
            correct_letter = ans_map.get(q["identifier"])
            if correct_letter:
                for alt in q["alternatives"]:
                    if alt["identifier"] == correct_letter:
                        alt["isCorrect"] = True
                        matched_count += 1
                        break

        self.assertEqual(matched_count, 70, "Todas as 70 questões da Prova 3 devem ser associadas às respostas do gabarito")

    def test_extract_analista_infraestrutura_2018(self):
        if not self.infra2018_bytes:
            self.skipTest("Arquivo analista_de_sistemas_junior_infraestrutura.pdf não encontrado")

        parsed = parse_exam_pdf(self.infra2018_bytes)
        questions = parsed["questions"]

        # 1. Total questions count (70)
        self.assertEqual(len(questions), 70, f"Deveriam ser extraídas 70 questões, mas foram extraídas {len(questions)}")

        # 2. Identifiers sequence 1..70
        expected_identifiers = [str(i) for i in range(1, 71)]
        actual_identifiers = [q["identifier"] for q in questions]
        self.assertEqual(actual_identifiers, expected_identifiers, "A sequência de identificadores deve ser de 1 a 70")

        # 3. Check Questão 31 com proposições lógicas decodificadas
        q31 = next(q for q in questions if q["identifier"] == "31")
        self.assertIn("p∧¬(q∧r)", q31["enunciado"].replace(" ", ""), "Enunciado da Q31 deve conter proposição lógica decodificada")
        self.assertEqual(len(q31["alternatives"]), 5, "Questão 31 deve ter 5 alternativas")
        self.assertEqual([a["identifier"] for a in q31["alternatives"]], ["A", "B", "C", "D", "E"])
        self.assertIn("(p∧¬q)∨(p∧¬r)", q31["alternatives"][2]["text"].replace(" ", ""), "Alternativa C deve ter fórmula lógica limpa")

        # 4. Check Questão 64 (Modelo E-R / CREATE TABLE contínuo entre páginas 14 e 15)
        q64 = next(q for q in questions if q["identifier"] == "64")
        self.assertIn("CREATE TABLE", q64["enunciado"])
        self.assertIn("Qual modelo E-R serviu de base", q64["enunciado"])
        self.assertEqual(len(q64["alternatives"]), 5, "Questão 64 deve ter 5 alternativas")

    def test_extract_gabarito_definitivo_prova_14(self):
        if not self.gab_definitivo_bytes:
            self.skipTest("Arquivo gabarito_definitivo.pdf não encontrado")

        parsed = parse_answer_key_pdf(self.gab_definitivo_bytes, prova_name="PROVA 14")
        answers = parsed["answers"]

        # 1. Total answers count (70 respostas: 1-20 básicos + 21-70 específicos)
        self.assertEqual(len(answers), 70, f"Deveriam ser extraídas 70 respostas do gabarito, mas foram {len(answers)}")
        self.assertEqual(len(parsed["availableProvas"]), 32, "Devem ser detectadas 32 opções de prova no gabarito definitivo")
        self.assertEqual(parsed["selectedProva"], "PROVA 14")

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}

        # Conhecimentos Básicos - Português (1 a 10)
        self.assertEqual(ans_map.get("1"), "A")
        self.assertEqual(ans_map.get("2"), "A")
        self.assertEqual(ans_map.get("3"), "B")
        self.assertEqual(ans_map.get("4"), "D")
        self.assertEqual(ans_map.get("5"), "E")
        self.assertEqual(ans_map.get("10"), "C")

        # Conhecimentos Básicos - Inglês (11 a 20)
        self.assertEqual(ans_map.get("11"), "B")
        self.assertEqual(ans_map.get("12"), "E")
        self.assertEqual(ans_map.get("20"), "A")

        # Conhecimentos Específicos - PROVA 14 (21 a 70)
        self.assertEqual(ans_map.get("21"), "D")
        self.assertEqual(ans_map.get("22"), "B")
        self.assertEqual(ans_map.get("31"), "C")
        self.assertEqual(ans_map.get("41"), "A")
        self.assertEqual(ans_map.get("51"), "B")
        self.assertEqual(ans_map.get("61"), "D")
        self.assertEqual(ans_map.get("64"), "D")
        self.assertEqual(ans_map.get("70"), "B")

    def test_match_analista_infraestrutura_with_gabarito_definitivo(self):
        if not self.infra2018_bytes or not self.gab_definitivo_bytes:
            self.skipTest("Arquivos da prova de infraestrutura ou gabarito definitivo não encontrados")

        questions = parse_exam_pdf(self.infra2018_bytes)["questions"]
        answers = parse_answer_key_pdf(self.gab_definitivo_bytes, prova_name="PROVA 14")["answers"]

        ans_map = {a["identifier"]: a["correctAlternative"] for a in answers}
        matched_count = 0
        for q in questions:
            correct_letter = ans_map.get(q["identifier"])
            if correct_letter:
                for alt in q["alternatives"]:
                    if alt["identifier"] == correct_letter:
                        alt["isCorrect"] = True
                        matched_count += 1
                        break

        self.assertEqual(matched_count, 70, "Todas as 70 questões da prova de infraestrutura 2018 devem ser associadas ao gabarito definitivo")

    def test_extract_analise_de_sistema_infraestrutura_pdf(self):
        if not self.infra_transpetro_bytes:
            self.skipTest("Arquivo analise_de_sistema_infraestrutura.pdf não encontrado")

        parsed = parse_exam_pdf(self.infra_transpetro_bytes)
        questions = parsed["questions"]
        textual_references = parsed["textualReferences"]

        # 1. Total questions count
        self.assertEqual(len(questions), 70, f"Deveriam ser extraídas 70 questões, mas foram extraídas {len(questions)}")

        # 2. Identifiers sequence 1..70
        expected_identifiers = [str(i) for i in range(1, 71)]
        actual_identifiers = [q["identifier"] for q in questions]
        self.assertEqual(actual_identifiers, expected_identifiers, "A sequência de identificadores deve ser de 1 a 70")

        # 3. Check Questão 10 (Língua Portuguesa)
        q10 = next(q for q in questions if q["identifier"] == "10")
        self.assertIn("severidade", q10["enunciado"].lower())
        self.assertEqual(len(q10["alternatives"]), 5)
        self.assertEqual(q10["alternatives"][4]["identifier"], "E")
        self.assertEqual(q10["alternatives"][4]["text"], "incompreensão")

        # 4. Check Questão 11 (Língua Inglesa)
        q11 = next(q for q in questions if q["identifier"] == "11")
        self.assertIn("The main idea of the text", q11["enunciado"])
        self.assertEqual(len(q11["alternatives"]), 5)
        self.assertEqual(q11["alternatives"][0]["identifier"], "A")
        self.assertIn("disapprove space technology", q11["alternatives"][0]["text"])

        # 5. Check Questão 24 (Java inverte function)
        q24 = next(q for q in questions if q["identifier"] == "24")
        self.assertIn("inverta", q24["enunciado"].lower())
        self.assertEqual(len(q24["alternatives"]), 5)
        for alt in q24["alternatives"]:
            self.assertIn("inverte", alt["text"])

        # 6. Check Questão 25 (SQL CREATE TABLE 2FN)
        q25 = next(q for q in questions if q["identifier"] == "25")
        self.assertIn("modelo E-R", q25["enunciado"])
        self.assertEqual(len(q25["alternatives"]), 5)
        for alt in q25["alternatives"]:
            self.assertIn("CREATE TABLE", alt["text"])

        # 7. Check Questão 63 (SQL WITH RECURSIVE)
        q63 = next(q for q in questions if q["identifier"] == "63")
        self.assertIn("HIERARQUIA", q63["enunciado"])
        self.assertEqual(len(q63["alternatives"]), 5)

        # 8. Check Questão 66 (Gráfico ciclo de vida)
        q66 = next(q for q in questions if q["identifier"] == "66")
        self.assertIn("ciclo de vida de um projeto", q66["enunciado"])
        self.assertEqual(len(q66["alternatives"]), 5)

        # 9. Verify 2 textual references
        self.assertEqual(len(textual_references), 2)
        self.assertIn("LÍNGUA PORTUGUESA", textual_references[0]["title"])
        self.assertIn("LÍNGUA INGLESA", textual_references[1]["title"])

if __name__ == '__main__':
    unittest.main()
