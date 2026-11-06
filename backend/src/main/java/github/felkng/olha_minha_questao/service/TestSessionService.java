package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Alternative;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.entity.TestSession;
import github.felkng.olha_minha_questao.domain.entity.TestSessionItem;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.AlternativeRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.domain.repository.TestSessionRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.test.TestSessionItemDTO;
import github.felkng.olha_minha_questao.dto.test.TestSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSessionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.UserMapper;
import github.felkng.olha_minha_questao.util.QuestionIdentifierComparator;
import lombok.Getter;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TestSessionService {

    private final TestSessionRepository testSessionRepository;
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final AlternativeRepository alternativeRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Getter
    @RequiredArgsConstructor
    public static class SessionUpsertResult {
        private final TestSessionResponseDTO response;
        private final boolean created;
    }

    @Transactional
    public SessionUpsertResult createOrUpdateSession(Long testId, TestSessionRequestDTO dto, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));

        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + testId));

        Optional<TestSession> existingOpt = testSessionRepository
                .findFirstByUserIdAndTestIdAndCompletedFalseOrderByUpdatedAtDesc(userId, testId);

        if (existingOpt.isPresent()) {
            TestSession existing = existingOpt.get();
            if (dto != null) {
                if (dto.getQuestionIds() != null && !dto.getQuestionIds().isEmpty()) {
                    existing.setQuestionIds(joinIds(dto.getQuestionIds()));
                }
                if (dto.getTimerMinutes() != null) {
                    existing.setTimerMinutes(dto.getTimerMinutes());
                }
                if (dto.getTimeSpentSeconds() != null) {
                    existing.setTimeSpentSeconds(dto.getTimeSpentSeconds());
                }
                if (dto.getActiveQuestionIndex() != null) {
                    existing.setActiveQuestionIndex(dto.getActiveQuestionIndex());
                }
                if (dto.getCompleted() != null) {
                    existing.setCompleted(dto.getCompleted());
                }
                if (dto.getItems() != null) {
                    existing.getItems().clear();
                    testSessionRepository.saveAndFlush(existing);
                    addItemsToSession(existing, dto.getItems());
                }
            }
            existing.setUpdatedAt(Instant.now());
            TestSession saved = testSessionRepository.saveAndFlush(existing);
            return new SessionUpsertResult(toResponseDTO(saved), false);
        }

        List<Long> resolvedQuestionIds;
        if (dto != null && dto.getQuestionIds() != null && !dto.getQuestionIds().isEmpty()) {
            resolvedQuestionIds = dto.getQuestionIds();
        } else {
            QuestionIdentifierComparator comparator = new QuestionIdentifierComparator();
            resolvedQuestionIds = questionRepository.findAllQuestionsByTestId(testId).stream()
                    .sorted((q1, q2) -> comparator.compare(q1.getIdentifier(), q2.getIdentifier()))
                    .map(Question::getId)
                    .toList();
        }

        TestSession session = TestSession.builder()
                .user(user)
                .test(test)
                .questionIds(joinIds(resolvedQuestionIds))
                .timerMinutes(dto != null && dto.getTimerMinutes() != null ? dto.getTimerMinutes() : 0)
                .timeSpentSeconds(dto != null && dto.getTimeSpentSeconds() != null ? dto.getTimeSpentSeconds() : 0)
                .activeQuestionIndex(dto != null && dto.getActiveQuestionIndex() != null ? dto.getActiveQuestionIndex() : 0)
                .completed(dto != null && dto.getCompleted() != null ? dto.getCompleted() : false)
                .build();

        TestSession saved = testSessionRepository.saveAndFlush(session);

        if (dto != null && dto.getItems() != null && !dto.getItems().isEmpty()) {
            addItemsToSession(saved, dto.getItems());
            saved = testSessionRepository.saveAndFlush(saved);
        }

        return new SessionUpsertResult(toResponseDTO(saved), true);
    }

    @Transactional(readOnly = true)
    public Optional<TestSessionResponseDTO> getActiveSession(Long testId, Long userId) {
        if (userId == null) {
            return Optional.empty();
        }
        if (!testRepository.existsById(testId)) {
            throw new ResourceNotFoundException("Prova não encontrada com o id: " + testId);
        }
        return testSessionRepository
                .findFirstByUserIdAndTestIdAndCompletedFalseOrderByUpdatedAtDesc(userId, testId)
                .map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public TestSessionResponseDTO getSessionById(Long sessionId, Long userId) {
        TestSession session = testSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de simulado não encontrada com o id: " + sessionId));

        if (userId != null) {
            verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para visualizar esta sessão de simulado.");
        }

        return toResponseDTO(session);
    }

    @Transactional
    public TestSessionResponseDTO updateSession(Long sessionId, TestSessionRequestDTO dto, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        TestSession session = testSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de simulado não encontrada com o id: " + sessionId));

        verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para atualizar esta sessão de simulado.");

        if (dto != null) {
            if (dto.getQuestionIds() != null && !dto.getQuestionIds().isEmpty()) {
                session.setQuestionIds(joinIds(dto.getQuestionIds()));
            }
            if (dto.getTimerMinutes() != null) {
                session.setTimerMinutes(dto.getTimerMinutes());
            }
            if (dto.getTimeSpentSeconds() != null) {
                session.setTimeSpentSeconds(dto.getTimeSpentSeconds());
            }
            if (dto.getActiveQuestionIndex() != null) {
                session.setActiveQuestionIndex(dto.getActiveQuestionIndex());
            }
            if (dto.getCompleted() != null) {
                session.setCompleted(dto.getCompleted());
            }
            if (dto.getItems() != null) {
                session.getItems().clear();
                testSessionRepository.saveAndFlush(session);
                addItemsToSession(session, dto.getItems());
            }
        }

        session.setUpdatedAt(Instant.now());
        TestSession updated = testSessionRepository.saveAndFlush(session);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        TestSession session = testSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sessão de simulado não encontrada com o id: " + sessionId));

        verifyOwnershipOrAdmin(session, userId, "Você não tem permissão para excluir esta sessão de simulado.");

        testSessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<TestSessionResponseDTO> getUserSessions(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return testSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    private void verifyOwnershipOrAdmin(TestSession session, Long userId, String forbiddenMessage) {
        if (session.getUser() != null && session.getUser().getId().equals(userId)) {
            return;
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, forbiddenMessage);
        }
    }

    private void addItemsToSession(TestSession session, List<TestSessionItemDTO> itemDTOs) {
        Map<Long, TestSessionItemDTO> deduplicated = new LinkedHashMap<>();
        for (TestSessionItemDTO itemDTO : itemDTOs) {
            if (itemDTO != null && itemDTO.getQuestionId() != null) {
                deduplicated.put(itemDTO.getQuestionId(), itemDTO);
            }
        }

        for (TestSessionItemDTO itemDTO : deduplicated.values()) {
            Question question = questionRepository.findById(itemDTO.getQuestionId()).orElse(null);
            if (question == null) {
                continue;
            }

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

            TestSessionItem item = TestSessionItem.builder()
                    .session(session)
                    .question(question)
                    .selectedAlternative(selectedAlt)
                    .timeSpentSeconds(itemDTO.getTimeSpentSeconds() != null ? itemDTO.getTimeSpentSeconds() : 0)
                    .build();

            session.getItems().add(item);
        }
    }

    private TestSessionResponseDTO toResponseDTO(TestSession session) {
        Test test = session.getTest();
        List<Long> qIds = parseIds(session.getQuestionIds());
        int totalQuestions = !qIds.isEmpty()
                ? qIds.size()
                : (test != null && test.getId() != null ? questionRepository.findAllQuestionsByTestId(test.getId()).size() : 0);

        List<TestSessionItemDTO> itemDTOs = session.getItems() != null
                ? session.getItems().stream()
                .map(item -> TestSessionItemDTO.builder()
                        .id(item.getId())
                        .questionId(item.getQuestion() != null ? item.getQuestion().getId() : null)
                        .selectedAlternativeId(item.getSelectedAlternative() != null ? item.getSelectedAlternative().getId() : null)
                        .timeSpentSeconds(item.getTimeSpentSeconds() != null ? item.getTimeSpentSeconds() : 0)
                        .build())
                .toList()
                : new ArrayList<>();

        int answeredCount = (int) itemDTOs.stream()
                .filter(i -> i.getSelectedAlternativeId() != null)
                .count();

        return TestSessionResponseDTO.builder()
                .id(session.getId())
                .user(userMapper.toSummaryDTO(session.getUser()))
                .testId(test != null ? test.getId() : null)
                .testName(test != null ? test.getName() : null)
                .originName(test != null && test.getOrigin() != null ? test.getOrigin().getName() : null)
                .areaName(test != null && test.getArea() != null ? test.getArea().getName() : null)
                .questionIds(qIds)
                .totalQuestions(totalQuestions)
                .answeredCount(answeredCount)
                .timerMinutes(session.getTimerMinutes() != null ? session.getTimerMinutes() : 0)
                .timeSpentSeconds(session.getTimeSpentSeconds() != null ? session.getTimeSpentSeconds() : 0)
                .activeQuestionIndex(session.getActiveQuestionIndex() != null ? session.getActiveQuestionIndex() : 0)
                .completed(session.getCompleted())
                .testAttemptId(session.getTestAttempt() != null ? session.getTestAttempt().getId() : null)
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .items(itemDTOs)
                .build();
    }

    private String joinIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }
        return String.join(",", ids.stream().map(String::valueOf).toList());
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
