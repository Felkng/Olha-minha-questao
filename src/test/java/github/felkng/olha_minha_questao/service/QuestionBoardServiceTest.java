package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionBoardRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.board.QuestionBoardRequestDTO;
import github.felkng.olha_minha_questao.dto.board.QuestionBoardResponseDTO;
import github.felkng.olha_minha_questao.storage.BoardStorageService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class QuestionBoardServiceTest {

    @Autowired
    private QuestionBoardService questionBoardService;

    @Autowired
    private QuestionBoardRepository questionBoardRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OriginRepository originRepository;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private BoardStorageService boardStorageService;

    @Autowired
    private EntityManager entityManager;

    private User testUser;
    private Question testQuestion;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder()
                .name("Board Test User")
                .email("board_test_" + System.currentTimeMillis() + "@test.com")
                .passwordHash("secret123")
                .role(UserRole.GENERAL)
                .build());

        Origin origin = originRepository.save(Origin.builder().name("BOARD_ORIGIN_" + System.currentTimeMillis()).build());
        Area area = areaRepository.save(Area.builder().name("BOARD_AREA_" + System.currentTimeMillis()).build());

        testQuestion = questionRepository.save(Question.builder()
                .enunciado("Questão de teste para lousa de raciocínio")
                .identifier("BOARD-01")
                .year(2024)
                .origin(origin)
                .area(area)
                .build());

        entityManager.flush();
    }

    @Test
    @DisplayName("Deve salvar e recuperar o XML da lousa de um usuário para uma questão")
    void testSaveAndGetBoard() {
        String xmlContent = "<board width=\"800\" height=\"400\"><brush color=\"#FFE600\" width=\"3\" points=\"10,20;12,22\" /></board>";

        QuestionBoardRequestDTO request = QuestionBoardRequestDTO.builder()
                .xmlContent(xmlContent)
                .build();

        QuestionBoardResponseDTO saved = questionBoardService.saveBoard(testQuestion.getId(), testUser.getId(), request);
        entityManager.flush();

        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getQuestionId()).isEqualTo(testQuestion.getId());
        assertThat(saved.getUserId()).isEqualTo(testUser.getId());
        assertThat(saved.getXmlContent()).isEqualTo(xmlContent);
        assertThat(saved.getStoragePath()).isNotBlank();

        // Recupera a lousa salva
        QuestionBoardResponseDTO retrieved = questionBoardService.getBoard(testQuestion.getId(), testUser.getId());
        assertThat(retrieved).isNotNull();
        assertThat(retrieved.getId()).isEqualTo(saved.getId());
        assertThat(retrieved.getXmlContent()).isEqualTo(xmlContent);
    }

    @Test
    @DisplayName("Deve atualizar uma lousa existente sem duplicar registros")
    void testUpdateExistingBoard() {
        String initialXml = "<board><brush color=\"#FFE600\" /></board>";
        String updatedXml = "<board><rectangle color=\"#5AA6E2\" width=\"2\" x=\"10\" y=\"20\" w=\"100\" h=\"50\" /></board>";

        QuestionBoardResponseDTO first = questionBoardService.saveBoard(
                testQuestion.getId(),
                testUser.getId(),
                QuestionBoardRequestDTO.builder().xmlContent(initialXml).build()
        );
        entityManager.flush();

        QuestionBoardResponseDTO second = questionBoardService.saveBoard(
                testQuestion.getId(),
                testUser.getId(),
                QuestionBoardRequestDTO.builder().xmlContent(updatedXml).build()
        );
        entityManager.flush();

        assertThat(second.getId()).isEqualTo(first.getId());
        assertThat(second.getXmlContent()).isEqualTo(updatedXml);

        // Verifica no repositório que existe apenas 1 registro
        assertThat(questionBoardRepository.findByQuestionIdAndUserId(testQuestion.getId(), testUser.getId())).isPresent();
    }

    @Test
    @DisplayName("Deve retornar DTO com xmlContent nulo quando lousa não existir ou userId for nulo")
    void testGetBoard_WhenNotExists() {
        QuestionBoardResponseDTO dtoNullUser = questionBoardService.getBoard(testQuestion.getId(), null);
        assertThat(dtoNullUser.getXmlContent()).isNull();

        QuestionBoardResponseDTO dtoNoBoard = questionBoardService.getBoard(testQuestion.getId(), testUser.getId());
        assertThat(dtoNoBoard.getXmlContent()).isNull();
    }
}
