package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.QuestionAttempt;
import github.felkng.olha_minha_questao.domain.entity.QuestionStatistic;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.entity.TestAttempt;
import github.felkng.olha_minha_questao.domain.entity.TestStatistic;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionStatisticRepository;
import github.felkng.olha_minha_questao.domain.repository.TestAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.domain.repository.TestStatisticRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionAttemptResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestSubmissionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public QuestionAttemptResponseDTO registerQuestionAttempt(Long questionId, QuestionAttemptRequestDTO dto) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Questão não encontrada com o id: " + questionId));

        User user = null;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId()).orElse(null);
        }

        boolean isCorrect = false;
        if (dto.getSelectedAlternativeId() != null && question.getCorrectAlternative() != null) {
            isCorrect = question.getCorrectAlternative().getId().equals(dto.getSelectedAlternativeId());
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

        QuestionStatistic statistic = questionStatisticRepository.findById(questionId)
                .orElseGet(() -> QuestionStatistic.builder()
                        .question(question)
                        .questionId(questionId)
                        .totalAttempts(0L)
                        .firstAttempts(0L)
                        .firstAttemptCorrect(0L)
                        .firstAttemptAccuracy(0.0)
                        .difficultyLevel(DifficultyLevel.SEM_DADOS)
                        .build());

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
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + testId));

        List<TestSubmissionResponseDTO.QuestionResultDTO> detailedResults = new ArrayList<>();
        int correctCount = 0;

        if (dto.getAnswers() != null && !dto.getAnswers().isEmpty()) {
            for (TestSubmissionRequestDTO.QuestionAnswerDTO answer : dto.getAnswers()) {
                QuestionAttemptRequestDTO attemptRequest = QuestionAttemptRequestDTO.builder()
                        .selectedAlternativeId(answer.getSelectedAlternativeId())
                        .timeSpentSeconds(answer.getTimeSpentSeconds())
                        .sessionId(dto.getSessionId())
                        .isFirstAttempt(true)
                        .build();

                QuestionAttemptResponseDTO attemptResponse = registerQuestionAttempt(answer.getQuestionId(), attemptRequest);

                if (Boolean.TRUE.equals(attemptResponse.getIsCorrect())) {
                    correctCount++;
                }

                detailedResults.add(TestSubmissionResponseDTO.QuestionResultDTO.builder()
                        .questionId(answer.getQuestionId())
                        .selectedAlternativeId(answer.getSelectedAlternativeId())
                        .correctAlternativeId(attemptResponse.getCorrectAlternativeId())
                        .isCorrect(attemptResponse.getIsCorrect())
                        .difficultyLevel(attemptResponse.getDifficultyLevel())
                        .build());
            }
        }

        int totalQuestions = dto.getAnswers() != null ? dto.getAnswers().size() : 0;
        double scorePercentage = totalQuestions > 0 ? (correctCount * 100.0) / totalQuestions : 0.0;
        scorePercentage = Math.round(scorePercentage * 100.0) / 100.0;

        TestAttempt testAttempt = TestAttempt.builder()
                .test(test)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctCount)
                .scorePercentage(scorePercentage)
                .timeSpentSeconds(dto.getTimeSpentSeconds())
                .sessionId(dto.getSessionId())
                .build();
        testAttemptRepository.save(testAttempt);

        TestStatistic statistic = testStatisticRepository.findById(testId)
                .orElseGet(() -> TestStatistic.builder()
                        .test(test)
                        .testId(testId)
                        .totalAttempts(0L)
                        .averageScore(0.0)
                        .difficultyLevel(DifficultyLevel.SEM_DADOS)
                        .build());

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
}
