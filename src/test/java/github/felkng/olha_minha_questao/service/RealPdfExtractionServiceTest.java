package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyDTO;
import github.felkng.olha_minha_questao.dto.parser.ParsedQuestionDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestEvaluationDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestWithQuestionsRequestDTO;
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

        // 1. Extração das questões do PDF da prova via Worker
        List<ParsedQuestionDTO> parsedQuestions = examParserService.parseExamPdf(examMultipart);
        assertThat(parsedQuestions).hasSize(70);

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
        List<ParsedAnswerKeyDTO> parsedAnswers = examParserService.parseAnswerKeyPdf(keyMultipart, "PROVA 5");
        assertThat(parsedAnswers).hasSize(70);

        Map<String, String> answerMap = parsedAnswers.stream()
                .collect(Collectors.toMap(ParsedAnswerKeyDTO::getIdentifier, ParsedAnswerKeyDTO::getCorrectAlternative));

        assertThat(answerMap.get("1")).isEqualTo("E");
        assertThat(answerMap.get("2")).isEqualTo("B");
        assertThat(answerMap.get("5")).isEqualTo("C");
        assertThat(answerMap.get("20")).isEqualTo("C");
        assertThat(answerMap.get("21")).isEqualTo("E");
        assertThat(answerMap.get("70")).isEqualTo("E");

        // 3. Montagem do DTO para criação atômica no Wizard
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
                    .year(2023)
                    .alternatives(altRequests)
                    .build());
        }

        TestWithQuestionsRequestDTO wizardRequest = TestWithQuestionsRequestDTO.builder()
                .name("Transpetro 2023.2 - Segurança Cibernética")
                .year(2023)
                .description("Prova extraída automaticamente de PDF com pdfplumber")
                .questions(questionRequests)
                .build();

        // 4. Criação atômica da prova e questões no banco
        TestResponseDTO createdTest = testService.createWithQuestions(wizardRequest, null);
        entityManager.flush();

        assertThat(createdTest.getId()).isNotNull();
        assertThat(createdTest.getName()).isEqualTo("Transpetro 2023.2 - Segurança Cibernética");

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
}
