package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionStatistic;
import github.felkng.olha_minha_questao.domain.entity.TestStatistic;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestCardDTO;
import github.felkng.olha_minha_questao.dto.test.TestEvaluationDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.QuestionMapper;
import github.felkng.olha_minha_questao.mapper.TestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TestService {

    private final TestRepository testRepository;
    private final OriginRepository originRepository;
    private final AreaRepository areaRepository;
    private final github.felkng.olha_minha_questao.domain.repository.SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;
    private final github.felkng.olha_minha_questao.domain.repository.TextualReferenceRepository textualReferenceRepository;
    private final TestMapper testMapper;
    private final QuestionMapper questionMapper;
    private final github.felkng.olha_minha_questao.mapper.AlternativeMapper alternativeMapper;
    private final github.felkng.olha_minha_questao.mapper.TextualReferenceMapper textualReferenceMapper;

    @Transactional(readOnly = true)
    public List<TestCardDTO> findTestCards() {
        return findTestCards(null);
    }

    @Transactional(readOnly = true)
    public List<TestCardDTO> findTestCards(Long currentUserId) {
        List<Test> tests = testRepository.findAllByOrderByYearDescIdDesc();
        return tests.stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsPublic()) || (currentUserId != null && t.getCreatedByUser() != null && t.getCreatedByUser().getId().equals(currentUserId)))
                .map(test -> {
                    TestStatistic stat = test.getStatistic();
                    int qCount = (int) questionRepository.countByTestId(test.getId());
                    return TestCardDTO.builder()
                            .id(test.getId())
                            .name(test.getName())
                            .year(test.getYear())
                            .originId(test.getOrigin() != null ? test.getOrigin().getId() : null)
                            .originName(test.getOrigin() != null ? test.getOrigin().getName() : null)
                            .areaId(test.getArea() != null ? test.getArea().getId() : null)
                            .areaName(test.getArea() != null ? test.getArea().getName() : null)
                            .questionCount(qCount)
                            .difficultyLevel(stat != null ? stat.getDifficultyLevel() : DifficultyLevel.SEM_DADOS)
                            .averageScore(stat != null ? stat.getAverageScore() : 0.0)
                            .totalAttempts(stat != null ? stat.getTotalAttempts() : 0L)
                            .build();
                }).toList();
    }

    @Transactional(readOnly = true)
    public TestEvaluationDTO getTestEvaluation(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        List<Question> questions = questionRepository.findByTestIdOrderByIdAsc(id);
        List<QuestionResponseDTO> questionDTOs = questions.stream()
                .map(questionMapper::toDTO)
                .toList();

        return TestEvaluationDTO.builder()
                .id(test.getId())
                .name(test.getName())
                .year(test.getYear())
                .originId(test.getOrigin() != null ? test.getOrigin().getId() : null)
                .originName(test.getOrigin() != null ? test.getOrigin().getName() : null)
                .areaId(test.getArea() != null ? test.getArea().getId() : null)
                .areaName(test.getArea() != null ? test.getArea().getName() : null)
                .questionCount(questionDTOs.size())
                .questions(questionDTOs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year) {
        return findAll(originId, areaId, year, null, null);
    }

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year, Long createdByUserId) {
        return findAll(originId, areaId, year, createdByUserId, null);
    }

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year, Long createdByUserId, Long currentUserId) {
        List<Test> tests;
        if (createdByUserId != null) {
            tests = testRepository.findByCreatedByUserIdOrderByYearDescIdDesc(createdByUserId);
        } else if (originId != null && year != null) {
            tests = testRepository.findByOriginIdAndYear(originId, year);
        } else if (originId != null) {
            tests = testRepository.findByOriginId(originId);
        } else if (areaId != null) {
            tests = testRepository.findByAreaId(areaId);
        } else if (year != null) {
            tests = testRepository.findByYear(year);
        } else {
            tests = testRepository.findAllByOrderByYearDescIdDesc();
        }

        return tests.stream()
                .filter(t -> {
                    if (createdByUserId != null && createdByUserId.equals(currentUserId)) {
                        return true;
                    }
                    return Boolean.TRUE.equals(t.getIsPublic()) || (currentUserId != null && t.getCreatedByUser() != null && t.getCreatedByUser().getId().equals(currentUserId));
                })
                .map(this::toDTOWithQuestionCount)
                .toList();
    }

    private TestResponseDTO toDTOWithQuestionCount(Test test) {
        TestResponseDTO dto = testMapper.toDTO(test);
        if (test != null && test.getId() != null) {
            dto.setQuestionCount((int) questionRepository.countByTestId(test.getId()));
        } else {
            dto.setQuestionCount(0);
        }
        return dto;
    }

    @Transactional(readOnly = true)
    public TestResponseDTO findById(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));
        return toDTOWithQuestionCount(test);
    }

    @Transactional
    public TestResponseDTO create(TestRequestDTO dto) {
        return create(dto, null);
    }

    @Transactional
    public TestResponseDTO create(TestRequestDTO dto, Long userId) {
        Origin origin = null;
        if (dto.getOriginId() != null) {
            origin = originRepository.findById(dto.getOriginId())
                    .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));
        }

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        github.felkng.olha_minha_questao.domain.entity.User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Test test = testMapper.toEntity(dto);
        test.setOrigin(origin);
        test.setArea(area);
        test.setCreatedByUser(user);
        if (dto.getIsPublic() != null) {
            test.setIsPublic(dto.getIsPublic());
        }

        Test saved = testRepository.save(test);

        if (saved.getStatistic() == null) {
            TestStatistic stat = TestStatistic.builder()
                    .test(saved)
                    .testId(saved.getId())
                    .totalAttempts(0L)
                    .averageScore(0.0)
                    .difficultyLevel(DifficultyLevel.SEM_DADOS)
                    .build();
            saved.setStatistic(stat);
            saved = testRepository.save(saved);
        }

        return toDTOWithQuestionCount(saved);
    }

    @Transactional
    public TestResponseDTO createWithQuestions(github.felkng.olha_minha_questao.dto.test.TestWithQuestionsRequestDTO dto, Long userId) {
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            java.util.Set<String> seen = new java.util.HashSet<>();
            for (var q : dto.getQuestions()) {
                String iden = q.getIdentifier() != null ? q.getIdentifier().trim().toLowerCase() : "";
                if (!iden.isEmpty()) {
                    if (!seen.add(iden)) {
                        throw new IllegalArgumentException("Identificador duplicado encontrado nas questões da prova: " + q.getIdentifier());
                    }
                }
            }
        }

        Origin origin = null;
        if (dto.getOriginId() != null) {
            origin = originRepository.findById(dto.getOriginId())
                    .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));
        }

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        github.felkng.olha_minha_questao.domain.entity.User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Test test = Test.builder()
                .name(dto.getName())
                .year(dto.getYear())
                .origin(origin)
                .area(area)
                .createdByUser(user)
                .isPublic(dto.getIsPublic() != null ? dto.getIsPublic() : true)
                .build();

        Test savedTest = testRepository.save(test);

        List<github.felkng.olha_minha_questao.domain.entity.TextualReference> savedReferences = new java.util.ArrayList<>();
        if (dto.getTextualReferences() != null && !dto.getTextualReferences().isEmpty()) {
            for (var refDto : dto.getTextualReferences()) {
                github.felkng.olha_minha_questao.domain.entity.TextualReference ref = textualReferenceMapper.toEntity(refDto);
                ref.setTest(savedTest);
                savedReferences.add(textualReferenceRepository.save(ref));
            }
            savedTest.getTextualReferences().addAll(savedReferences);
        }

        if (dto.getQuestions() != null) {
            for (var qDto : dto.getQuestions()) {
                if (qDto.getAlternatives() == null || qDto.getAlternatives().size() < 2) {
                    throw new IllegalArgumentException("Cada questão deve conter no mínimo 2 alternativas.");
                }

                Area qArea = area;
                if (qDto.getAreaId() != null) {
                    qArea = areaRepository.findById(qDto.getAreaId()).orElse(area);
                }

                github.felkng.olha_minha_questao.domain.entity.Subject qSubject = null;
                if (qDto.getSubjectId() != null) {
                    qSubject = subjectRepository.findById(qDto.getSubjectId()).orElse(null);
                }

                github.felkng.olha_minha_questao.domain.entity.TextualReference qRef = null;
                if (qDto.getTextualReferenceIndex() != null && qDto.getTextualReferenceIndex() >= 0 && qDto.getTextualReferenceIndex() < savedReferences.size()) {
                    qRef = savedReferences.get(qDto.getTextualReferenceIndex());
                } else if (qDto.getTextualReferenceId() != null) {
                    qRef = textualReferenceRepository.findById(qDto.getTextualReferenceId()).orElse(null);
                }

                Question question = Question.builder()
                        .enunciado(qDto.getEnunciado())
                        .identifier(qDto.getIdentifier())
                        .year(qDto.getYear() != null ? qDto.getYear() : savedTest.getYear())
                        .origin(origin)
                        .area(qArea)
                        .subject(qSubject)
                        .test(savedTest)
                        .textualReference(qRef)
                        .createdByUser(user)
                        .isPublic(qDto.getIsPublic() != null ? qDto.getIsPublic() : (dto.getIsPublic() != null ? dto.getIsPublic() : true))
                        .alternatives(new java.util.ArrayList<>())
                        .build();

                final Question fQuestion = question;
                List<github.felkng.olha_minha_questao.domain.entity.Alternative> alternatives = qDto.getAlternatives().stream()
                        .map(altDto -> {
                            github.felkng.olha_minha_questao.domain.entity.Alternative alt = alternativeMapper.toEntity(altDto);
                            alt.setQuestion(fQuestion);
                            return alt;
                        })
                        .toList();
                question.getAlternatives().addAll(alternatives);

                Question savedQuestion = questionRepository.save(question);

                github.felkng.olha_minha_questao.domain.entity.Alternative correct = null;
                if (qDto.getCorrectAlternativeId() != null) {
                    correct = savedQuestion.getAlternatives().stream()
                            .filter(a -> qDto.getCorrectAlternativeId().equals(a.getId()))
                            .findFirst()
                            .orElse(null);
                }
                if (correct == null) {
                    correct = savedQuestion.getAlternatives().stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                            .findFirst()
                            .orElse(null);
                }

                if (correct != null) {
                    savedQuestion.setCorrectAlternative(correct);
                }

                if (savedQuestion.getStatistic() == null) {
                    QuestionStatistic stat = QuestionStatistic.builder()
                            .question(savedQuestion)
                            .questionId(savedQuestion.getId())
                            .totalAttempts(0L)
                            .firstAttempts(0L)
                            .firstAttemptCorrect(0L)
                            .firstAttemptAccuracy(0.0)
                            .difficultyLevel(DifficultyLevel.SEM_DADOS)
                            .build();
                    savedQuestion.setStatistic(stat);
                }

                questionRepository.save(savedQuestion);
            }
        }

        if (savedTest.getStatistic() == null) {
            TestStatistic stat = TestStatistic.builder()
                    .test(savedTest)
                    .testId(savedTest.getId())
                    .totalAttempts(0L)
                    .averageScore(0.0)
                    .difficultyLevel(DifficultyLevel.SEM_DADOS)
                    .build();
            savedTest.setStatistic(stat);
            savedTest = testRepository.save(savedTest);
        }

        return toDTOWithQuestionCount(savedTest);
    }

    @Transactional
    public TestResponseDTO update(Long id, TestRequestDTO dto) {
        return update(id, dto, null);
    }

    @Transactional
    public TestResponseDTO update(Long id, TestRequestDTO dto, Long userId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (test.getCreatedByUser() == null || !test.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para editar esta prova.");
                }
            }
        }

        Origin origin = null;
        if (dto.getOriginId() != null) {
            origin = originRepository.findById(dto.getOriginId())
                    .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));
        }

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        testMapper.updateEntityFromDTO(dto, test);
        test.setOrigin(origin);
        test.setArea(area);
        if (dto.getIsPublic() != null) {
            test.setIsPublic(dto.getIsPublic());
        }

        Test updated = testRepository.save(test);
        return toDTOWithQuestionCount(updated);
    }

    @Transactional
    public TestResponseDTO toggleVisibility(Long id, Long userId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (test.getCreatedByUser() == null || !test.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para alterar a visibilidade desta prova.");
                }
            }
        }

        test.setIsPublic(!Boolean.TRUE.equals(test.getIsPublic()));
        Test updated = testRepository.save(test);
        return toDTOWithQuestionCount(updated);
    }

    @Transactional
    public void delete(Long id) {
        delete(id, null);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() == github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                // Admin pode excluir se for público ou criado por ele mesmo
                if (!Boolean.TRUE.equals(test.getIsPublic()) && (test.getCreatedByUser() == null || !test.getCreatedByUser().getId().equals(user.getId()))) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Administradores podem moderar apenas conteúdos públicos de terceiros.");
                }
            } else {
                // Usuário comum só pode excluir suas próprias provas
                if (test.getCreatedByUser() == null || !test.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para excluir esta prova.");
                }
            }
        }

        testRepository.delete(test);
    }
}
