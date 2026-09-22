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
    private final github.felkng.olha_minha_questao.domain.repository.TextualReferenceRepository textualReferenceRepository;
    private final QuestionMapper questionMapper;
    private final AlternativeMapper alternativeMapper;

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year, Pageable pageable) {
        return findAll(originId, areaId, testId, year, null, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year,
                                             String difficulty, String search, String sort, Pageable pageable) {
        return findAll(originId, areaId, testId, year, difficulty, search, sort, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year,
                                             String difficulty, String search, String sort, Long createdByUserId, Pageable pageable) {
        return findAll(originId, areaId, testId, year, difficulty, search, sort, createdByUserId, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponseDTO> findAll(Long originId, Long areaId, Long testId, Integer year,
                                             String difficulty, String search, String sort, Long createdByUserId, Long currentUserId, Pageable pageable) {
        Specification<Question> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Regra de Privacidade
            if (currentUserId == null) {
                predicates.add(cb.isTrue(root.get("isPublic")));
            } else {
                if (createdByUserId != null && createdByUserId.equals(currentUserId)) {
                    // Usuário visualizando suas próprias questões -> exibe públicas e privadas
                } else {
                    predicates.add(cb.or(
                            cb.isTrue(root.get("isPublic")),
                            cb.equal(root.get("createdByUser").get("id"), currentUserId)
                    ));
                }
            }

            if (createdByUserId != null) {
                predicates.add(cb.equal(root.get("createdByUser").get("id"), createdByUserId));
            }
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
                Join<Question, Origin> originJoin = root.join("origin", JoinType.LEFT);
                Join<Question, Area> areaJoin = root.join("area", JoinType.LEFT);
                Join<Question, Test> testJoin = root.join("test", JoinType.LEFT);
                Join<Question, Subject> subjectJoin = root.join("subject", JoinType.LEFT);

                String[] words = search.trim().split("\\s+");
                List<Predicate> wordPredicates = new ArrayList<>();

                for (String word : words) {
                    if (word.isBlank()) continue;
                    String normalized = java.text.Normalizer.normalize(word, java.text.Normalizer.Form.NFD)
                            .replaceAll("\\p{M}", "")
                            .toLowerCase();
                    String pattern = "%" + normalized + "%";
                    String rawPattern = "%" + word.toLowerCase() + "%";

                    jakarta.persistence.criteria.Expression<String> unaccentEnunciado = cb.function("translate", String.class,
                            cb.lower(root.get("enunciado")),
                            cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                            cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

                    jakarta.persistence.criteria.Expression<String> unaccentIdentifier = cb.function("translate", String.class,
                            cb.lower(root.get("identifier")),
                            cb.literal("áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ"),
                            cb.literal("aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC"));

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

                    List<Predicate> fieldPredicates = new ArrayList<>();
                    // Unaccented matches
                    fieldPredicates.add(cb.like(unaccentEnunciado, pattern));
                    fieldPredicates.add(cb.like(unaccentIdentifier, pattern));
                    fieldPredicates.add(cb.like(unaccentOrigin, pattern));
                    fieldPredicates.add(cb.like(unaccentArea, pattern));
                    fieldPredicates.add(cb.like(unaccentTest, pattern));
                    fieldPredicates.add(cb.like(unaccentSubject, pattern));

                    // Raw LIKE matches
                    fieldPredicates.add(cb.like(cb.lower(root.get("enunciado")), rawPattern));
                    fieldPredicates.add(cb.like(cb.lower(root.get("identifier")), rawPattern));
                    fieldPredicates.add(cb.like(cb.lower(originJoin.get("name")), rawPattern));
                    fieldPredicates.add(cb.like(cb.lower(areaJoin.get("name")), rawPattern));
                    fieldPredicates.add(cb.like(cb.lower(testJoin.get("name")), rawPattern));
                    fieldPredicates.add(cb.like(cb.lower(subjectJoin.get("name")), rawPattern));

                    if (word.matches("\\d+")) {
                        try {
                            int parsed = Integer.parseInt(word);
                            fieldPredicates.add(cb.equal(root.get("year"), parsed));
                        } catch (NumberFormatException ignored) {}
                    }

                    wordPredicates.add(cb.or(fieldPredicates.toArray(new Predicate[0])));
                }

                if (!wordPredicates.isEmpty()) {
                    predicates.add(cb.and(wordPredicates.toArray(new Predicate[0])));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable sortedPageable;
        if ("mostAnswered".equalsIgnoreCase(sort)) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "statistic.totalAttempts")
                            .and(Sort.by(Sort.Direction.DESC, "createdAt")));
        } else if (sort == null || "recent".equalsIgnoreCase(sort) || pageable.getSort().isUnsorted() || pageable.getSort().getOrderFor("recent") != null) {
            sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                    Sort.by(Sort.Direction.DESC, "year")
                            .and(Sort.by(Sort.Direction.DESC, "id")));
        } else {
            sortedPageable = pageable;
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
        if (dto.getAlternatives() == null || dto.getAlternatives().size() < 2) {
            throw new IllegalArgumentException("A questão deve conter no mínimo 2 alternativas.");
        }

        User creator = null;
        if (userId != null) {
            creator = userRepository.findById(userId).orElse(null);
        }

        Origin origin = null;
        if (dto.getOriginId() != null) {
            // Apenas administradores podem definir a banca da questão
            if (creator == null || creator.getRole() == github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                origin = originRepository.findById(dto.getOriginId())
                        .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));
            }
        }

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        Subject subject = null;
        if (dto.getSubjectId() != null) {
            subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com o id: " + dto.getSubjectId()));
        }

        Test test = null;
        if (dto.getTestId() != null) {
            test = testRepository.findById(dto.getTestId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + dto.getTestId()));

            // Usuários comuns só podem associar questões a provas criadas por eles mesmos
            if (creator != null && creator.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (test.getCreatedByUser() == null || !test.getCreatedByUser().getId().equals(creator.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Usuários comuns só podem associar questões a provas criadas por eles mesmos.");
                }
            }
        }

        github.felkng.olha_minha_questao.domain.entity.TextualReference textualReference = null;
        if (dto.getTextualReferenceId() != null) {
            textualReference = textualReferenceRepository.findById(dto.getTextualReferenceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Referência textual não encontrada com o id: " + dto.getTextualReferenceId()));
        }

        Question question = questionMapper.toEntity(dto);
        question.setOrigin(origin);
        question.setArea(area);
        question.setSubject(subject);
        question.setTest(test);
        question.setTextualReference(textualReference);
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

        if (dto.getIsPublic() != null) {
            question.setIsPublic(dto.getIsPublic());
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
        return update(id, dto, null);
    }

    @Transactional
    public QuestionResponseDTO update(Long id, QuestionRequestDTO dto, Long userId) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (question.getCreatedByUser() == null || !question.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para editar esta questão.");
                }
            }
        }

        if (dto.getAlternatives() != null && dto.getAlternatives().size() < 2) {
            throw new IllegalArgumentException("A questão deve conter no mínimo 2 alternativas.");
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

        github.felkng.olha_minha_questao.domain.entity.TextualReference textualReference = null;
        if (dto.getTextualReferenceId() != null && dto.getTextualReferenceId() > 0) {
            textualReference = textualReferenceRepository.findById(dto.getTextualReferenceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Referência textual não encontrada com o id: " + dto.getTextualReferenceId()));
        }

        questionMapper.updateEntityFromDTO(dto, question);
        question.setOrigin(origin);
        question.setArea(area);
        question.setSubject(subject);
        question.setTest(test);
        question.setTextualReference(textualReference);
        if (dto.getIsPublic() != null) {
            question.setIsPublic(dto.getIsPublic());
        }

        if (dto.getAlternatives() != null) {
            question.setCorrectAlternative(null);
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
    public QuestionResponseDTO toggleVisibility(Long id, Long userId) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                if (question.getCreatedByUser() == null || !question.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para alterar a visibilidade desta questão.");
                }
            }
        }

        question.setIsPublic(!Boolean.TRUE.equals(question.getIsPublic()));
        Question updated = questionRepository.save(question);
        return questionMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        delete(id, null);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() == github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                // Admin pode excluir se for público ou criado por ele mesmo
                if (!Boolean.TRUE.equals(question.getIsPublic()) && (question.getCreatedByUser() == null || !question.getCreatedByUser().getId().equals(user.getId()))) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Administradores podem moderar apenas conteúdos públicos de terceiros.");
                }
            } else {
                // Usuário comum só pode excluir suas próprias questões
                if (question.getCreatedByUser() == null || !question.getCreatedByUser().getId().equals(user.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Você não tem permissão para excluir esta questão.");
                }
            }
        }

        questionRepository.delete(question);
    }
}
