package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.FolderType;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionItemDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionResponseDTO;
import github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO;
import github.felkng.olha_minha_questao.dto.subject.SubjectResponseDTO;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

@SpringBootTest
@Transactional
class QuestionSessionServiceTest {

    @Autowired
    private QuestionSessionService questionSessionService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private SubjectService subjectService;

    @Autowired
    private FolderService folderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    private User student;
    private User otherUser;
    private User adminUser;
    private OriginResponseDTO origin;
    private AreaResponseDTO area;
    private SubjectResponseDTO subject;
    private FolderResponseDTO folder;
    private QuestionResponseDTO q1;
    private QuestionResponseDTO q2;
    private QuestionResponseDTO q3;

    @BeforeEach
    void setUp() {
        long suffix = System.nanoTime();
        student = userRepository.save(User.builder()
                .name("Student Questions")
                .email("student_qs_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.GENERAL)
                .build());

        otherUser = userRepository.save(User.builder()
                .name("Other Questions")
                .email("other_qs_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.GENERAL)
                .build());

        adminUser = userRepository.save(User.builder()
                .name("Admin Questions")
                .email("admin_qs_" + suffix + "@test.com")
                .passwordHash("hash")
                .role(UserRole.ADMIN)
                .build());

        origin = originService.create(OriginRequestDTO.builder().name("FGV_QSESS_" + suffix).build());
        area = areaService.create(AreaRequestDTO.builder().name("Computação_QSESS_" + suffix).build());
        subject = subjectService.create(SubjectRequestDTO.builder()
                .name("Redes_QSESS_" + suffix)
                .areaId(area.getId())
                .build());
        folder = folderService.create(FolderRequestDTO.builder()
                .name("Caderno Redes")
                .folderType(FolderType.QUESTION)
                .color("#3b82f6")
                .build(), student.getId());

        List<AlternativeRequestDTO> alts = List.of(
                AlternativeRequestDTO.builder().identifier("A").text("Alternativa A Correta").isCorrect(true).build(),
                AlternativeRequestDTO.builder().identifier("B").text("Alternativa B Errada").isCorrect(false).build()
        );

        q1 = questionService.create(QuestionRequestDTO.builder()
                .identifier("Q1")
                .enunciado("Enunciado Redes 1")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subject.getId())
                .alternatives(alts)
                .build(), adminUser.getId());

        q2 = questionService.create(QuestionRequestDTO.builder()
                .identifier("Q2")
                .enunciado("Enunciado Redes 2")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subject.getId())
                .alternatives(alts)
                .build(), adminUser.getId());

        q3 = questionService.create(QuestionRequestDTO.builder()
                .identifier("Q3")
                .enunciado("Enunciado Redes 3")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subject.getId())
                .alternatives(alts)
                .build(), adminUser.getId());

        entityManager.flush();
    }

    @Test
    @DisplayName("Deve iniciar sessão com 0 itens, atualizar com CORRECT/WRONG/SKIPPED, retomar e finalizar")
    void shouldCreateEmptyUpdateWithItemsResumeAndComplete() {
        // 1. Inicia sessão com 0 itens
        QuestionSessionResponseDTO created = questionSessionService.saveSession(
                QuestionSessionRequestDTO.builder()
                        .folderId(folder.getId())
                        .title("Treino de Redes TCP/IP")
                        .questionIds(List.of(q1.getId(), q2.getId(), q3.getId()))
                        .totalQuestions(3)
                        .timeSpentSeconds(0)
                        .completed(false)
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getTitle()).isEqualTo("Treino de Redes TCP/IP");
        assertThat(created.getFolderId()).isEqualTo(folder.getId());
        assertThat(created.getFolderName()).isEqualTo("Caderno Redes");
        assertThat(created.getTotalQuestions()).isEqualTo(3);
        assertThat(created.getCorrectCount()).isEqualTo(0);
        assertThat(created.getWrongCount()).isEqualTo(0);
        assertThat(created.getSkippedCount()).isEqualTo(0);
        assertThat(created.getAccuracyPercentage()).isEqualTo(0.0);
        assertThat(created.getCompleted()).isFalse();
        assertThat(created.getQuestionIds()).containsExactly(q1.getId(), q2.getId(), q3.getId());
        assertThat(created.getItems()).isEmpty();

        // 2. Progresso parcial: 1 CORRECT
        Long q1CorrectAltId = q1.getCorrectAlternativeId();
        Long q2WrongAltId = q2.getAlternatives().stream()
                .filter(a -> !a.getId().equals(q2.getCorrectAlternativeId()))
                .findFirst().orElseThrow().getId();

        QuestionSessionResponseDTO partial = questionSessionService.updateSession(
                created.getId(),
                QuestionSessionRequestDTO.builder()
                        .timeSpentSeconds(45)
                        .completed(false)
                        .items(List.of(
                                QuestionSessionItemDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1CorrectAltId)
                                        .status("CORRECT")
                                        .build()
                        ))
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(partial.getCorrectCount()).isEqualTo(1);
        assertThat(partial.getWrongCount()).isEqualTo(0);
        assertThat(partial.getSkippedCount()).isEqualTo(0);
        assertThat(partial.getAccuracyPercentage()).isEqualTo(100.0);
        assertThat(partial.getCompleted()).isFalse();
        // Derivou origin, area e subject homogeneamente das questões praticadas!
        assertThat(partial.getOriginId()).isEqualTo(origin.getId());
        assertThat(partial.getAreaId()).isEqualTo(area.getId());
        assertThat(partial.getSubjectId()).isEqualTo(subject.getId());

        // 3. Finaliza sessão com CORRECT, WRONG e SKIPPED (substitui itens anteriores sem erro Hibernate)
        QuestionSessionResponseDTO completed = questionSessionService.updateSession(
                created.getId(),
                QuestionSessionRequestDTO.builder()
                        .timeSpentSeconds(150)
                        .completed(true)
                        .items(List.of(
                                QuestionSessionItemDTO.builder()
                                        .questionId(q1.getId())
                                        .selectedAlternativeId(q1CorrectAltId)
                                        .status("CORRECT")
                                        .build(),
                                QuestionSessionItemDTO.builder()
                                        .questionId(q2.getId())
                                        .selectedAlternativeId(q2WrongAltId)
                                        .status("WRONG")
                                        .build(),
                                QuestionSessionItemDTO.builder()
                                        .questionId(q3.getId())
                                        .selectedAlternativeId(null)
                                        .status("SKIPPED")
                                        .build()
                        ))
                        .build(),
                student.getId()
        );
        entityManager.flush();
        entityManager.clear();

        assertThat(completed.getCompleted()).isTrue();
        assertThat(completed.getCorrectCount()).isEqualTo(1);
        assertThat(completed.getWrongCount()).isEqualTo(1);
        assertThat(completed.getSkippedCount()).isEqualTo(1);
        assertThat(completed.getTimeSpentSeconds()).isEqualTo(150);
        assertThat(completed.getAccuracyPercentage()).isCloseTo(33.333, within(0.01));
        assertThat(completed.getItems()).hasSize(3);

        QuestionSessionItemDTO item1 = completed.getItems().get(0);
        assertThat(item1.getQuestionIdentifier()).isEqualTo("Q1");
        assertThat(item1.getSelectedAlternativeIdentifier()).isEqualTo("A");
        assertThat(item1.getCorrectAlternativeIdentifier()).isEqualTo("A");
        assertThat(item1.getStatus()).isEqualTo("CORRECT");

        QuestionSessionItemDTO item2 = completed.getItems().get(1);
        assertThat(item2.getSelectedAlternativeIdentifier()).isEqualTo("B");
        assertThat(item2.getCorrectAlternativeIdentifier()).isEqualTo("A");
        assertThat(item2.getStatus()).isEqualTo("WRONG");

        QuestionSessionItemDTO item3 = completed.getItems().get(2);
        assertThat(item3.getSelectedAlternativeId()).isNull();
        assertThat(item3.getCorrectAlternativeIdentifier()).isEqualTo("A");
        assertThat(item3.getStatus()).isEqualTo("SKIPPED");

        // 4. Retoma sessão por ID e valida permissões
        QuestionSessionResponseDTO fetched = questionSessionService.getSessionById(created.getId(), student.getId());
        assertThat(fetched.getItems()).hasSize(3);

        assertThatThrownBy(() -> questionSessionService.getSessionById(created.getId(), otherUser.getId()))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(questionSessionService.getSessionById(created.getId(), adminUser.getId()).getId())
                .isEqualTo(created.getId());
    }

    @Test
    @DisplayName("Deve listar sessões do usuário e permitir exclusão pelo dono")
    void shouldListUserSessionsAndDelete() {
        QuestionSessionResponseDTO s1 = questionSessionService.saveSession(
                QuestionSessionRequestDTO.builder()
                        .title("Sessão 1")
                        .questionIds(List.of(q1.getId()))
                        .completed(true)
                        .build(),
                student.getId()
        );
        entityManager.flush();

        QuestionSessionResponseDTO s2 = questionSessionService.saveSession(
                QuestionSessionRequestDTO.builder()
                        .title("Sessão 2")
                        .questionIds(List.of(q2.getId()))
                        .completed(false)
                        .build(),
                student.getId()
        );
        entityManager.flush();

        List<QuestionSessionResponseDTO> list = questionSessionService.getUserSessions(student.getId());
        assertThat(list).hasSize(2);
        assertThat(list.get(0).getId()).isEqualTo(s2.getId());
        assertThat(list.get(1).getId()).isEqualTo(s1.getId());

        assertThatThrownBy(() -> questionSessionService.deleteSession(s1.getId(), otherUser.getId()))
                .isInstanceOf(ResponseStatusException.class);

        questionSessionService.deleteSession(s1.getId(), student.getId());
        entityManager.flush();

        assertThatThrownBy(() -> questionSessionService.getSessionById(s1.getId(), student.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
