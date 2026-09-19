package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.repository.AlternativeRepository;
import github.felkng.olha_minha_questao.dto.alternative.AlternativeRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class QuestionServiceTest {

    @Autowired
    private QuestionService questionService;

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private TestService testService;

    @Autowired
    private AlternativeRepository alternativeRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Deve criar uma questão com alternativas em cascata com sucesso")
    void testCreateQuestionWithAlternatives() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("ENEM_QS_TEST").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Física_QS_TEST").build());
        TestResponseDTO test = testService.create(TestRequestDTO.builder()
                .name("ENEM 2024_QS_TEST")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .build());
        entityManager.flush();

        QuestionRequestDTO request = QuestionRequestDTO.builder()
                .enunciado("Um objeto em queda livre desconsiderando a resistência do ar...")
                .identifier("Questão 01")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .testId(test.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Acelera a 9.8 m/s²").isCorrect(true).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Permanece em velocidade constante").isCorrect(false).build(),
                        AlternativeRequestDTO.builder().identifier("C").text("Desacelera gradativamente").isCorrect(false).build(),
                        AlternativeRequestDTO.builder().identifier("D").text("Flutua no vácuo").isCorrect(false).build()
                ))
                .build();

        QuestionResponseDTO created = questionService.create(request);
        entityManager.flush();

        assertThat(created.getId()).isNotNull();
        assertThat(created.getEnunciado()).isEqualTo("Um objeto em queda livre desconsiderando a resistência do ar...");
        assertThat(created.getOrigin().getName()).isEqualTo("ENEM_QS_TEST");
        assertThat(created.getArea().getName()).isEqualTo("Física_QS_TEST");
        assertThat(created.getTest().getName()).isEqualTo("ENEM 2024_QS_TEST");
        assertThat(created.getAlternatives()).hasSize(4);
        assertThat(created.getAlternatives()).anyMatch(a -> a.getIdentifier().equals("A") && a.getIsCorrect());
        assertThat(created.getCorrectAlternativeId()).isNotNull();
        assertThat(created.getCorrectAlternativeIdentifier()).isEqualTo("A");

        QuestionResponseDTO found = questionService.findById(created.getId());
        assertThat(found.getAlternatives()).hasSize(4);
        assertThat(found.getCorrectAlternativeId()).isEqualTo(created.getCorrectAlternativeId());
        assertThat(found.getCorrectAlternativeIdentifier()).isEqualTo("A");
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar criar questão com origem ou área inexistente")
    void testCreateWithInvalidDependencies_ThrowsException() {
        QuestionRequestDTO request = QuestionRequestDTO.builder()
                .enunciado("Enunciado qualquer")
                .year(2024)
                .originId(99999L)
                .areaId(99999L)
                .build();

        assertThatThrownBy(() -> questionService.create(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve buscar questões com paginação e filtros dinâmicos")
    void testFindQuestionsByFiltersAndPagination() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("FUVEST_QS_TEST").build());
        AreaResponseDTO areaBio = areaService.create(AreaRequestDTO.builder().name("Biologia_QS_TEST").build());
        AreaResponseDTO areaMat = areaService.create(AreaRequestDTO.builder().name("Matemática_QS_TEST").build());

        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Bio 1").year(2024).originId(origin.getId()).areaId(areaBio.getId()).build());
        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Bio 2").year(2024).originId(origin.getId()).areaId(areaBio.getId()).build());
        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Mat 1").year(2023).originId(origin.getId()).areaId(areaMat.getId()).build());
        entityManager.flush();

        Page<QuestionResponseDTO> bioPage = questionService.findAll(origin.getId(), areaBio.getId(), null, null, PageRequest.of(0, 10));
        assertThat(bioPage.getTotalElements()).isEqualTo(2);

        Page<QuestionResponseDTO> yearPage = questionService.findAll(origin.getId(), null, null, 2023, PageRequest.of(0, 10));
        assertThat(yearPage.getTotalElements()).isEqualTo(1);
        assertThat(yearPage.getContent().get(0).getEnunciado()).isEqualTo("Questão Mat 1");
    }

    @Test
    @DisplayName("Deve atualizar questão e suas alternativas com sucesso")
    void testUpdateQuestionAndAlternatives() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("UNICAMP_QS_TEST").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Química_QS_TEST").build());

        QuestionResponseDTO created = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Enunciado inicial")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Opção 1").isCorrect(false).build()
                ))
                .build());
        entityManager.flush();

        QuestionRequestDTO updateRequest = QuestionRequestDTO.builder()
                .enunciado("Enunciado revisado e atualizado")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Opção Nova 1").isCorrect(false).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Opção Nova 2").isCorrect(true).build()
                ))
                .build();

        QuestionResponseDTO updated = questionService.update(created.getId(), updateRequest);
        entityManager.flush();

        assertThat(updated.getEnunciado()).isEqualTo("Enunciado revisado e atualizado");
        assertThat(updated.getAlternatives()).hasSize(2);
    }

    @Test
    @DisplayName("Deve deletar questão e remover alternativas em cascata")
    void testDeleteQuestion_CascadeDeletesAlternatives() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("ITA_QS_TEST").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Computação_QS_TEST").build());

        QuestionResponseDTO created = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão para deleção")
                .year(2024)
                .originId(origin.getId())
                .areaId(area.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Opção A").isCorrect(true).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Opção B").isCorrect(false).build()
                ))
                .build());
        entityManager.flush();

        Long questionId = created.getId();
        assertThat(alternativeRepository.findByQuestionIdOrderByIdentifierAsc(questionId)).hasSize(2);

        questionService.delete(questionId);
        entityManager.flush();

        assertThatThrownBy(() -> questionService.findById(questionId))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThat(alternativeRepository.findByQuestionIdOrderByIdentifierAsc(questionId)).isEmpty();
    }
}
