import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
import unittest
from unittest.mock import MagicMock
import parser

class TestPdfParser(unittest.TestCase):

    def test_clean_text(self):
        raw = "  Texto   com     muitos   espaços \n\n\n\n e linhas   "
        expected = "Texto com muitos espaços \n\n e linhas"
        self.assertEqual(parser.clean_text(raw), expected)

    def test_parse_exam_pdf_logic(self):
        # Mock pdfplumber open and page
        sample_page_text = """
        VESTIBULAR 2024 - CADERNO AZUL
        QUESTÃO 1
        Qual é a capital do Brasil?
        A) São Paulo
        B) Rio de Janeiro
        C) Brasília
        D) Salvador
        E) Curitiba

        QUESTÃO 02:
        Resolva a equação 2x + 4 = 10. O valor de x é:
        A) 1
        B) 2
        C) 3
        D) 4
        E) 5
        """
        mock_page = MagicMock()
        mock_page.extract_words.return_value = []
        mock_page.extract_text.return_value = sample_page_text

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]

        # Patch pdfplumber.open
        original_open = parser.pdfplumber.open
        try:
            parser.pdfplumber.open = MagicMock(return_value=mock_pdf)
            mock_pdf.__enter__.return_value = mock_pdf

            questions = parser.parse_exam_pdf(b"dummy pdf bytes")
            self.assertEqual(len(questions), 2)

            q1 = questions[0]
            self.assertEqual(q1["identifier"], "1")
            self.assertIn("capital do Brasil", q1["enunciado"])
            self.assertEqual(len(q1["alternatives"]), 5)
            self.assertEqual(q1["alternatives"][2]["identifier"], "C")
            self.assertEqual(q1["alternatives"][2]["text"], "Brasília")

            q2 = questions[1]
            self.assertEqual(q2["identifier"], "2")
            self.assertIn("Resolva a equação", q2["enunciado"])
            self.assertEqual(len(q2["alternatives"]), 5)
            self.assertEqual(q2["alternatives"][2]["identifier"], "C")
            self.assertEqual(q2["alternatives"][2]["text"], "3")
        finally:
            parser.pdfplumber.open = original_open

    def test_parse_answer_key_logic(self):
        sample_key_text = """
        GABARITO OFICIAL
        1 - C
        2 - C
        3: A
        4. E
        Questão 5: B
        """
        mock_page = MagicMock()
        mock_page.extract_tables.return_value = []
        mock_page.extract_text.return_value = sample_key_text

        mock_pdf = MagicMock()
        mock_pdf.pages = [mock_page]

        original_open = parser.pdfplumber.open
        try:
            parser.pdfplumber.open = MagicMock(return_value=mock_pdf)
            mock_pdf.__enter__.return_value = mock_pdf

            answers = parser.parse_answer_key_pdf(b"dummy bytes")
            self.assertEqual(len(answers), 5)
            self.assertEqual(answers[0], {"identifier": "1", "correctAlternative": "C"})
            self.assertEqual(answers[1], {"identifier": "2", "correctAlternative": "C"})
            self.assertEqual(answers[2], {"identifier": "3", "correctAlternative": "A"})
            self.assertEqual(answers[3], {"identifier": "4", "correctAlternative": "E"})
            self.assertEqual(answers[4], {"identifier": "5", "correctAlternative": "B"})
        finally:
            parser.pdfplumber.open = original_open

if __name__ == '__main__':
    unittest.main()
