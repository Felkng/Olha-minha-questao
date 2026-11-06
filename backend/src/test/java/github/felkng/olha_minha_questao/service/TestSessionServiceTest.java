package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestAttemptDetailDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestSessionItemDTO;
import github.felkng.olha_minha_questao.dto.test.TestSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class TestSessionServiceTest {

    @Autowired
    private TestSessionService testSessionService;

    @Autowired
    private TestService testService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private StatisticsService statisticsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private org.springframework.web.context.WebApplicationContext webApplicationContext;

    private User student;
    private User otherUser;
    private User adminUser;
    private OriginResponseDTO origin;
    private AreaResponseDTO area;
    private TestResponseDTO testExam;
    private QuestionResponseDTO q1;
    private QuestionResponseDTO q2;
    private QuestionResponseDTO qLinked;

    @BeforeEach
    void setUp() {
        long suffix = System.nanoTime();
        student = userRepository.save(User.builder()
                .name("Student Simulado")
                .email("student_sim_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.GENERAL)
                .build());

        otherUser = userRepository.save(User.builder()
                .name("Other Simulado")
                .email("other_sim_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.GENERAL)
                .build());

        adminUser = userRepository.save(User.builder()
                .name("Admin Simulado")
                .email("admin_sim_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .build());

        origin = originService.create(OriginRequestDTO.builder().name("CESGRANRIO_TS_" + suffix).build());
        area = areaService.create(AreaRequestDTO.builder().name("TI_TS_" + suffix).build());

        testExam = testService.create(TestRequestDTO.builder()
                .name("Simulado Transpetro " + suffix)
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .build(), adminUser.getId());

        List<AlternativeRequestDTO> alts = List.of(
                AlternativeRequestDTO.builder().identifier("A").text("Correta").isCorrect(true).build(),
                AlternativeRequestDTO.builder().identifier("B").text("Incorreta").isCorrect(false).build()
        );

        q1 = questionService.create(QuestionRequestDTO.builder()
                .identifier("1")
                .enunciado("Questão 1 direta na prova")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .testId(testExam.getId())
                .alternatives(alts)
                .build(), adminUser.getId());

        q2 = questionService.create(QuestionRequestDTO.builder()
                .identifier("2")
                .enunciado("Questão 2 direta na prova")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .testId(testExam.getId())
                .alternatives(alts)
                .build(), adminUser.getId());

        // Questão avulsa vinculada via N:N (test_question)
        qLinked = questionService.create(QuestionRequestDTO.builder()
                .identifier("3")
                .enunciado("Questão 3 vinculada via N:N")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .alternatives(alts)
                .build(), adminUser.getId());
        testService.addQuestionToTest(testExam.getId(), qLinked.getId());

        entityManager.flush();
    }

    @Test
    @DisplayName("Deve criar sessão de simulado, evitar duplicatas ativas, atualizar progresso/timer e retomar com sucesso")
    void shouldCreatePreventDuplicateUpdateAndResumeSession() {
        assertThat(testSessionService.getActiveSession(testExam.getId(), null)).isEmpty();
        assertThat(testSessionService.getActiveSession(testExam.getId(), student.getId())).isEmpty();

        // 1. Cria nova sessão
        var createdResult = testSessionService.createOrUpdateSession(
                testExam.getId(),
                TestSessionRequestDTO.builder()
                        .timerMinutes(180)
                        .timeSpentSeconds(0)
                        .activeQuestionIndex(0)
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(createdResult.isCreated()).isTrue();
        TestSessionResponseDTO created = createdResult.getResponse();
        assertThat(created.getId()).isNotNull();
        assertThat(created.getTestId()).isEqualTo(testExam.getId());
        assertThat(created.getTotalQuestions()).isEqualTo(3);
        assertThat(created.getQuestionIds()).containsExactly(q1.getId(), q2.getId(), qLinked.getId());
        assertThat(created.getTimerMinutes()).isEqualTo(180);
        assertThat(created.getCompleted()).isFalse();
        assertThat(created.getAnsweredCount()).isEqualTo(0);

        // 2. Chamar POST novamente enquanto incompleta atualiza a mesma sessão ao invés de criar órfã duplicada
        var secondPostResult = testSessionService.createOrUpdateSession(
                testExam.getId(),
                TestSessionRequestDTO.builder()
                        .timerMinutes(120)
                        .timeSpentSeconds(45)
                        .activeQuestionIndex(1)
                        .items(List.of(
                                TestSessionItemDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1.getCorrectAlternativeId())
                                        .timeSpentSeconds(45)
                                        .build()
                        ))
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(secondPostResult.isCreated()).isFalse();
        assertThat(secondPostResult.getResponse().getId()).isEqualTo(created.getId());
        assertThat(secondPostResult.getResponse().getTimerMinutes()).isEqualTo(120);
        assertThat(secondPostResult.getResponse().getAnsweredCount()).isEqualTo(1);

        // 3. Busca sessão ativa (GET /active)
        Optional<TestSessionResponseDTO> activeOpt = testSessionService.getActiveSession(testExam.getId(), student.getId());
        assertThat(activeOpt).isPresent();
        assertThat(activeOpt.get().getId()).isEqualTo(created.getId());
        assertThat(activeOpt.get().getActiveQuestionIndex()).isEqualTo(1);
        assertThat(activeOpt.get().getItems()).hasSize(1);

        // 4. Atualiza via PUT substituindo itens (testa orphanRemoval e flush sem ObjectOptimisticLockingFailureException)
        TestSessionResponseDTO updated = testSessionService.updateSession(
                created.getId(),
                TestSessionRequestDTO.builder()
                        .timeSpentSeconds(130)
                        .activeQuestionIndex(2)
                        .items(List.of(
                                TestSessionItemDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1.getCorrectAlternativeId())
                                        .timeSpentSeconds(60)
                                        .build(),
                                TestSessionItemDTO.builder()
                                        .questionId(q2.getId())
                                        .selectedAlternativeId(q2.getCorrectAlternativeId())
                                        .timeSpentSeconds(70)
                                        .build()
                        ))
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(updated.getTimeSpentSeconds()).isEqualTo(130);
        assertThat(updated.getActiveQuestionIndex()).isEqualTo(2);
        assertThat(updated.getAnsweredCount()).isEqualTo(2);
        assertThat(updated.getItems()).hasSize(2);

        // 5. Retoma por ID (dono e ADMIN conseguem, outro usuário comum recebe 403 FORBIDDEN)
        TestSessionResponseDTO resumedByOwner = testSessionService.getSessionById(created.getId(), student.getId());
        assertThat(resumedByOwner.getAnsweredCount()).isEqualTo(2);

        TestSessionResponseDTO resumedByAdmin = testSessionService.getSessionById(created.getId(), adminUser.getId());
        assertThat(resumedByAdmin.getId()).isEqualTo(created.getId());

        assertThatThrownBy(() -> testSessionService.getSessionById(created.getId(), otherUser.getId()))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> testSessionService.updateSession(created.getId(), new TestSessionRequestDTO(), otherUser.getId()))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("Submeter simulado deve contar questões N:N e auto-concluir a TestSession ativa vinculando testAttemptId")
    void shouldAutoCompleteSessionAndCountLinkedQuestionsOnSubmitTestAttempt() {
        var created = testSessionService.createOrUpdateSession(
                testExam.getId(),
                TestSessionRequestDTO.builder()
                        .timerMinutes(90)
                        .timeSpentSeconds(50)
                        .items(List.of(
                                TestSessionItemDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1.getCorrectAlternativeId())
                                        .timeSpentSeconds(50)
                                        .build()
                        ))
                        .build(),
                student.getId()
        ).getResponse();
        entityManager.flush();

        // Submete prova respondendo q1 e qLinked corretamente (2 de 3 questões)
        TestSubmissionResponseDTO submission = statisticsService.submitTestAttempt(
                testExam.getId(),
                TestSubmissionRequestDTO.builder()
                        .userId(student.getId())
                        .sessionId("sim-submit-1")
                        .testSessionId(created.getId())
                        .timeSpentSeconds(320)
                        .answers(List.of(
                                TestSubmissionRequestDTO.QuestionAnswerDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1.getCorrectAlternativeId())
                                        .timeSpentSeconds(100)
                                        .build(),
                                TestSubmissionRequestDTO.QuestionAnswerDTO.builder()
                                        .questionId(qLinked.getId())
                                        .selectedAlternativeId(qLinked.getCorrectAlternativeId())
                                        .timeSpentSeconds(220)
                                        .build()
                        ))
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        // Todas as 3 questões (2 diretas + 1 N:N em test_question) foram contabilizadas!
        assertThat(submission.getTotalQuestions()).isEqualTo(3);
        assertThat(submission.getCorrectAnswers()).isEqualTo(2);
        assertThat(submission.getDetailedResults()).hasSize(3);

        // Sessão foi auto-concluída e vinculada à TestAttempt
        assertThat(testSessionService.getActiveSession(testExam.getId(), student.getId())).isEmpty();

        TestSessionResponseDTO completedSession = testSessionService.getSessionById(created.getId(), student.getId());
        assertThat(completedSession.getCompleted()).isTrue();
        assertThat(completedSession.getTimeSpentSeconds()).isEqualTo(320);
        assertThat(completedSession.getTestAttemptId()).isNotNull();

        // Detalhe da tentativa também traz todas as 3 questões (incluindo N:N)
        TestAttemptDetailDTO detail = statisticsService.getTestAttemptDetail(completedSession.getTestAttemptId());
        assertThat(detail.getDetailedResults()).hasSize(3);
    }

    @Test
    @DisplayName("Deve listar sessões do usuário ordenadas por updatedAt DESC e excluir sessão com validação de posse")
    void shouldListUserSessionsAndDeleteSession() {
        TestSessionResponseDTO s1 = testSessionService.createOrUpdateSession(
                testExam.getId(),
                TestSessionRequestDTO.builder().completed(true).timeSpentSeconds(100).build(),
                student.getId()
        ).getResponse();
        entityManager.flush();

        TestSessionResponseDTO s2 = testSessionService.createOrUpdateSession(
                testExam.getId(),
                TestSessionRequestDTO.builder().completed(false).timeSpentSeconds(30).build(),
                student.getId()
        ).getResponse();
        entityManager.flush();

        List<TestSessionResponseDTO> mySessions = testSessionService.getUserSessions(student.getId());
        assertThat(mySessions).hasSize(2);
        assertThat(mySessions.get(0).getId()).isEqualTo(s2.getId());
        assertThat(mySessions.get(1).getId()).isEqualTo(s1.getId());

        // Outro usuário não pode deletar
        assertThatThrownBy(() -> testSessionService.deleteSession(s2.getId(), otherUser.getId()))
                .isInstanceOf(ResponseStatusException.class);

        // Dono pode deletar
        testSessionService.deleteSession(s2.getId(), student.getId());
        entityManager.flush();

        assertThatThrownBy(() -> testSessionService.getSessionById(s2.getId(), student.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve rotear endpoints HTTP de sessões de simulado e questões sem conflitar com /{id} e desserializar DTOs do parser")
    void shouldRouteSessionEndpointsCleanlyAndDeserializeParserDtos() throws Exception {
        var mockMvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .build();

        // 1. GET /api/v1/tests/{id}/sessions/active sem sessão -> 204 No Content
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/tests/" + testExam.getId() + "/sessions/active")
                        .header("X-User-Id", student.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isNoContent());

        // 2. POST /api/v1/tests/{id}/sessions -> 201 Created
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/tests/" + testExam.getId() + "/sessions")
                        .header("X-User-Id", student.getId())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"timerMinutes\":60,\"timeSpentSeconds\":10,\"activeQuestionIndex\":0}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.timerMinutes").value(60));

        // 3. GET /api/v1/tests/sessions/my não conflita com GET /api/v1/tests/{id}
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/tests/sessions/my")
                        .header("X-User-Id", student.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.length()").value(1));

        // 4. POST & GET /api/v1/questions/sessions/my não conflitam com GET /api/v1/questions/{id}
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/v1/questions/sessions")
                        .header("X-User-Id", student.getId())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Lista HTTP\",\"questionIds\":[" + q1.getId() + "],\"completed\":false}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.title").value("Lista HTTP"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/v1/questions/sessions/my")
                        .header("X-User-Id", student.getId()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.length()").value(1));

        // 5. Desserialização resiliente dos DTOs do parser (incluindo campos novos e ignorando desconhecidos)
        var jsonMapper = tools.jackson.databind.json.JsonMapper.builder().build();
        String examJson = """
                {
                  "detectedTitle": "BNDES 2009",
                  "unknownWorkerField": "ignored",
                  "duplicateGroups": [
                    {"identifier": "1", "count": 2, "sections": ["Língua Inglesa", "Língua Espanhola"], "extra": true}
                  ],
                  "questions": [
                    {
                      "identifier": "1",
                      "enunciado": "Read the text...",
                      "section": "Língua Inglesa",
                      "textualReferenceIndex": 0,
                      "isDuplicate": true,
                      "alternatives": [{"identifier": "A", "text": "Opt A"}]
                    }
                  ]
                }
                """;
        var parsedExam = jsonMapper.readValue(examJson, github.felkng.olha_minha_questao.dto.parser.ParsedExamResponseDTO.class);
        assertThat(parsedExam.getDuplicateGroups()).hasSize(1);
        assertThat(parsedExam.getDuplicateGroups().get(0).getIdentifier()).isEqualTo("1");
        assertThat(parsedExam.getDuplicateGroups().get(0).getCount()).isEqualTo(2);
        assertThat(parsedExam.getDuplicateGroups().get(0).getSections()).containsExactly("Língua Inglesa", "Língua Espanhola");
        assertThat(parsedExam.getQuestions().get(0).getSection()).isEqualTo("Língua Inglesa");
        assertThat(parsedExam.getQuestions().get(0).getTextualReferenceIndex()).isEqualTo(0);
        assertThat(parsedExam.getQuestions().get(0).getIsDuplicate()).isTrue();

        String keyJson = """
                {
                  "selectedProva": "PROVA 1",
                  "answers": [{"identifier": "1", "correctAlternative": "A"}],
                  "sectionAnswers": {
                    "Inglês": [{"identifier": "1", "correctAlternative": "A"}],
                    "Espanhol": [{"identifier": "1", "correctAlternative": "C"}]
                  }
                }
                """;
        var parsedKey = jsonMapper.readValue(keyJson, github.felkng.olha_minha_questao.dto.parser.ParsedAnswerKeyResponseDTO.class);
        assertThat(parsedKey.getSectionAnswers()).containsKeys("Inglês", "Espanhol");
        assertThat(parsedKey.getSectionAnswers().get("Espanhol").get(0).getCorrectAlternative()).isEqualTo("C");
    }
}
