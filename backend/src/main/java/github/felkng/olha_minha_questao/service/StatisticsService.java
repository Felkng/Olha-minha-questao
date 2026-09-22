package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Alternative;
import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionAttempt;
import github.felkng.olha_minha_questao.domain.entity.QuestionStatistic;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.entity.TestAttempt;
import github.felkng.olha_minha_questao.domain.entity.TestStatistic;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.FlashcardRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionStatisticRepository;
import github.felkng.olha_minha_questao.domain.repository.TestAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.domain.repository.TestStatisticRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptResponseDTO;
import github.felkng.olha_minha_questao.dto.statistics.PlatformSummaryDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final QuestionRepository questionRepository;
    private final QuestionAttemptRepository questionAttemptRepository;
    private final QuestionStatisticRepository questionStatisticRepository;
    private final TestRepository testRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final TestStatisticRepository testStatisticRepository;
    private final UserRepository userRepository;
    private final OriginRepository originRepository;
    private final AreaRepository areaRepository;
    private final FlashcardRepository flashcardRepository;

    @Transactional
    public QuestionAttemptResponseDTO registerQuestionAttempt(Long questionId, QuestionAttemptRequestDTO dto) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + questionId));

        User user = null;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId()).orElse(null);
        }

        boolean isCorrect = false;
        if (dto.getSelectedAlternativeId() != null) {
            if (question.getCorrectAlternative() != null && question.getCorrectAlternative().getId() != null) {
                isCorrect = question.getCorrectAlternative().getId().equals(dto.getSelectedAlternativeId());
            } else if (question.getAlternatives() != null) {
                isCorrect = question.getAlternatives().stream()
                        .filter(a -> a.getId().equals(dto.getSelectedAlternativeId()))
                        .map(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                        .findFirst()
                        .orElse(false);
            }
        }

        boolean isFirstAttempt = true;
        if (dto.getIsFirstAttempt() != null) {
            isFirstAttempt = dto.getIsFirstAttempt();
        } else if (user != null) {
            boolean alreadyAttemptedByUser = questionAttemptRepository.existsByQuestionIdAndUserId(questionId, user.getId());
            if (alreadyAttemptedByUser) {
                isFirstAttempt = false;
            }
        } else if (dto.getSessionId() != null && !dto.getSessionId().isBlank()) {
            boolean alreadyAttemptedInSession = questionAttemptRepository.existsByQuestionIdAndSessionId(questionId, dto.getSessionId());
            if (alreadyAttemptedInSession) {
                isFirstAttempt = false;
            }
        }

        QuestionAttempt attempt = QuestionAttempt.builder()
                .question(question)
                .user(user)
                .selectedAlternative(dto.getSelectedAlternativeId() != null ?
                        question.getAlternatives().stream()
                                .filter(a -> a.getId().equals(dto.getSelectedAlternativeId()))
                                .findFirst().orElse(null) : null)
                .isCorrect(isCorrect)
                .isFirstAttempt(isFirstAttempt)
                .timeSpentSeconds(dto.getTimeSpentSeconds())
                .sessionId(dto.getSessionId())
                .build();
        questionAttemptRepository.save(attempt);

        QuestionStatistic statistic = question.getStatistic();
        if (statistic == null) {
            statistic = questionStatisticRepository.findById(questionId)
                    .orElseGet(() -> {
                        QuestionStatistic newStat = QuestionStatistic.builder()
                                .question(question)
                                .questionId(question.getId())
                                .totalAttempts(0L)
                                .firstAttempts(0L)
                                .firstAttemptCorrect(0L)
                                .firstAttemptAccuracy(0.0)
                                .difficultyLevel(DifficultyLevel.SEM_DADOS)
                                .build();
                        question.setStatistic(newStat);
                        return newStat;
                    });
        }
        statistic.setQuestion(question);
        statistic.setQuestionId(question.getId());

        statistic.setTotalAttempts(statistic.getTotalAttempts() + 1);

        if (isFirstAttempt) {
            statistic.setFirstAttempts(statistic.getFirstAttempts() + 1);
            if (isCorrect) {
                statistic.setFirstAttemptCorrect(statistic.getFirstAttemptCorrect() + 1);
            }
            double accuracy = (statistic.getFirstAttemptCorrect() * 100.0) / statistic.getFirstAttempts();
            accuracy = Math.round(accuracy * 100.0) / 100.0;
            statistic.setFirstAttemptAccuracy(accuracy);
            statistic.setDifficultyLevel(DifficultyLevel.fromAccuracy(accuracy));
        }

        QuestionStatistic savedStat = questionStatisticRepository.save(statistic);

        return QuestionAttemptResponseDTO.builder()
                .isCorrect(isCorrect)
                .correctAlternativeId(question.getCorrectAlternative() != null ? question.getCorrectAlternative().getId() : null)
                .accuracyPercentage(savedStat.getFirstAttemptAccuracy())
                .difficultyLevel(savedStat.getDifficultyLevel())
                .totalAttempts(savedStat.getTotalAttempts())
                .build();
    }

    @Transactional
    public TestSubmissionResponseDTO submitTestAttempt(Long testId, TestSubmissionRequestDTO dto) {
        return submitTestAttempt(testId, dto, dto != null ? dto.getUserId() : null);
    }

    @Transactional
    public TestSubmissionResponseDTO submitTestAttempt(Long testId, TestSubmissionRequestDTO dto, Long userId) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + testId));

        User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;

        List<Question> testQuestions = questionRepository.findByTestId(testId);

        // Mapeia respostas enviadas pelo usuário
        java.util.Map<Long, Long> answersMap = new java.util.HashMap<>();
        java.util.Map<Long, Integer> timeSpentMap = new java.util.HashMap<>();
        if (dto.getAnswers() != null) {
            for (TestSubmissionRequestDTO.QuestionAnswerDTO answer : dto.getAnswers()) {
                if (answer.getQuestionId() != null) {
                    answersMap.put(answer.getQuestionId(), answer.getSelectedAlternativeId());
                    timeSpentMap.put(answer.getQuestionId(), answer.getTimeSpentSeconds());
                }
            }
        }

        List<TestSubmissionResponseDTO.QuestionResultDTO> detailedResults = new ArrayList<>();
        int correctCount = 0;

        // Itera sobre todas as questões da prova
        List<Question> questionsToProcess = !testQuestions.isEmpty() ? testQuestions :
                (dto.getAnswers() != null ? dto.getAnswers().stream()
                        .map(a -> questionRepository.findById(a.getQuestionId()).orElse(null))
                        .filter(java.util.Objects::nonNull)
                        .toList() : List.of());

        for (Question question : questionsToProcess) {
            Long selectedAltId = answersMap.get(question.getId());
            Integer qTimeSpent = timeSpentMap.getOrDefault(question.getId(), 0);

            if (selectedAltId != null) {
                QuestionAttemptRequestDTO attemptRequest = QuestionAttemptRequestDTO.builder()
                        .selectedAlternativeId(selectedAltId)
                        .timeSpentSeconds(qTimeSpent)
                        .sessionId(dto.getSessionId())
                        .userId(userId)
                        .build();

                QuestionAttemptResponseDTO attemptResponse = registerQuestionAttempt(question.getId(), attemptRequest);

                if (Boolean.TRUE.equals(attemptResponse.getIsCorrect())) {
                    correctCount++;
                }

                detailedResults.add(TestSubmissionResponseDTO.QuestionResultDTO.builder()
                        .questionId(question.getId())
                        .selectedAlternativeId(selectedAltId)
                        .correctAlternativeId(attemptResponse.getCorrectAlternativeId())
                        .isCorrect(attemptResponse.getIsCorrect())
                        .difficultyLevel(attemptResponse.getDifficultyLevel())
                        .build());
            } else {
                Long correctAltId = null;
                if (question.getCorrectAlternative() != null && question.getCorrectAlternative().getId() != null) {
                    correctAltId = question.getCorrectAlternative().getId();
                } else if (question.getAlternatives() != null) {
                    correctAltId = question.getAlternatives().stream()
                            .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                            .map(Alternative::getId)
                            .findFirst()
                            .orElse(null);
                }
                DifficultyLevel diffLevel = question.getStatistic() != null ? question.getStatistic().getDifficultyLevel() : DifficultyLevel.SEM_DADOS;

                detailedResults.add(TestSubmissionResponseDTO.QuestionResultDTO.builder()
                        .questionId(question.getId())
                        .selectedAlternativeId(null)
                        .correctAlternativeId(correctAltId)
                        .isCorrect(false)
                        .difficultyLevel(diffLevel)
                        .build());
            }
        }

        int totalQuestions = !questionsToProcess.isEmpty() ? questionsToProcess.size() :
                (dto.getAnswers() != null ? dto.getAnswers().size() : 0);
        double scorePercentage = totalQuestions > 0 ? (correctCount * 100.0) / totalQuestions : 0.0;
        scorePercentage = Math.round(scorePercentage * 100.0) / 100.0;

        TestAttempt testAttempt = TestAttempt.builder()
                .test(test)
                .user(user)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctCount)
                .scorePercentage(scorePercentage)
                .timeSpentSeconds(dto.getTimeSpentSeconds())
                .sessionId(dto.getSessionId())
                .build();
        testAttemptRepository.save(testAttempt);

        TestStatistic statistic = testStatisticRepository.findById(testId)
                .orElseGet(() -> {
                    TestStatistic newStat = TestStatistic.builder()
                            .test(test)
                            .testId(test.getId())
                            .totalAttempts(0L)
                            .averageScore(0.0)
                            .difficultyLevel(DifficultyLevel.SEM_DADOS)
                            .build();
                    return newStat;
                });
        statistic.setTest(test);
        statistic.setTestId(test.getId());

        long previousAttempts = statistic.getTotalAttempts();
        long newTotalAttempts = previousAttempts + 1;
        double newAverageScore = ((statistic.getAverageScore() * previousAttempts) + scorePercentage) / newTotalAttempts;
        newAverageScore = Math.round(newAverageScore * 100.0) / 100.0;

        statistic.setTotalAttempts(newTotalAttempts);
        statistic.setAverageScore(newAverageScore);
        statistic.setDifficultyLevel(DifficultyLevel.fromAccuracy(newAverageScore));
        testStatisticRepository.save(statistic);

        return TestSubmissionResponseDTO.builder()
                .testId(testId)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctCount)
                .scorePercentage(scorePercentage)
                .timeSpentSeconds(dto.getTimeSpentSeconds())
                .difficultyLevel(statistic.getDifficultyLevel())
                .detailedResults(detailedResults)
                .build();
    }

    @Transactional(readOnly = true)
    public List<github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO> getUserTestAttempts(Long userId) {
        List<TestAttempt> attempts = testAttemptRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return attempts.stream().map(this::toSummaryDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO> getTestAttempts(Long testId, Long userId) {
        List<TestAttempt> attempts;
        if (userId != null) {
            attempts = testAttemptRepository.findByTestIdAndUserIdOrderByCreatedAtDesc(testId, userId);
        } else {
            attempts = testAttemptRepository.findByTestId(testId);
        }
        return attempts.stream().map(this::toSummaryDTO).toList();
    }

    @Transactional(readOnly = true)
    public github.felkng.olha_minha_questao.dto.test.TestAttemptDetailDTO getTestAttemptDetail(Long attemptId) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Tentativa de simulado não encontrada com o id: " + attemptId));

        Test test = attempt.getTest();
        List<Question> questions = questionRepository.findByTestIdOrderByIdAsc(test.getId());

        List<QuestionAttempt> questionAttempts = attempt.getSessionId() != null && !attempt.getSessionId().isBlank()
                ? questionAttemptRepository.findBySessionId(attempt.getSessionId())
                : List.of();

        java.util.Map<Long, QuestionAttempt> qaMap = new java.util.HashMap<>();
        for (QuestionAttempt qa : questionAttempts) {
            if (qa.getQuestion() != null) {
                qaMap.put(qa.getQuestion().getId(), qa);
            }
        }

        List<TestSubmissionResponseDTO.QuestionResultDTO> detailedResults = new ArrayList<>();
        for (Question q : questions) {
            QuestionAttempt qa = qaMap.get(q.getId());

            Long selectedAltId = qa != null && qa.getSelectedAlternative() != null ? qa.getSelectedAlternative().getId() : null;
            boolean isCorrect = qa != null && Boolean.TRUE.equals(qa.getIsCorrect());

            Long correctAltId = null;
            if (q.getCorrectAlternative() != null && q.getCorrectAlternative().getId() != null) {
                correctAltId = q.getCorrectAlternative().getId();
            } else if (q.getAlternatives() != null) {
                correctAltId = q.getAlternatives().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                        .map(Alternative::getId)
                        .findFirst()
                        .orElse(null);
            }

            DifficultyLevel diffLevel = q.getStatistic() != null ? q.getStatistic().getDifficultyLevel() : DifficultyLevel.SEM_DADOS;

            detailedResults.add(TestSubmissionResponseDTO.QuestionResultDTO.builder()
                    .questionId(q.getId())
                    .selectedAlternativeId(selectedAltId)
                    .correctAlternativeId(correctAltId)
                    .isCorrect(isCorrect)
                    .difficultyLevel(diffLevel)
                    .build());
        }

        return github.felkng.olha_minha_questao.dto.test.TestAttemptDetailDTO.builder()
                .id(attempt.getId())
                .testId(test.getId())
                .testName(test.getName())
                .testYear(test.getYear())
                .originName(test.getOrigin() != null ? test.getOrigin().getName() : null)
                .areaName(test.getArea() != null ? test.getArea().getName() : null)
                .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .scorePercentage(attempt.getScorePercentage())
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .sessionId(attempt.getSessionId())
                .createdAt(attempt.getCreatedAt())
                .detailedResults(detailedResults)
                .build();
    }

    private github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO toSummaryDTO(TestAttempt attempt) {
        Test test = attempt.getTest();
        return github.felkng.olha_minha_questao.dto.test.TestAttemptSummaryDTO.builder()
                .id(attempt.getId())
                .testId(test != null ? test.getId() : null)
                .testName(test != null ? test.getName() : null)
                .testYear(test != null ? test.getYear() : null)
                .originName(test != null && test.getOrigin() != null ? test.getOrigin().getName() : null)
                .areaName(test != null && test.getArea() != null ? test.getArea().getName() : null)
                .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .scorePercentage(attempt.getScorePercentage())
                .timeSpentSeconds(attempt.getTimeSpentSeconds())
                .sessionId(attempt.getSessionId())
                .createdAt(attempt.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PlatformSummaryDTO getPlatformSummary() {
        long totalQuestions = questionRepository.count();
        long totalTests = testRepository.count();
        long totalFlashcards = flashcardRepository.count();
        java.time.Instant fiveDaysAgo = java.time.Instant.now().minus(5, java.time.temporal.ChronoUnit.DAYS);
        long activeUsers = questionAttemptRepository.countDistinctActiveUsersSince(fiveDaysAgo);
        long totalOrigins = originRepository.count();
        long totalAreas = areaRepository.count();
        long totalAttempts = questionAttemptRepository.count();

        return PlatformSummaryDTO.builder()
                .totalQuestions(totalQuestions)
                .totalTests(totalTests)
                .totalFlashcards(totalFlashcards)
                .activeUsersLast5Days(activeUsers)
                .totalOrigins(totalOrigins)
                .totalAreas(totalAreas)
                .totalAttempts(totalAttempts)
                .build();
    }
}
