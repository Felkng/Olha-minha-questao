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
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ExamSimulationTest {

    @Autowired
    private OriginService originService;

    @Autowired
    private AreaService areaService;

    @Autowired
    private TestService testService;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private AlternativeRepository alternativeRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Simulação completa: Criação de prova com 4 questões e 20 alternativas, consultas, alterações e deleções com DML real e rollback automático")
    void testCompleteExamSimulation() {
        // 1. Criar Origem (FUVEST) e Área (Biologia)
        OriginResponseDTO origin = originService.create(OriginRequestDTO.builder()
                .name("FUVEST_SIMULATION")
                .description("Fundação Universitária para o Vestibular")
                .build());

        AreaResponseDTO area = areaService.create(AreaRequestDTO.builder()
                .name("Biologia_SIMULATION")
                .description("Ciências Biológicas e Meio Ambiente")
                .build());

        // 2. Criar Prova (FUVEST 2025 - 1ª Fase)
        TestResponseDTO exam = testService.create(TestRequestDTO.builder()
                .name("FUVEST 2025 - 1ª Fase")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .build());

        entityManager.flush(); // Força INSERTs no PostgreSQL

        assertThat(exam.getId()).isNotNull();
        assertThat(exam.getOriginName()).isEqualTo("FUVEST_SIMULATION");
        assertThat(exam.getAreaName()).isEqualTo("Biologia_SIMULATION");

        // 3. Criar 4 Questões completas para esta Prova, cada uma com 5 alternativas (A, B, C, D, E)
        List<Long> createdQuestionIds = new ArrayList<>();

        for (int i = 1; i <= 4; i++) {
            final int questionNumber = i;
            List<AlternativeRequestDTO> alternatives = List.of(
                    AlternativeRequestDTO.builder().identifier("A").text("Alternativa A da questão " + questionNumber).isCorrect(questionNumber == 1).build(),
                    AlternativeRequestDTO.builder().identifier("B").text("Alternativa B da questão " + questionNumber).isCorrect(questionNumber == 2).build(),
                    AlternativeRequestDTO.builder().identifier("C").text("Alternativa C da questão " + questionNumber).isCorrect(questionNumber == 3).build(),
                    AlternativeRequestDTO.builder().identifier("D").text("Alternativa D da questão " + questionNumber).isCorrect(questionNumber == 4).build(),
                    AlternativeRequestDTO.builder().identifier("E").text("Alternativa E da questão " + questionNumber).isCorrect(false).build()
            );

            QuestionRequestDTO questionRequest = QuestionRequestDTO.builder()
                    .enunciado("Enunciado completo e detalhado da Questão " + questionNumber + " sobre Biologia Celular...")
                    .identifier("Questão 0" + questionNumber)
                    .year(2025)
                    .originId(origin.getId())
                    .areaId(area.getId())
                    .testId(exam.getId())
                    .alternatives(alternatives)
                    .build();

            QuestionResponseDTO createdQuestion = questionService.create(questionRequest);
            createdQuestionIds.add(createdQuestion.getId());
        }

        entityManager.flush(); // Força INSERTs de todas as 4 questões e 20 alternativas no PostgreSQL

        // 4. Validação da consulta paginada de questões da prova
        Page<QuestionResponseDTO> examQuestionsPage = questionService.findAll(
                origin.getId(), area.getId(), exam.getId(), 2025, PageRequest.of(0, 10));

        assertThat(examQuestionsPage.getTotalElements()).isEqualTo(4);
        assertThat(examQuestionsPage.getContent()).hasSize(4);

        for (QuestionResponseDTO q : examQuestionsPage.getContent()) {
            assertThat(q.getTest().getName()).isEqualTo("FUVEST 2025 - 1ª Fase");
            assertThat(q.getAlternatives()).hasSize(5);
            assertThat(q.getAlternatives().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count()).isEqualTo(1);
            assertThat(q.getCorrectAlternativeId()).isNotNull();
            assertThat(q.getCorrectAlternativeIdentifier()).isNotNull();
        }

        // 5. Alteração de uma questão existente
        Long firstQuestionId = createdQuestionIds.get(0);
        QuestionRequestDTO updateRequest = QuestionRequestDTO.builder()
                .enunciado("Enunciado MODIFICADO da Questão 01 com novo texto...")
                .identifier("Questão 01 - Revisada")
                .year(2025)
                .originId(origin.getId())
                .areaId(area.getId())
                .testId(exam.getId())
                .alternatives(List.of(
                        AlternativeRequestDTO.builder().identifier("A").text("Nova Opção A").isCorrect(false).build(),
                        AlternativeRequestDTO.builder().identifier("B").text("Nova Opção B (Gabarito)").isCorrect(true).build()
                ))
                .build();

        QuestionResponseDTO updatedQuestion = questionService.update(firstQuestionId, updateRequest);
        entityManager.flush(); // Força UPDATE no PostgreSQL

        assertThat(updatedQuestion.getEnunciado()).isEqualTo("Enunciado MODIFICADO da Questão 01 com novo texto...");
        assertThat(updatedQuestion.getIdentifier()).isEqualTo("Questão 01 - Revisada");
        assertThat(updatedQuestion.getAlternatives()).hasSize(2);
        assertThat(updatedQuestion.getCorrectAlternativeIdentifier()).isEqualTo("B");

        // 6. Deleção de uma questão e verificação da remoção em cascata das alternativas
        Long questionToDeleteId = createdQuestionIds.get(3); // 4ª questão
        assertThat(alternativeRepository.findByQuestionIdOrderByIdentifierAsc(questionToDeleteId)).hasSize(5);

        questionService.delete(questionToDeleteId);
        entityManager.flush(); // Força DELETE no PostgreSQL

        assertThat(alternativeRepository.findByQuestionIdOrderByIdentifierAsc(questionToDeleteId)).isEmpty();

        Page<QuestionResponseDTO> remainingQuestions = questionService.findAll(
                null, null, exam.getId(), null, PageRequest.of(0, 10));
        assertThat(remainingQuestions.getTotalElements()).isEqualTo(3);

        // O teste encerra aqui e o Spring executa automaticamente o ROLLBACK de todas as transações,
        // garantindo que NENHUM dado persista no PostgreSQL!
    }
}
