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

        cls.exam_pdf_path = next((p for p in possible_exam_paths if os.path.exists(p)), None)
        cls.answer_key_pdf_path = next((p for p in possible_key_paths if os.path.exists(p)), None)

        if not cls.exam_pdf_path:
            raise FileNotFoundError(f"Arquivo da prova não encontrado. Procurado em: {possible_exam_paths}")
        if not cls.answer_key_pdf_path:
            raise FileNotFoundError(f"Arquivo do gabarito não encontrado. Procurado em: {possible_key_paths}")

        with open(cls.exam_pdf_path, 'rb') as f:
            cls.exam_bytes = f.read()

        with open(cls.answer_key_pdf_path, 'rb') as f:
            cls.answer_key_bytes = f.read()

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

if __name__ == '__main__':
    unittest.main()
