package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Alternative;
import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionSession;
import github.felkng.olha_minha_questao.domain.entity.QuestionSessionItem;
import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.AlternativeRepository;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.FolderRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionSessionRepository;
import github.felkng.olha_minha_questao.domain.repository.SubjectRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionItemDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionSessionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class QuestionSessionService {

    private final QuestionSessionRepository questionSessionRepository;
    private final QuestionRepository questionRepository;
    private final AlternativeRepository alternativeRepository;
    private final FolderRepository folderRepository;
    private final OriginRepository originRepository;
    private final AreaRepository areaRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public QuestionSessionResponseDTO saveSession(QuestionSessionRequestDTO dto, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));

        Folder folder = dto != null && dto.getFolderId() != null
                ? folderRepository.findById(dto.getFolderId()).orElse(null)
                : null;
        Origin origin = dto != null && dto.getOriginId() != null
                ? originRepository.findById(dto.getOriginId()).orElse(null)
                : null;
        Area area = dto != null && dto.getAreaId() != null
                ? areaRepository.findById(dto.getAreaId()).orElse(null)
                : null;
        Subject subject = dto != null && dto.getSubjectId() != null
                ? subjectRepository.findById(dto.getSubjectId()).orElse(null)
                : null;

        List<Long> qIdsList;
        if (dto != null && dto.getQuestionIds() != null && !dto.getQuestionIds().isEmpty()) {
            qIdsList = dto.getQuestionIds();
        } else if (dto != null && dto.getItems() != null && !dto.getItems().isEmpty()) {
            qIdsList = dto.getItems().stream()
                    .map(QuestionSessionItemDTO::getQuestionId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
        } else {
            qIdsList = List.of();
        }

        int totalQuestions;
        if (dto != null && dto.getTotalQuestions() != null && dto.getTotalQuestions() > 0) {
            totalQuestions = dto.getTotalQuestions();
        } else if (!qIdsList.isEmpty()) {
            totalQuestions = qIdsList.size();
        } else if (dto != null && dto.getItems() != null) {
            totalQuestions = dto.getItems().size();
        } else {
            totalQuestions = 0;
        }

        boolean completed = dto != null && dto.getCompleted() != null ? dto.getCompleted() : false;

        QuestionSession session = QuestionSession.builder()
                .user(user)
                .folder(folder)
                .origin(origin)
                .area(area)
                .subject(subject)
                .title(dto != null ? dto.getTitle() : null)
                .questionIds(joinIdsNotNull(qIdsList))
                .totalQuestions(totalQuestions)
                .correctCount(0)
                .wrongCount(0)
                .skippedCount(0)
                .timeSpentSeconds(dto != null && dto.getTimeSpentSeconds() != null ? dto.getTimeSpentSeconds() : 0)
                .completed(completed)
                .build();

        QuestionSession savedSession = questionSessionRepository.saveAndFlush(session);

        if (dto != null && dto.getItems() != null && !dto.getItems().isEmpty()) {
            applyItemsAndCounters(savedSession, dto.getItems());
            savedSession = questionSessionRepository.saveAndFlush(savedSession);
        }

        return toResponseDTO(savedSession);
    }

    @Transactional
    public QuestionSessionResponseDTO updateSession(Long sessionId, QuestionSessionRequestDTO dto, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        QuestionSession session = questionSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de estudo de questões não encontrada com o id: " + sessionId));

        verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para alterar esta sessão de estudo.");

        if (dto != null) {
            if (dto.getTitle() != null) {
                session.setTitle(dto.getTitle());
            }
            if (dto.getFolderId() != null) {
                session.setFolder(folderRepository.findById(dto.getFolderId()).orElse(null));
            }
            if (dto.getOriginId() != null) {
                session.setOrigin(originRepository.findById(dto.getOriginId()).orElse(null));
            }
            if (dto.getAreaId() != null) {
                session.setArea(areaRepository.findById(dto.getAreaId()).orElse(null));
            }
            if (dto.getSubjectId() != null) {
                session.setSubject(subjectRepository.findById(dto.getSubjectId()).orElse(null));
            }
            if (dto.getTimeSpentSeconds() != null) {
                session.setTimeSpentSeconds(dto.getTimeSpentSeconds());
            }
            if (dto.getCompleted() != null) {
                session.setCompleted(dto.getCompleted());
            }
            if (dto.getTotalQuestions() != null && dto.getTotalQuestions() > 0) {
                session.setTotalQuestions(dto.getTotalQuestions());
            }
            if (dto.getQuestionIds() != null && !dto.getQuestionIds().isEmpty()) {
                session.setQuestionIds(joinIdsNotNull(dto.getQuestionIds()));
            }
            if (dto.getItems() != null) {
                session.getItems().clear();
                questionSessionRepository.saveAndFlush(session);
                applyItemsAndCounters(session, dto.getItems());
            }
        }

        session.setUpdatedAt(Instant.now());
        QuestionSession updated = questionSessionRepository.saveAndFlush(session);
        return toResponseDTO(updated);
    }

    @Transactional(readOnly = true)
    public QuestionSessionResponseDTO getSessionById(Long sessionId, Long userId) {
        QuestionSession session = questionSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de estudo de questões não encontrada com o id: " + sessionId));

        if (userId != null) {
            verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para visualizar esta sessão de estudo.");
        }

        return toResponseDTO(session);
    }

    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        QuestionSession session = questionSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de estudo de questões não encontrada com o id: " + sessionId));

        verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para excluir esta sessão de estudo.");

        questionSessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<QuestionSessionResponseDTO> getUserSessions(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return questionSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private void verifyOwnershipOrAdmin(QuestionSession session, Long userId, String forbiddenMessage) {
        if (session.getUser() != null && session.getUser().getId().equals(userId)) {
            return;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
        }
    }

    private void applyItemsAndCounters(QuestionSession session, List<QuestionSessionItemDTO> itemDTOs) {
        Map<Long, QuestionSessionItemDTO> deduplicated = new LinkedHashMap<>();
        for (QuestionSessionItemDTO itemDTO : itemDTOs) {
            if (itemDTO != null && itemDTO.getQuestionId() != null) {
                deduplicated.put(itemDTO.getQuestionId(), itemDTO);
            }
        }

        int correct = 0;
        int wrong = 0;
        int skipped = 0;
        List<Question> participatingQuestions = new ArrayList<>();

        for (QuestionSessionItemDTO itemDTO : deduplicated.values()) {
            Question question = questionRepository.findById(itemDTO.getQuestionId()).orElse(null);
            if (question == null) {
                continue;
            }
            participatingQuestions.add(question);

            Alternative selectedAlt = null;
            if (itemDTO.getSelectedAlternativeId() != null) {
                if (question.getAlternatives() != null) {
                    selectedAlt = question.getAlternatives().stream()
                            .filter(a -> itemDTO.getSelectedAlternativeId().equals(a.getId()))
                            .findFirst()
                            .orElse(null);
                }
                if (selectedAlt == null) {
                    selectedAlt = alternativeRepository.findById(itemDTO.getSelectedAlternativeId()).orElse(null);
                }
            }

            String status;
            if (itemDTO.getStatus() != null && !itemDTO.getStatus().isBlank()) {
                String normalized = itemDTO.getStatus().trim().toUpperCase();
                if ("CORRECT".equals(normalized)) {
                    status = "CORRECT";
                    correct++;
                } else if ("WRONG".equals(normalized)) {
                    status = "WRONG";
                    wrong++;
                } else {
                    status = "SKIPPED";
                    skipped++;
                }
            } else if (selectedAlt != null) {
                boolean isAnnulled = question.getAlternatives() != null && !question.getAlternatives().isEmpty()
                        && question.getAlternatives().stream().allMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()));
                boolean isRight = isAnnulled
                        || (question.getCorrectAlternative() != null && selectedAlt.getId().equals(question.getCorrectAlternative().getId()))
                        || Boolean.TRUE.equals(selectedAlt.getIsCorrect());
                if (isRight) {
                    status = "CORRECT";
                    correct++;
                } else {
                    status = "WRONG";
                    wrong++;
                }
            } else {
                status = "SKIPPED";
                skipped++;
            }

            QuestionSessionItem item = QuestionSessionItem.builder()
                    .session(session)
                    .question(question)
                    .selectedAlternative(selectedAlt)
                    .status(status)
                    .build();

            session.getItems().add(item);
        }

        if (session.getOrigin() == null && !participatingQuestions.isEmpty()) {
            Origin firstOrigin = participatingQuestions.get(0).getOrigin();
            if (firstOrigin != null && participatingQuestions.stream().allMatch(q -> q.getOrigin() != null && q.getOrigin().getId().equals(firstOrigin.getId()))) {
                session.setOrigin(firstOrigin);
            }
        }
        if (session.getArea() == null && !participatingQuestions.isEmpty()) {
            Area firstArea = participatingQuestions.get(0).getArea();
            if (firstArea != null && participatingQuestions.stream().allMatch(q -> q.getArea() != null && q.getArea().getId().equals(firstArea.getId()))) {
                session.setArea(firstArea);
            }
        }
        if (session.getSubject() == null && !participatingQuestions.isEmpty()) {
            Subject firstSubject = participatingQuestions.get(0).getSubject();
            if (firstSubject != null && participatingQuestions.stream().allMatch(q -> q.getSubject() != null && q.getSubject().getId().equals(firstSubject.getId()))) {
                session.setSubject(firstSubject);
            }
        }

        session.setCorrectCount(correct);
        session.setWrongCount(wrong);
        session.setSkippedCount(skipped);
    }

    private QuestionSessionResponseDTO toResponseDTO(QuestionSession session) {
        int correct = session.getCorrectCount() != null ? session.getCorrectCount() : 0;
        int wrong = session.getWrongCount() != null ? session.getWrongCount() : 0;
        int skipped = session.getSkippedCount() != null ? session.getSkippedCount() : 0;
        int totalAnswered = correct + wrong + skipped;
        double accuracyPercentage = totalAnswered > 0 ? ((double) correct / totalAnswered) * 100.0 : 0.0;

        List<QuestionSessionItemDTO> itemDTOs = session.getItems() != null
                ? session.getItems().stream()
                .map(this::toItemDTO)
                .toList()
                : new ArrayList<>();

        return QuestionSessionResponseDTO.builder()
                .id(session.getId())
                .user(userMapper.toSummaryDTO(session.getUser()))
                .folderId(session.getFolder() != null ? session.getFolder().getId() : null)
                .folderName(session.getFolder() != null ? session.getFolder().getName() : null)
                .originId(session.getOrigin() != null ? session.getOrigin().getId() : null)
                .originName(session.getOrigin() != null ? session.getOrigin().getName() : null)
                .areaId(session.getArea() != null ? session.getArea().getId() : null)
                .areaName(session.getArea() != null ? session.getArea().getName() : null)
                .subjectId(session.getSubject() != null ? session.getSubject().getId() : null)
                .subjectName(session.getSubject() != null ? session.getSubject().getName() : null)
                .title(session.getTitle())
                .totalQuestions(session.getTotalQuestions() != null ? session.getTotalQuestions() : 0)
                .correctCount(correct)
                .wrongCount(wrong)
                .skippedCount(skipped)
                .timeSpentSeconds(session.getTimeSpentSeconds() != null ? session.getTimeSpentSeconds() : 0)
                .accuracyPercentage(accuracyPercentage)
                .completed(session.getCompleted())
                .questionIds(parseIds(session.getQuestionIds()))
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .items(itemDTOs)
                .build();
    }

    private QuestionSessionItemDTO toItemDTO(QuestionSessionItem item) {
        Question q = item.getQuestion();
        Alternative selectedAlt = item.getSelectedAlternative();

        String correctIdentifier = null;
        if (q != null) {
            if (q.getCorrectAlternative() != null) {
                correctIdentifier = q.getCorrectAlternative().getIdentifier();
            } else if (q.getAlternatives() != null && !q.getAlternatives().isEmpty()) {
                boolean isAnnulled = q.getAlternatives().size() >= 2
                        && q.getAlternatives().stream().allMatch(a -> Boolean.TRUE.equals(a.getIsCorrect()));
                if (!isAnnulled) {
                    correctIdentifier = q.getAlternatives().stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                            .map(Alternative::getIdentifier)
                            .findFirst()
                            .orElse(null);
                }
            }
        }

        return QuestionSessionItemDTO.builder()
                .id(item.getId())
                .questionId(q != null ? q.getId() : null)
                .questionIdentifier(q != null ? q.getIdentifier() : null)
                .questionEnunciado(q != null ? q.getEnunciado() : null)
                .selectedAlternativeId(selectedAlt != null ? selectedAlt.getId() : null)
                .selectedAlternativeIdentifier(selectedAlt != null ? selectedAlt.getIdentifier() : null)
                .correctAlternativeIdentifier(correctIdentifier)
                .areaName(q != null && q.getArea() != null ? q.getArea().getName() : null)
                .subjectName(q != null && q.getSubject() != null ? q.getSubject().getName() : null)
                .status(item.getStatus())
                .build();
    }

    private String joinIdsNotNull(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return "";
        }
        return String.join(",", ids.stream().filter(Objects::nonNull).map(String::valueOf).toList());
    }

    private List<Long> parseIds(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Long::valueOf)
                .toList();
    }
}
