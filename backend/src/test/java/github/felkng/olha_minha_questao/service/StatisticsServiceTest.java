package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class StatisticsServiceTest {

    @Autowired
    private StatisticsService statisticsService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private TestService testService;

    @Autowired
    private github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;

    @Autowired
    private github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository questionAttemptRepository;

    @Autowired
    private github.felkng.olha_minha_questao.domain.repository.TestAttemptRepository testAttemptRepository;

    private OriginResponseDTO testOrigin;
    private AreaResponseDTO testArea;
    private TestResponseDTO testEntity;

    @BeforeEach
    void setUp() {
        testOrigin = originService.create(OriginRequestDTO.builder().name("STAT_ORIGIN_TEST").build());
        testArea = areaService.create(AreaRequestDTO.builder().name("STAT_AREA_TEST").build());
        testEntity = testService.create(TestRequestDTO.builder()
                .name("STAT_TEST_EXAM")
                .year(2024)
                .originId(testOrigin.getId())
                .areaId(testArea.getId())
                .build());
    }

    private QuestionResponseDTO createQuestionWithTwoAlternatives() {
        return questionService.create(QuestionRequestDTO.builder()
                .enunciado("Qual a velocidade da luz?")
                .year(2024)
                .originId(testOrigin.getId())
                .areaId(testArea.getId())
                .testId(testEntity.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("300.000 km/s").isCorrect(true).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("150.000 km/s").isCorrect(false).build()
                ))
                .build());
    }

    @Test
    @DisplayName("Deve classificar questão como FACIL quando taxa de acerto >= 80%")
    void testQuestionAttemptEasyClassification() {
        QuestionResponseDTO q = createQuestionWithTwoAlternatives();
        Long correctAltId = q.getCorrectAlternativeId();
        Long wrongAltId = q.getAlternatives().stream()
                .filter(a -> !a.getId().equals(correctAltId))
                .findFirst().get().getId();

        // 4 acertos e 1 erro = 80% de acerto na 1ª tentativa
        for (int i = 0; i < 4; i++) {
            statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                    .selectedAlternativeId(correctAltId)
                    .isFirstAttempt(true)
                    .sessionId("session-easy-" + i)
                    .build());
        }

        QuestionAttemptResponseDTO lastAttempt = statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(wrongAltId)
                .isFirstAttempt(true)
                .sessionId("session-easy-wrong")
                .build());

        assertThat(lastAttempt.getAccuracyPercentage()).isEqualTo(80.0);
        assertThat(lastAttempt.getDifficultyLevel()).isEqualTo(DifficultyLevel.FACIL);
        assertThat(lastAttempt.getTotalAttempts()).isEqualTo(5L);
    }

    @Test
    @DisplayName("Deve classificar questão como MEDIA quando taxa de acerto está entre 50% e 79.9%")
    void testQuestionAttemptMediumClassification() {
        QuestionResponseDTO q = createQuestionWithTwoAlternatives();
        Long correctAltId = q.getCorrectAlternativeId();
        Long wrongAltId = q.getAlternatives().stream()
                .filter(a -> !a.getId().equals(correctAltId))
                .findFirst().get().getId();

        // 2 acertos e 1 erro = 66.67% de acerto
        statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(correctAltId)
                .isFirstAttempt(true)
                .sessionId("session-med-1")
                .build());
        statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(correctAltId)
                .isFirstAttempt(true)
                .sessionId("session-med-2")
                .build());

        QuestionAttemptResponseDTO lastAttempt = statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(wrongAltId)
                .isFirstAttempt(true)
                .sessionId("session-med-3")
                .build());

        assertThat(lastAttempt.getAccuracyPercentage()).isGreaterThanOrEqualTo(50.0);
        assertThat(lastAttempt.getAccuracyPercentage()).isLessThan(80.0);
        assertThat(lastAttempt.getDifficultyLevel()).isEqualTo(DifficultyLevel.MEDIA);
    }

    @Test
    @DisplayName("Deve classificar questão como DIFICIL quando taxa de acerto < 50%")
    void testQuestionAttemptHardClassification() {
        QuestionResponseDTO q = createQuestionWithTwoAlternatives();
        Long correctAltId = q.getCorrectAlternativeId();
        Long wrongAltId = q.getAlternatives().stream()
                .filter(a -> !a.getId().equals(correctAltId))
                .findFirst().get().getId();

        // 1 acerto e 2 erros = 33.33% de acerto
        statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(correctAltId)
                .isFirstAttempt(true)
                .sessionId("session-hard-1")
                .build());
        statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(wrongAltId)
                .isFirstAttempt(true)
                .sessionId("session-hard-2")
                .build());

        QuestionAttemptResponseDTO lastAttempt = statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(wrongAltId)
                .isFirstAttempt(true)
                .sessionId("session-hard-3")
                .build());

        assertThat(lastAttempt.getAccuracyPercentage()).isLessThan(50.0);
        assertThat(lastAttempt.getDifficultyLevel()).isEqualTo(DifficultyLevel.DIFICIL);
    }

    @Test
    @DisplayName("Tentativas subsequentes (não primeira) não devem afetar a taxa de acerto de primeira tentativa")
    void testSubsequentAttemptsDoNotAffectFirstAttemptAccuracy() {
        QuestionResponseDTO q = createQuestionWithTwoAlternatives();
        Long correctAltId = q.getCorrectAlternativeId();
        Long wrongAltId = q.getAlternatives().stream()
                .filter(a -> !a.getId().equals(correctAltId))
                .findFirst().get().getId();

        // 1ª tentativa: acerto -> 100% (FACIL)
        QuestionAttemptResponseDTO firstAttempt = statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(correctAltId)
                .isFirstAttempt(true)
                .sessionId("session-user-1")
                .build());
        assertThat(firstAttempt.getAccuracyPercentage()).isEqualTo(100.0);
        assertThat(firstAttempt.getDifficultyLevel()).isEqualTo(DifficultyLevel.FACIL);

        // 2ª tentativa do mesmo usuário: erro (não é primeira tentativa)
        QuestionAttemptResponseDTO secondAttempt = statisticsService.registerQuestionAttempt(q.getId(), QuestionAttemptRequestDTO.builder()
                .selectedAlternativeId(wrongAltId)
                .isFirstAttempt(false)
                .sessionId("session-user-1")
                .build());

        assertThat(secondAttempt.getAccuracyPercentage()).isEqualTo(100.0);
        assertThat(secondAttempt.getDifficultyLevel()).isEqualTo(DifficultyLevel.FACIL);
        assertThat(secondAttempt.getTotalAttempts()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Deve submeter avaliação de prova e calcular estatísticas corretamente")
    void testSubmitTestAttempt() {
        QuestionResponseDTO q1 = createQuestionWithTwoAlternatives();
        QuestionResponseDTO q2 = createQuestionWithTwoAlternatives();

        TestSubmissionRequestDTO request = TestSubmissionRequestDTO.builder()
                .sessionId("test-eval-session-1")
                .timeSpentSeconds(120)
                .answers(List.of(
                        TestSubmissionRequestDTO.QuestionAnswerDTO.builder()
                                .questionId(q1.getId())
                                .selectedAlternativeId(q1.getCorrectAlternativeId())
                                .timeSpentSeconds(60)
                                .build(),
                        TestSubmissionRequestDTO.QuestionAnswerDTO.builder()
                                .questionId(q2.getId())
                                .selectedAlternativeId(q2.getAlternatives().stream()
                                        .filter(a -> !a.getId().equals(q2.getCorrectAlternativeId()))
                                        .findFirst().get().getId())
                                .timeSpentSeconds(60)
                                .build()
                ))
                .build();

        TestSubmissionResponseDTO response = statisticsService.submitTestAttempt(testEntity.getId(), request);

        assertThat(response.getTotalQuestions()).isEqualTo(2);
        assertThat(response.getCorrectAnswers()).isEqualTo(1);
        assertThat(response.getScorePercentage()).isEqualTo(50.0);
        assertThat(response.getDifficultyLevel()).isEqualTo(DifficultyLevel.MEDIA);
        assertThat(response.getDetailedResults()).hasSize(2);
    }

    @Test
    @DisplayName("Deve associar userId à TestAttempt e QuestionAttempts, e não criar QuestionAttempt para questões não respondidas")
    void testSubmitTestAttemptWithUserIdAndPartialAnswers() {
        github.felkng.olha_minha_questao.domain.entity.User user = userRepository.save(
                github.felkng.olha_minha_questao.domain.entity.User.builder()
                        .name("Test User Statistics")
                        .email("stat_user_" + System.currentTimeMillis() + "@test.com")
                        .passwordHash("hashed")
                        .role(github.felkng.olha_minha_questao.domain.entity.UserRole.GENERAL)
                        .build()
        );

        QuestionResponseDTO q1 = createQuestionWithTwoAlternatives();
        QuestionResponseDTO q2 = createQuestionWithTwoAlternatives();

        // O usuário responde apenas a q1 (acertando), deixando q2 em branco
        TestSubmissionRequestDTO request = TestSubmissionRequestDTO.builder()
                .sessionId("test-eval-session-user")
                .userId(user.getId())
                .timeSpentSeconds(90)
                .answers(List.of(
                        TestSubmissionRequestDTO.QuestionAnswerDTO.builder()
                                .questionId(q1.getId())
                                .selectedAlternativeId(q1.getCorrectAlternativeId())
                                .timeSpentSeconds(45)
                                .build()
                        // q2 não está na lista de respostas (em branco)
                ))
                .build();

        TestSubmissionResponseDTO response = statisticsService.submitTestAttempt(testEntity.getId(), request, user.getId());

        // Total 2 questões na prova, 1 correta, 50% de acerto no exame
        assertThat(response.getTotalQuestions()).isEqualTo(2);
        assertThat(response.getCorrectAnswers()).isEqualTo(1);
        assertThat(response.getScorePercentage()).isEqualTo(50.0);
        assertThat(response.getDetailedResults()).hasSize(2);

        // Verifica que TestAttempt foi salva com o usuário correto
        List<github.felkng.olha_minha_questao.domain.entity.TestAttempt> testAttempts = testAttemptRepository.findByUserId(user.getId());
        assertThat(testAttempts).hasSize(1);
        assertThat(testAttempts.get(0).getUser().getId()).isEqualTo(user.getId());
        assertThat(testAttempts.get(0).getCorrectAnswers()).isEqualTo(1);

        // Verifica que APENAS q1 gerou QuestionAttempt (q2 deixada em branco NÃO gerou tentativa phantom)
        List<github.felkng.olha_minha_questao.domain.entity.QuestionAttempt> userAttempts = questionAttemptRepository.findByUserId(user.getId());
        assertThat(userAttempts).hasSize(1);
        assertThat(userAttempts.get(0).getQuestion().getId()).isEqualTo(q1.getId());
        assertThat(userAttempts.get(0).getUser().getId()).isEqualTo(user.getId());
        assertThat(userAttempts.get(0).getIsCorrect()).isTrue();
    }
}
