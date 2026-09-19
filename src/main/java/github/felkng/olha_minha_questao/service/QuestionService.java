package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Alternative;
import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionStatistic;
import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.SubjectRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.AlternativeMapper;
import github.felkng.olha_minha_questao.mapper.QuestionMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final OriginRepository originRepository;
    private final AreaRepository areaRepository;
    private final SubjectRepository subjectRepository;
    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final QuestionMapper questionMapper;
    private final AlternativeMapper alternativeMapper;

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year, Pageable pageable) {
        return findAll(originId, areaId, testId, year, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year,
                                             String difficulty, String search, String sort, Pageable pageable) {
        Specification<Question> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (originId != null) {
                predicates.add(cb.equal(root.get("origin").get("id"), originId));
            }
            if (areaId != null) {
                predicates.add(cb.equal(root.get("area").get("id"), areaId));
            }
            if (testId != null) {
                predicates.add(cb.equal(root.get("test").get("id"), testId));
            }
            if (year != null) {
                predicates.add(cb.equal(root.get("year"), year));
            }
            if (difficulty != null && !difficulty.isBlank()) {
                try {
                    DifficultyLevel level = DifficultyLevel.valueOf(difficulty.toUpperCase());
                    Join<Question, QuestionStatistic> statJoin = root.join("statistic", JoinType.LEFT);
                    predicates.add(cb.equal(statJoin.get("difficultyLevel"), level));
                } catch (IllegalArgumentException ignored) {}
            }
            if (search != null && !search.isBlank()) {
                String term = search.trim();
                String normalizedTerm = java.text.Normalizer.normalize(term, java.text.Normalizer.Form.NFD)
                        .replaceAll("\\p{M}", "")
                        .toLowerCase();
                String pattern = "%" + normalizedTerm + "%";

                jakarta.persistence.criteria.Expression<String> unaccentEnunciado = cb.function("translate", String.class,
                        cb.lower(root.get("enunciado")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                jakarta.persistence.criteria.Expression<String> unaccentIdentifier = cb.function("translate", String.class,
                        cb.lower(root.get("identifier")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                Join<Question, Origin> originJoin = root.join("origin", JoinType.LEFT);
                Join<Question, Area> areaJoin = root.join("area", JoinType.LEFT);
                Join<Question, Test> testJoin = root.join("test", JoinType.LEFT);
                Join<Question, Subject> subjectJoin = root.join("subject", JoinType.LEFT);

                jakarta.persistence.criteria.Expression<String> unaccentOrigin = cb.function("translate", String.class,
                        cb.lower(originJoin.get("name")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                jakarta.persistence.criteria.Expression<String> unaccentArea = cb.function("translate", String.class,
                        cb.lower(areaJoin.get("name")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                jakarta.persistence.criteria.Expression<String> unaccentTest = cb.function("translate", String.class,
                        cb.lower(testJoin.get("name")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                jakarta.persistence.criteria.Expression<String> unaccentSubject = cb.function("translate", String.class,
                        cb.lower(subjectJoin.get("name")),
                        cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                        cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(cb.like(unaccentEnunciado, pattern));
                searchPredicates.add(cb.like(unaccentIdentifier, pattern));
                searchPredicates.add(cb.like(unaccentOrigin, pattern));
                searchPredicates.add(cb.like(unaccentArea, pattern));
                searchPredicates.add(cb.like(unaccentTest, pattern));
                searchPredicates.add(cb.like(unaccentSubject, pattern));

                if (term.matches("\\d+")) {
                    try {
                        int parsed = Integer.parseInt(term);
                        searchPredicates.add(cb.equal(root.get("year"), parsed));
                    } catch (NumberFormatException ignored) {}
                }

                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable sortedPageable = pageable;
        if ("mostAnswered".equalsIgnoreCase(sort)) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "statistic.totalAttempts")
                            .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        } else if (pageable.getSort().isUnsorted()) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "year")
                            .and(Sort.by(Sort.Direction.DESC, "id")));
        }

        return questionRepository.findAll(spec, sortedPageable)
                .map(questionMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findByOriginOrdered(Long originId, Pageable pageable) {
        return findAll(originId, null, null, null, null, null, "mostAnswered", pageable);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findByAreaOrdered(Long areaId, Pageable pageable) {
        return findAll(null, areaId, null, null, null, null, "mostAnswered", pageable);
    }

    @Transactional(readOnly = true)
    public QuestionResponseDTO findById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + id));
        return questionMapper.toDTO(question);
    }

    @Transactional
    public QuestionResponseDTO create(QuestionRequestDTO dto) {
        return create(dto, null);
    }

    @Transactional
    public QuestionResponseDTO create(QuestionRequestDTO dto, Long userId) {
        Origin origin = originRepository.findById(dto.getOriginId())
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));

        Area area = areaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));

        Subject subject = null;
        if (dto.getSubjectId() != null) {
            subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com o id: " + dto.getSubjectId()));
        }

        Test test = null;
        if (dto.getTestId() != null) {
            test = testRepository.findById(dto.getTestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + dto.getTestId()));
        }

        User creator = null;
        if (userId != null) {
            creator = userRepository.findById(userId).orElse(null);
        }

        Question question = questionMapper.toEntity(dto);
        question.setOrigin(origin);
        question.setArea(area);
        question.setSubject(subject);
        question.setTest(test);
        question.setCreatedByUser(creator);

        if (dto.getAlternatives() != null && !dto.getAlternatives().isEmpty()) {
            List<Alternative> alternatives = dto.getAlternatives().stream()
                    .map(altDto -> {
                        Alternative alt = alternativeMapper.toEntity(altDto);
                        alt.setQuestion(question);
                        return alt;
                    })
                    .toList();
            question.setAlternatives(new ArrayList<>(alternatives));
        }

        Question saved = questionRepository.save(question);

        // Define a alternativa correta a partir de isCorrect=true ou correctAlternativeId
        Alternative correct = null;
        if (dto.getCorrectAlternativeId() != null) {
            correct = saved.getAlternatives().stream()
                    .filter(a -> dto.getCorrectAlternativeId().equals(a.getId()))
                    .findFirst()
                    .orElse(null);
        }
        if (correct == null) {
            correct = saved.getAlternatives().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .findFirst()
                    .orElse(null);
        }

        if (correct != null) {
            saved.setCorrectAlternative(correct);
        }

        if (saved.getStatistic() == null) {
            QuestionStatistic stat = QuestionStatistic.builder()
                    .question(saved)
                    .questionId(saved.getId())
                    .totalAttempts(0L)
                    .firstAttempts(0L)
                    .firstAttemptCorrect(0L)
                    .firstAttemptAccuracy(0.0)
                    .difficultyLevel(DifficultyLevel.SEM_DADOS)
                    .build();
            saved.setStatistic(stat);
        }

        saved = questionRepository.save(saved);
        return questionMapper.toDTO(saved);
    }

    @Transactional
    public QuestionResponseDTO update(Long id, QuestionRequestDTO dto) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + id));

        Origin origin = originRepository.findById(dto.getOriginId())
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));

        Area area = areaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));

        Subject subject = null;
        if (dto.getSubjectId() != null) {
            subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com o id: " + dto.getSubjectId()));
        }

        Test test = null;
        if (dto.getTestId() != null) {
            test = testRepository.findById(dto.getTestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + dto.getTestId()));
        }

        questionMapper.updateEntityFromDTO(dto, question);
        question.setOrigin(origin);
        question.setArea(area);
        question.setSubject(subject);
        question.setTest(test);

        if (dto.getAlternatives() != null) {
            question.getAlternatives().clear();
            for (var altDto : dto.getAlternatives()) {
                Alternative alt = alternativeMapper.toEntity(altDto);
                alt.setQuestion(question);
                question.getAlternatives().add(alt);
            }
        }

        Question updated = questionRepository.save(question);

        // Atualiza a alternativa correta
        Alternative correct = null;
        if (dto.getCorrectAlternativeId() != null) {
            correct = updated.getAlternatives().stream()
                    .filter(a -> dto.getCorrectAlternativeId().equals(a.getId()))
                    .findFirst()
                    .orElse(null);
        }
        if (correct == null) {
            correct = updated.getAlternatives().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .findFirst()
                    .orElse(null);
        }
        updated.setCorrectAlternative(correct);
        updated = questionRepository.save(updated);

        return questionMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Questão não encontrada com o id: " + id);
        }
        questionRepository.deleteById(id);
    }
}
