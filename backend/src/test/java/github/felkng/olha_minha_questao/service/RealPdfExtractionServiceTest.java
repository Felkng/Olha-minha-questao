package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyDTO;
import github.felkng.olha_minha_questao.dto.parser.ParsedQuestionDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestEvaluationDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestWithQuestionsRequestDTO;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class RealPdfExtractionServiceTest {

    @Autowired
    private ExamParserService examParserService;

    @Autowired
    private TestService testService;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve extrair prova e gabarito reais de src/test/prova_pdf e persistir prova completa com 70 questões")
    void testRealPdfExtractionAndAtomicPersistence() throws Exception {
        Path examPath = Path.of("src", "test", "prova_pdf", "analise_de_sistema_seguranca_cibernetica_e_da_informacao.pdf");
        Path keyPath = Path.of("src", "test", "prova_pdf", "gabarito (1).pdf");

        assertThat(Files.exists(examPath))
                .as("Arquivo da prova deve existir em " + examPath.toAbsolutePath())
                .isTrue();
        assertThat(Files.exists(keyPath))
                .as("Arquivo do gabarito deve existir em " + keyPath.toAbsolutePath())
                .isTrue();

        MockMultipartFile examMultipart = new MockMultipartFile(
                "file",
                "analise_de_sistema_seguranca_cibernetica_e_da_informacao.pdf",
                "application/pdf",
                Files.readAllBytes(examPath)
        );

        MockMultipartFile keyMultipart = new MockMultipartFile(
                "file",
                "gabarito (1).pdf",
                "application/pdf",
                Files.readAllBytes(keyPath)
        );

        // 1. Extração das questões e referências textuais do PDF da prova via Worker
        github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO examResponse = examParserService.parseExamPdf(examMultipart);
        List<ParsedQuestionDTO> parsedQuestions = examResponse.getQuestions();
        assertThat(parsedQuestions).hasSize(70);
        assertThat(examResponse.getTextualReferences()).hasSize(2);
        assertThat(examResponse.getTextualReferences().get(0).getTitle()).contains("À moda brasileira");
        assertThat(examResponse.getTextualReferences().get(1).getTitle()).contains("How space technology");

        ParsedQuestionDTO q1 = parsedQuestions.get(0);
        assertThat(q1.getIdentifier()).isEqualTo("1");
        assertThat(q1.getAlternatives()).hasSize(5);

        ParsedQuestionDTO q5 = parsedQuestions.get(4);
        assertThat(q5.getIdentifier()).isEqualTo("5");
        assertThat(q5.getAlternatives()).hasSize(5);

        ParsedQuestionDTO q70 = parsedQuestions.get(69);
        assertThat(q70.getIdentifier()).isEqualTo("70");
        assertThat(q70.getAlternatives()).hasSize(5);

        // 2. Extração do gabarito oficial com filtro PROVA 5 via Worker
        github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO keyResponse = examParserService.parseAnswerKeyPdf(keyMultipart, "PROVA 5");
        List<ParsedAnswerKeyDTO> parsedAnswers = keyResponse.getAnswers();
        assertThat(parsedAnswers).hasSize(70);
        assertThat(keyResponse.getAvailableProvas()).hasSize(28);
        assertThat(keyResponse.getSelectedProva()).contains("PROVA 5");

        Map<String, String> answerMap = parsedAnswers.stream()
                .collect(Collectors.toMap(ParsedAnswerKeyDTO::getIdentifier, ParsedAnswerKeyDTO::getCorrectAlternative));

        assertThat(answerMap.get("1")).isEqualTo("E");
        assertThat(answerMap.get("2")).isEqualTo("B");
        assertThat(answerMap.get("5")).isEqualTo("C");
        assertThat(answerMap.get("20")).isEqualTo("C");
        assertThat(answerMap.get("21")).isEqualTo("E");
        assertThat(answerMap.get("70")).isEqualTo("E");

        // 3. Montagem do DTO para criação atômica no Wizard com referências textuais
        List<github.felkng.olha_minha_questao.dto.reference.TextualReferenceRequestDTO> refRequests = examResponse.getTextualReferences().stream()
                .map(r -> github.felkng.olha_minha_questao.dto.reference.TextualReferenceRequestDTO.builder()
                        .title(r.getTitle())
                        .content(r.getContent())
                        .author(r.getAuthor())
                        .source(r.getSource())
                        .build())
                .toList();

        List<QuestionRequestDTO> questionRequests = new ArrayList<>();
        for (int i = 0; i < parsedQuestions.size(); i++) {
            ParsedQuestionDTO pq = parsedQuestions.get(i);
            String correctLetter = answerMap.get(pq.getIdentifier());

            // Manual assignment as requested: questions 1-10 to ref 0, 11-20 to ref 1
            Integer refIdx = null;
            int qNum = Integer.parseInt(pq.getIdentifier());
            if (qNum >= 1 && qNum <= 10) refIdx = 0;
            else if (qNum >= 11 && qNum <= 20) refIdx = 1;

            List<AlternativeRequestDTO> altRequests = pq.getAlternatives().stream()
                    .map(alt -> AlternativeRequestDTO.builder()
                            .identifier(alt.getIdentifier())
                            .text(alt.getText())
                            .isCorrect(alt.getIdentifier().equalsIgnoreCase(correctLetter))
                            .build())
                    .toList();

            questionRequests.add(QuestionRequestDTO.builder()
                    .identifier(pq.getIdentifier())
                    .enunciado(pq.getEnunciado())
                    .year(2023)
                    .textualReferenceIndex(refIdx)
                    .alternatives(altRequests)
                    .build());
        }

        TestWithQuestionsRequestDTO wizardRequest = TestWithQuestionsRequestDTO.builder()
                .name("Transpetro 2023.2 - Segurança Cibernética")
                .year(2023)
                .description("Prova extraída automaticamente de PDF com pdfplumber")
                .textualReferences(refRequests)
                .questions(questionRequests)
                .build();

        // 4. Criação atômica da prova e questões no banco
        TestResponseDTO createdTest = testService.createWithQuestions(wizardRequest, null);
        entityManager.flush();

        assertThat(createdTest.getId()).isNotNull();
        assertThat(createdTest.getName()).isEqualTo("Transpetro 2023.2 - Segurança Cibernética");
        assertThat(createdTest.getTextualReferences()).hasSize(2);

        List<Question> savedDbQuestions = questionRepository.findByTestIdOrderByIdAsc(createdTest.getId());
        assertThat(savedDbQuestions).hasSize(70);

        // Questão 1 associada ao Texto 1 (Português)
        assertThat(savedDbQuestions.get(0).getTextualReference()).isNotNull();
        assertThat(savedDbQuestions.get(0).getTextualReference().getTitle()).contains("À moda brasileira");

        // Questão 11 associada ao Texto 2 (Inglês)
        assertThat(savedDbQuestions.get(10).getTextualReference()).isNotNull();
        assertThat(savedDbQuestions.get(10).getTextualReference().getTitle()).contains("How space technology");

        // Questão 21 sem referência textual (Conhecimentos Específicos)
        assertThat(savedDbQuestions.get(20).getTextualReference()).isNull();

        Question q1Entity = savedDbQuestions.get(0);
        assertThat(q1Entity.getCorrectAlternative()).isNotNull();
        assertThat(q1Entity.getCorrectAlternative().getIdentifier()).isEqualTo("E");

        Question q70Entity = savedDbQuestions.get(69);
        assertThat(q70Entity.getCorrectAlternative()).isNotNull();
        assertThat(q70Entity.getCorrectAlternative().getIdentifier()).isEqualTo("E");

        // 5. Validação da prova cadastrada com todas as 70 questões
        TestEvaluationDTO evaluation = testService.getTestEvaluation(createdTest.getId());
        assertThat(evaluation.getQuestionCount()).isEqualTo(70);
        assertThat(evaluation.getQuestions()).hasSize(70);

        var firstQuestion = evaluation.getQuestions().get(0);
        assertThat(firstQuestion.getIdentifier()).isEqualTo("1");
        assertThat(firstQuestion.getCorrectAlternativeIdentifier()).isEqualTo("E");

        var fifthQuestion = evaluation.getQuestions().get(4);
        assertThat(fifthQuestion.getIdentifier()).isEqualTo("5");
        assertThat(fifthQuestion.getCorrectAlternativeIdentifier()).isEqualTo("C");

        var twentyFirstQuestion = evaluation.getQuestions().get(20);
        assertThat(twentyFirstQuestion.getIdentifier()).isEqualTo("21");
        assertThat(twentyFirstQuestion.getCorrectAlternativeIdentifier()).isEqualTo("E");

        var lastQuestion = evaluation.getQuestions().get(69);
        assertThat(lastQuestion.getIdentifier()).isEqualTo("70");
        assertThat(lastQuestion.getCorrectAlternativeIdentifier()).isEqualTo("E");
    }

    @Test
    @DisplayName("Deve extrair prova escaneada em imagem (CP-T-2024_INFORMÁTICA_AMARELA.pdf) via OCR pelo Worker")
    void testScannedExamPdfOcrExtraction() throws Exception {
        Path scannedExamPath = Path.of("src", "test", "prova_pdf", "CP-T-2024_INFORMÁTICA_AMARELA.pdf");
        assertThat(Files.exists(scannedExamPath))
                .as("Arquivo da prova escaneada deve existir em " + scannedExamPath.toAbsolutePath())
                .isTrue();

        MockMultipartFile examMultipart = new MockMultipartFile(
                "file",
                "CP-T-2024_INFORMÁTICA_AMARELA.pdf",
                "application/pdf",
                Files.readAllBytes(scannedExamPath)
        );

        github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO examResponse = examParserService.parseExamPdf(examMultipart);
        List<ParsedQuestionDTO> parsedQuestions = examResponse.getQuestions();
        assertThat(parsedQuestions).hasSize(50);

        ParsedQuestionDTO q1 = parsedQuestions.get(0);
        assertThat(q1.getIdentifier()).isEqualTo("1");
        assertThat(q1.getEnunciado()).contains("MapReduce");
        assertThat(q1.getAlternatives()).hasSize(5);

        ParsedQuestionDTO q50 = parsedQuestions.get(49);
        assertThat(q50.getIdentifier()).isEqualTo("50");
        assertThat(q50.getAlternatives()).hasSize(5);
    }

    @Test
    @DisplayName("Deve extrair gabarito com múltiplas áreas e cores (GabFinal_CP-T2024.pdf) e filtrar por Informática - AMARELA")
    void testGabFinalExtractionWithAreaAndColorSelection() throws Exception {
        Path keyPath = Path.of("src", "test", "prova_pdf", "GabFinal_CP-T2024.pdf");
        assertThat(Files.exists(keyPath))
                .as("Arquivo do gabarito deve existir em " + keyPath.toAbsolutePath())
                .isTrue();

        MockMultipartFile keyMultipart = new MockMultipartFile(
                "file",
                "GabFinal_CP-T2024.pdf",
                "application/pdf",
                Files.readAllBytes(keyPath)
        );

        github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO keyResponse =
                examParserService.parseAnswerKeyPdf(keyMultipart, "Informática - AMARELA");

        assertThat(keyResponse.getAvailableProvas()).hasSize(18);
        assertThat(keyResponse.getSelectedProva()).contains("Informática").contains("AMARELA");

        List<ParsedAnswerKeyDTO> parsedAnswers = keyResponse.getAnswers();
        assertThat(parsedAnswers).hasSize(50);

        Map<String, String> answerMap = parsedAnswers.stream()
                .collect(Collectors.toMap(ParsedAnswerKeyDTO::getIdentifier, ParsedAnswerKeyDTO::getCorrectAlternative));

        assertThat(answerMap.get("1")).isEqualTo("D");
        assertThat(answerMap.get("2")).isEqualTo("B");
        assertThat(answerMap.get("3")).isEqualTo("X"); // Anulada
        assertThat(answerMap.get("4")).isEqualTo("E");
        assertThat(answerMap.get("5")).isEqualTo("B");
        assertThat(answerMap.get("50")).isEqualTo("A");
    }

    @Test
    @DisplayName("Deve extrair Prova 3 Infraestrutura e gabaritos.pdf (multi-página com cabeçalho vertical) e persistir atomicamente com 70 questões")
    void testRealPdfExtractionAndAtomicPersistenceProva3Infraestrutura() throws Exception {
        Path examPath = Path.of("src", "test", "prova_pdf", "prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf");
        Path keyPath = Path.of("src", "test", "prova_pdf", "gabaritos.pdf");

        assertThat(Files.exists(examPath))
                .as("Arquivo da prova deve existir em " + examPath.toAbsolutePath())
                .isTrue();
        assertThat(Files.exists(keyPath))
                .as("Arquivo do gabarito deve existir em " + keyPath.toAbsolutePath())
                .isTrue();

        MockMultipartFile examMultipart = new MockMultipartFile(
                "file",
                "prova_3_analista_de_sistemas_jnior_area_infraestrutura.pdf",
                "application/pdf",
                Files.readAllBytes(examPath)
        );

        MockMultipartFile keyMultipart = new MockMultipartFile(
                "file",
                "gabaritos.pdf",
                "application/pdf",
                Files.readAllBytes(keyPath)
        );

        // 1. Extração das questões e referências textuais
        github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO examResponse = examParserService.parseExamPdf(examMultipart);
        List<ParsedQuestionDTO> parsedQuestions = examResponse.getQuestions();
        assertThat(parsedQuestions).hasSize(70);
        assertThat(examResponse.getTextualReferences()).hasSize(2);

        // Verifica referências textuais sem poluição de título
        assertThat(examResponse.getTextualReferences().get(0).getTitle()).contains("Science fiction");
        assertThat(examResponse.getTextualReferences().get(0).getContent()).contains("O marciano encontrou-me na rua");
        assertThat(examResponse.getTextualReferences().get(1).getTitle()).contains("Safety Meeting Presentation");
        assertThat(examResponse.getTextualReferences().get(1).getContent()).contains("Today’s meeting is really about you");

        // Verifica questões com alternativas inline
        ParsedQuestionDTO q49 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("49")).findFirst().orElseThrow();
        assertThat(q49.getAlternatives()).hasSize(5);

        ParsedQuestionDTO q50 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("50")).findFirst().orElseThrow();
        assertThat(q50.getAlternatives()).hasSize(5);

        // Verifica formatação rica, blocos de código e tabelas na Prova 3
        ParsedQuestionDTO q5 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("5")).findFirst().orElseThrow();
        assertThat(q5.getAlternatives().get(0).getText()).contains("**trago**");

        ParsedQuestionDTO q27 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("27")).findFirst().orElseThrow();
        assertThat(q27.getEnunciado()).contains("```bash").contains("#!/bin/bash");

        ParsedQuestionDTO q54 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("54")).findFirst().orElseThrow();
        assertThat(q54.getEnunciado()).contains("I - Computação em grade").contains("II - Computadores").contains("**APENAS**");

        ParsedQuestionDTO q58 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("58")).findFirst().orElseThrow();
        assertThat(q58.getEnunciado()).contains("```java");

        ParsedQuestionDTO q62 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("62")).findFirst().orElseThrow();
        assertThat(q62.getEnunciado()).contains("```xml").contains("<!ELEMENT livros");

        ParsedQuestionDTO q63 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("63")).findFirst().orElseThrow();
        assertThat(q63.getAlternatives()).hasSize(5);
        assertThat(q63.getEnunciado()).contains("| nome_loja | vendas |").contains("```sql");

        ParsedQuestionDTO q35 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("35")).findFirst().orElseThrow();
        assertThat(q35.getImages()).hasSize(1);
        assertThat(q35.getImages().get(0)).startsWith("data:image/png;base64,");

        ParsedQuestionDTO q52 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("52")).findFirst().orElseThrow();
        assertThat(q52.getImages()).isNotEmpty();
        assertThat(q52.getImages().get(0)).startsWith("data:image/png;base64,");
        assertThat(q52.getEnunciado()).contains("![Figura](data:image/png;base64,");

        ParsedQuestionDTO q55 = parsedQuestions.stream().filter(q -> q.getIdentifier().equals("55")).findFirst().orElseThrow();
        assertThat(q55.getEnunciado()).contains("| Job | Tempo de Execução (ms) | Prioridade |")
                .contains("| J1 | 13 | 4 |")
                .contains("| J5 | 7 | 2 |");

        // 2. Extração do gabarito multi-página com PROVA 3
        github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO keyResponse = examParserService.parseAnswerKeyPdf(keyMultipart, "PROVA 3");
        List<ParsedAnswerKeyDTO> parsedAnswers = keyResponse.getAnswers();
        assertThat(parsedAnswers).hasSize(70);
        assertThat(keyResponse.getAvailableProvas()).hasSize(28);
        assertThat(keyResponse.getSelectedProva()).isEqualTo("PROVA 3");

        Map<String, String> answerMap = parsedAnswers.stream()
                .collect(Collectors.toMap(ParsedAnswerKeyDTO::getIdentifier, ParsedAnswerKeyDTO::getCorrectAlternative));

        assertThat(answerMap.get("1")).isEqualTo("B");
        assertThat(answerMap.get("2")).isEqualTo("E");
        assertThat(answerMap.get("11")).isEqualTo("E");
        assertThat(answerMap.get("20")).isEqualTo("B");
        assertThat(answerMap.get("21")).isEqualTo("E");
        assertThat(answerMap.get("40")).isEqualTo("C");
        assertThat(answerMap.get("49")).isEqualTo("B");
        assertThat(answerMap.get("50")).isEqualTo("B");
        assertThat(answerMap.get("70")).isEqualTo("D");

        // 3. Montagem do DTO para criação atômica
        List<github.felkng.olha_minha_questao.dto.reference.TextualReferenceRequestDTO> refRequests = examResponse.getTextualReferences().stream()
                .map(r -> github.felkng.olha_minha_questao.dto.reference.TextualReferenceRequestDTO.builder()
                        .title(r.getTitle())
                        .content(r.getContent())
                        .author(r.getAuthor())
                        .source(r.getSource())
                        .build())
                .toList();

        List<QuestionRequestDTO> questionRequests = new ArrayList<>();
        for (ParsedQuestionDTO pq : parsedQuestions) {
            String correctLetter = answerMap.get(pq.getIdentifier());
            int qNum = Integer.parseInt(pq.getIdentifier());
            Integer refIdx = null;
            if (qNum >= 1 && qNum <= 10) refIdx = 0;
            else if (qNum >= 11 && qNum <= 20) refIdx = 1;

            List<AlternativeRequestDTO> altRequests = pq.getAlternatives().stream()
                    .map(alt -> AlternativeRequestDTO.builder()
                            .identifier(alt.getIdentifier())
                            .text(alt.getText())
                            .isCorrect(alt.getIdentifier().equalsIgnoreCase(correctLetter))
                            .build())
                    .toList();

            questionRequests.add(QuestionRequestDTO.builder()
                    .identifier(pq.getIdentifier())
                    .enunciado(pq.getEnunciado())
                    .year(2012)
                    .textualReferenceIndex(refIdx)
                    .alternatives(altRequests)
                    .images(pq.getImages())
                    .build());
        }

        TestWithQuestionsRequestDTO wizardRequest = TestWithQuestionsRequestDTO.builder()
                .name("Transpetro 2012 - Analista de Sistemas Júnior Área Infraestrutura")
                .year(2012)
                .description("Prova extraída de PDF single-column e gabarito multi-página")
                .textualReferences(refRequests)
                .questions(questionRequests)
                .build();

        // 4. Criação atômica no banco de dados
        TestResponseDTO createdTest = testService.createWithQuestions(wizardRequest, null);
        entityManager.flush();

        assertThat(createdTest.getId()).isNotNull();
        assertThat(createdTest.getName()).isEqualTo("Transpetro 2012 - Analista de Sistemas Júnior Área Infraestrutura");
        assertThat(createdTest.getTextualReferences()).hasSize(2);

        List<Question> savedDbQuestions = questionRepository.findByTestIdOrderByIdAsc(createdTest.getId());
        assertThat(savedDbQuestions).hasSize(70);

        Question q35Entity = savedDbQuestions.stream().filter(q -> "35".equals(q.getIdentifier())).findFirst().orElseThrow();
        assertThat(q35Entity.getImages()).hasSize(1);

        Question q1Entity = savedDbQuestions.get(0);
        assertThat(q1Entity.getCorrectAlternative()).isNotNull();
        assertThat(q1Entity.getCorrectAlternative().getIdentifier()).isEqualTo("B");

        Question q70Entity = savedDbQuestions.get(69);
        assertThat(q70Entity.getCorrectAlternative()).isNotNull();
        assertThat(q70Entity.getCorrectAlternative().getIdentifier()).isEqualTo("D");

        // 5. Validação da prova cadastrada
        TestEvaluationDTO evaluation = testService.getTestEvaluation(createdTest.getId());
        assertThat(evaluation.getQuestionCount()).isEqualTo(70);
        assertThat(evaluation.getQuestions()).hasSize(70);
    }

    @Test
    @DisplayName("Deve extrair analista_de_sistemas_junior_infraestrutura.pdf e gabarito_definitivo.pdf, decodificando símbolos lógicos e persistindo com 70 questões")
    void testRealPdfExtractionAndAtomicPersistenceAnalistaInfraestrutura2018() throws Exception {
        Path examPath = Path.of("src", "test", "prova_pdf", "analista_de_sistemas_junior_infraestrutura.pdf");
        Path keyPath = Path.of("src", "test", "prova_pdf", "gabarito_definitivo.pdf");

        assertThat(Files.exists(examPath)).as("Arquivo da prova 2018 deve existir").isTrue();
        assertThat(Files.exists(keyPath)).as("Arquivo do gabarito definitivo deve existir").isTrue();

        MockMultipartFile examMultipart = new MockMultipartFile(
                "file",
                "analista_de_sistemas_junior_infraestrutura.pdf",
                "application/pdf",
                Files.readAllBytes(examPath)
        );

        MockMultipartFile keyMultipart = new MockMultipartFile(
                "file",
                "gabarito_definitivo.pdf",
                "application/pdf",
                Files.readAllBytes(keyPath)
        );

        // 1. Extração da prova
        github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO examResponse = examParserService.parseExamPdf(examMultipart);
        List<ParsedQuestionDTO> parsedQuestions = examResponse.getQuestions();
        assertThat(parsedQuestions).hasSize(70);

        // Verificar Questão 31 com símbolos lógicos decodificados
        ParsedQuestionDTO q31 = parsedQuestions.stream()
                .filter(q -> "31".equals(q.getIdentifier()))
                .findFirst()
                .orElseThrow();
        assertThat(q31.getEnunciado().replace(" ", "")).contains("p∧¬(q∧r)");
        assertThat(q31.getAlternatives()).hasSize(5);

        // 2. Extração do gabarito definitivo para PROVA 14
        github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO keyResponse = examParserService.parseAnswerKeyPdf(keyMultipart, "PROVA 14");
        assertThat(keyResponse.getSelectedProva()).isEqualTo("PROVA 14");
        assertThat(keyResponse.getAvailableProvas()).hasSize(32);
        assertThat(keyResponse.getAnswers()).hasSize(70);

        Map<String, String> answerMap = keyResponse.getAnswers().stream()
                .collect(Collectors.toMap(ParsedAnswerKeyDTO::getIdentifier, ParsedAnswerKeyDTO::getCorrectAlternative));

        assertThat(answerMap.get("1")).isEqualTo("A");
        assertThat(answerMap.get("11")).isEqualTo("B");
        assertThat(answerMap.get("21")).isEqualTo("D");
        assertThat(answerMap.get("31")).isEqualTo("C");
        assertThat(answerMap.get("70")).isEqualTo("B");

        // 3. Montagem do payload de criação
        List<QuestionRequestDTO> questionRequests = new ArrayList<>();
        for (ParsedQuestionDTO pq : parsedQuestions) {
            String correctLetter = answerMap.get(pq.getIdentifier());

            List<AlternativeRequestDTO> altRequests = pq.getAlternatives().stream()
                    .map(alt -> AlternativeRequestDTO.builder()
                            .identifier(alt.getIdentifier())
                            .text(alt.getText())
                            .isCorrect(alt.getIdentifier().equalsIgnoreCase(correctLetter))
                            .build())
                    .toList();

            questionRequests.add(QuestionRequestDTO.builder()
                    .identifier(pq.getIdentifier())
                    .enunciado(pq.getEnunciado())
                    .year(2018)
                    .alternatives(altRequests)
                    .build());
        }

        TestWithQuestionsRequestDTO wizardRequest = TestWithQuestionsRequestDTO.builder()
                .name("Transpetro 2018 - Analista de Sistemas Júnior Infraestrutura")
                .year(2018)
                .description("Prova com símbolos lógicos e gabarito definitivo")
                .questions(questionRequests)
                .build();

        // 4. Criação atômica no banco de dados
        TestResponseDTO createdTest = testService.createWithQuestions(wizardRequest, null);
        entityManager.flush();

        assertThat(createdTest.getId()).isNotNull();
        List<Question> savedDbQuestions = questionRepository.findByTestIdOrderByIdAsc(createdTest.getId());
        assertThat(savedDbQuestions).hasSize(70);

        // 5. Validação da prova cadastrada
        TestEvaluationDTO evaluation = testService.getTestEvaluation(createdTest.getId());
        assertThat(evaluation.getQuestionCount()).isEqualTo(70);
        assertThat(evaluation.getQuestions()).hasSize(70);
    }
}


