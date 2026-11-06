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
    private SubjectService subjectService;

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
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Opção A").isCorrect(true).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Opção B").isCorrect(false).build()
                ))
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

        List<AlternativeRequestDTO> alts = List.of(
                AlternativeRequestDTO.builder().identifier("A").text("Alt A").isCorrect(true).build(),
                AlternativeRequestDTO.builder().identifier("B").text("Alt B").isCorrect(false).build()
        );

        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Bio 1").year(2024).originId(origin.getId()).areaId(areaBio.getId()).alternatives(alts).build());
        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Bio 2").year(2024).originId(origin.getId()).areaId(areaBio.getId()).alternatives(alts).build());
        questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão Mat 1").year(2023).originId(origin.getId()).areaId(areaMat.getId()).alternatives(alts).build());
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
                        AlternativeRequestDTO.builder().identifier("A").text("Opção 1").isCorrect(false).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Opção 2").isCorrect(true).build()
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

    @Test
    @DisplayName("Deve buscar questões ordenadas com sort 'recent' e 'mostAnswered' sem lançar PropertyReferenceException")
    void testSortingOptions() {
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("SORT_ORIGIN").build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("SORT_AREA").build());

        List<AlternativeRequestDTO> alts = List.of(
                AlternativeRequestDTO.builder().identifier("A").text("Alt A").isCorrect(true).build(),
                AlternativeRequestDTO.builder().identifier("B").text("Alt B").isCorrect(false).build()
        );

        questionService.create(QuestionRequestDTO.builder().enunciado("Q1").year(2022).originId(origin.getId()).areaId(area.getId()).alternatives(alts).build());
        questionService.create(QuestionRequestDTO.builder().enunciado("Q2").year(2024).originId(origin.getId()).areaId(area.getId()).alternatives(alts).build());
        entityManager.flush();

        // 1. sort = "recent" with PageRequest containing "recent" sort
        Page<QuestionResponseDTO> recentPage = questionService.findAll(
                null, null, null, null, null, null, "recent",
                PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("recent"))
        );
        assertThat(recentPage.getContent()).isNotEmpty();
        assertThat(recentPage.getContent().get(0).getYear()).isGreaterThanOrEqualTo(recentPage.getContent().get(1).getYear());

        // 2. sort = "mostAnswered"
        Page<QuestionResponseDTO> mostAnsweredPage = questionService.findAll(
                null, null, null, null, null, null, "mostAnswered",
                PageRequest.of(0, 10)
        );
        assertThat(mostAnsweredPage.getContent()).isNotEmpty();

        // 3. search with multi-word keywords
        Page<QuestionResponseDTO> searchPage = questionService.findAll(
                null, null, null, null, null, "SORT_ORIGIN Q1", "recent",
                PageRequest.of(0, 10)
        );
        assertThat(searchPage.getContent()).hasSize(1);
        assertThat(searchPage.getContent().get(0).getEnunciado()).isEqualTo("Q1");
    }

    @Test
    @DisplayName("Deve permitir criar questão sem origem (banca nula)")
    void testCreateQuestionWithoutOrigin() {
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("Física_SEM_BANCA").build());

        QuestionResponseDTO created = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão avulsa sem banca")
                .year(2025)
                .areaId(area.getId())
                .originId(null)
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Opção A").isCorrect(true).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Opção B").isCorrect(false).build()
                ))
                .build());

        assertThat(created).isNotNull();
        assertThat(created.getOrigin()).isNull();
        assertThat(created.getArea().getName()).isEqualTo("Física_SEM_BANCA");
    }

    @Test
    @DisplayName("Deve filtrar questões por ids, subjectId e standaloneOnly (excluindo questões de provas e test_question)")
    void testFilterByIdsSubjectIdAndStandaloneOnly() {
        long suffix = System.nanoTime();
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder().name("FILTER_ORIGIN_" + suffix).build());
        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder().name("FILTER_AREA_" + suffix).build());
        var subjectA = subjectService.create(github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO.builder()
                .name("Algoritmos_" + suffix)
                .areaId(area.getId())
                .build());
        var subjectB = subjectService.create(github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO.builder()
                .name("BancoDados_" + suffix)
                .areaId(area.getId())
                .build());
        TestResponseDTO exam = testService.create(TestRequestDTO.builder()
                .name("Prova Filtro " + suffix)
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .build());

        List<AlternativeRequestDTO> alts = List.of(
                AlternativeRequestDTO.builder().identifier("A").text("Alt A").isCorrect(true).build(),
                AlternativeRequestDTO.builder().identifier("B").text("Alt B").isCorrect(false).build()
        );

        // Q1: pertence diretamente a uma prova (test_id != null)
        QuestionResponseDTO qInTest = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão direta na prova")
                .identifier("T1")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subjectA.getId())
                .testId(exam.getId())
                .alternatives(alts)
                .build());

        // Q2: test_id == null, mas vinculada via N:N em test_question
        QuestionResponseDTO qLinkedToTest = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão vinculada via N:N")
                .identifier("T2")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subjectA.getId())
                .alternatives(alts)
                .build());
        testService.addQuestionToTest(exam.getId(), qLinkedToTest.getId());

        // Q3: verdadeiramente avulsa (standalone), matéria B
        QuestionResponseDTO qStandalone = questionService.create(QuestionRequestDTO.builder()
                .enunciado("Questão genuinamente avulsa")
                .identifier("S1")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .subjectId(subjectB.getId())
                .alternatives(alts)
                .build());

        entityManager.flush();

        // 1. Filtro por ids
        Page<QuestionResponseDTO> byIds = questionService.findAll(
                List.of(qInTest.getId(), qStandalone.getId()),
                null, null, null, null, null, null, null, null, null, null, null,
                PageRequest.of(0, 10)
        );
        assertThat(byIds.getContent()).extracting(QuestionResponseDTO::getId)
                .containsExactlyInAnyOrder(qInTest.getId(), qStandalone.getId());

        // 2. Filtro por subjectId
        Page<QuestionResponseDTO> bySubjectA = questionService.findAll(
                null, origin.getId(), area.getId(), subjectA.getId(), null, null, null, null, null, null, null, null,
                PageRequest.of(0, 10)
        );
        assertThat(bySubjectA.getContent()).extracting(QuestionResponseDTO::getId)
                .containsExactlyInAnyOrder(qInTest.getId(), qLinkedToTest.getId());

        // 3. Filtro por standaloneOnly = true (deve retornar APENAS qStandalone!)
        Page<QuestionResponseDTO> standalonePage = questionService.findAll(
                null, origin.getId(), area.getId(), null, null, null, null, null, null, true, null, null,
                PageRequest.of(0, 10)
        );
        assertThat(standalonePage.getContent()).extracting(QuestionResponseDTO::getId)
                .containsExactly(qStandalone.getId());
    }
}
