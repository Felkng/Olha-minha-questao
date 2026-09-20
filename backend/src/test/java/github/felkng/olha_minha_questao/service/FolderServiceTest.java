package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import github.felkng.olha_minha_questao.dto.folder.SavedQuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class FolderServiceTest {

    @Autowired
    private FolderService folderService;

    @Autowired
    private OriginRepository originRepository;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve criar pasta com sucesso e buscar por ID")
    void testCreateAndFindById() {
        FolderRequestDTO request = FolderRequestDTO.builder()
                .name("Revisar Biologia")
                .description("Questões de ecologia e citologia")
                .color("#5aa6e2")
                .build();

        FolderResponseDTO created = folderService.create(request);
        entityManager.flush();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getName()).isEqualTo("Revisar Biologia");
        assertThat(created.getColor()).isEqualTo("#5aa6e2");

        FolderResponseDTO found = folderService.findById(created.getId());
        assertThat(found.getName()).isEqualTo("Revisar Biologia");
    }

    @Test
    @DisplayName("Deve atualizar pasta com sucesso")
    void testUpdate() {
        FolderResponseDTO created = folderService.create(FolderRequestDTO.builder()
                .name("Favoritas")
                .description("Minhas favoritas")
                .color("#d9b763")
                .build());
        entityManager.flush();

        FolderRequestDTO updateRequest = FolderRequestDTO.builder()
                .name("Favoritas Atualizado")
                .description("Descrição nova")
                .color("#4bf151")
                .build();

        FolderResponseDTO updated = folderService.update(created.getId(), updateRequest);
        entityManager.flush();

        assertThat(updated.getName()).isEqualTo("Favoritas Atualizado");
        assertThat(updated.getColor()).isEqualTo("#4bf151");
    }

    @Test
    @DisplayName("Deve deletar pasta com sucesso")
    void testDelete() {
        FolderResponseDTO created = folderService.create(FolderRequestDTO.builder()
                .name("Pasta Temporária")
                .build());
        entityManager.flush();

        folderService.delete(created.getId());
        entityManager.flush();

        assertThatThrownBy(() -> folderService.findById(created.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve salvar questão em pasta e depois remover")
    void testAddAndRemoveQuestionFromFolder() {
        // Cria dependências
        Origin origin = originRepository.save(Origin.builder().name("ORIG_TEST_FOLDER").build());
        Area area = areaRepository.save(Area.builder().name("AREA_TEST_FOLDER").build());
        Question question = questionRepository.save(Question.builder()
                .enunciado("Questão de teste para pasta")
                .identifier("TEST-01")
                .origin(origin)
                .area(area)
                .year(2024)
                .build());

        FolderResponseDTO folder = folderService.create(FolderRequestDTO.builder()
                .name("Pasta com Questão")
                .color("#fa424b")
                .build());
        entityManager.flush();

        // Adiciona questão à pasta
        SavedQuestionResponseDTO saved = folderService.addQuestionToFolder(folder.getId(), question.getId(), "Nota de revisão");
        entityManager.flush();

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getFolderId()).isEqualTo(folder.getId());
        assertThat(saved.getNotes()).isEqualTo("Nota de revisão");

        // Lista questões da pasta
        List<QuestionResponseDTO> questionsInFolder = folderService.getQuestionsInFolder(folder.getId());
        assertThat(questionsInFolder).hasSize(1);
        assertThat(questionsInFolder.get(0).getId()).isEqualTo(question.getId());

        // Verifica pastas da questão
        List<Long> folderIds = folderService.getFolderIdsForQuestion(question.getId());
        assertThat(folderIds).contains(folder.getId());

        // Remove questão da pasta
        folderService.removeQuestionFromFolder(folder.getId(), question.getId());
        entityManager.flush();

        List<QuestionResponseDTO> emptyList = folderService.getQuestionsInFolder(folder.getId());
        assertThat(emptyList).isEmpty();
    }
}
