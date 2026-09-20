package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.QuestionAttempt;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.user.DailyActivityDTO;
import github.felkng.olha_minha_questao.dto.user.UserProfileDTO;
import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final QuestionAttemptRepository questionAttemptRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));

        List<QuestionAttempt> attempts = questionAttemptRepository.findByUserId(id);
        long totalResolved = attempts.size();
        long totalCorrect = 0;

        long easyTotal = 0;
        long easyCorrect = 0;
        long mediumTotal = 0;
        long mediumCorrect = 0;
        long hardTotal = 0;
        long hardCorrect = 0;

        // Mapas para agregar por Área, Matéria e Banca
        java.util.Map<Long, String> areaNames = new java.util.HashMap<>();
        java.util.Map<Long, long[]> areaStats = new java.util.HashMap<>(); // [total, correct]

        java.util.Map<Long, String> subjectNames = new java.util.HashMap<>();
        java.util.Map<Long, long[]> subjectStats = new java.util.HashMap<>();

        java.util.Map<Long, String> originNames = new java.util.HashMap<>();
        java.util.Map<Long, long[]> originStats = new java.util.HashMap<>();

        for (QuestionAttempt qa : attempts) {
            boolean isCorrect = Boolean.TRUE.equals(qa.getIsCorrect());
            if (isCorrect) totalCorrect++;

            DifficultyLevel diff = qa.getQuestion().getStatistic() != null
                    ? qa.getQuestion().getStatistic().getDifficultyLevel()
                    : DifficultyLevel.SEM_DADOS;

            if (diff == DifficultyLevel.FACIL) {
                easyTotal++;
                if (isCorrect) easyCorrect++;
            } else if (diff == DifficultyLevel.MEDIA) {
                mediumTotal++;
                if (isCorrect) mediumCorrect++;
            } else if (diff == DifficultyLevel.DIFICIL) {
                hardTotal++;
                if (isCorrect) hardCorrect++;
            }

            // Agregação por Área
            if (qa.getQuestion().getArea() != null) {
                Long aId = qa.getQuestion().getArea().getId();
                areaNames.put(aId, qa.getQuestion().getArea().getName());
                long[] stats = areaStats.computeIfAbsent(aId, k -> new long[2]);
                stats[0]++;
                if (isCorrect) stats[1]++;
            }

            // Agregação por Matéria
            if (qa.getQuestion().getSubject() != null) {
                Long sId = qa.getQuestion().getSubject().getId();
                subjectNames.put(sId, qa.getQuestion().getSubject().getName());
                long[] stats = subjectStats.computeIfAbsent(sId, k -> new long[2]);
                stats[0]++;
                if (isCorrect) stats[1]++;
            }

            // Agregação por Banca
            if (qa.getQuestion().getOrigin() != null) {
                Long oId = qa.getQuestion().getOrigin().getId();
                originNames.put(oId, qa.getQuestion().getOrigin().getName());
                long[] stats = originStats.computeIfAbsent(oId, k -> new long[2]);
                stats[0]++;
                if (isCorrect) stats[1]++;
            }
        }

        double easyAcc = easyTotal > 0 ? (double) easyCorrect / easyTotal * 100.0 : 0.0;
        double mediumAcc = mediumTotal > 0 ? (double) mediumCorrect / mediumTotal * 100.0 : 0.0;
        double hardAcc = hardTotal > 0 ? (double) hardCorrect / hardTotal * 100.0 : 0.0;
        double generalAcc = totalResolved > 0 ? (double) totalCorrect / totalResolved * 100.0 : 0.0;

        List<github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO> performanceByArea = areaStats.entrySet().stream()
                .map(e -> {
                    long tot = e.getValue()[0];
                    long corr = e.getValue()[1];
                    double acc = tot > 0 ? (double) corr / tot * 100.0 : 0.0;
                    return github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO.builder()
                            .id(e.getKey())
                            .name(areaNames.get(e.getKey()))
                            .totalQuestions(tot)
                            .correctAnswers(corr)
                            .accuracyPercentage(Math.round(acc * 100.0) / 100.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getTotalQuestions(), a.getTotalQuestions()))
                .toList();

        List<github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO> performanceBySubject = subjectStats.entrySet().stream()
                .map(e -> {
                    long tot = e.getValue()[0];
                    long corr = e.getValue()[1];
                    double acc = tot > 0 ? (double) corr / tot * 100.0 : 0.0;
                    return github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO.builder()
                            .id(e.getKey())
                            .name(subjectNames.get(e.getKey()))
                            .totalQuestions(tot)
                            .correctAnswers(corr)
                            .accuracyPercentage(Math.round(acc * 100.0) / 100.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getTotalQuestions(), a.getTotalQuestions()))
                .toList();

        List<github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO> performanceByOrigin = originStats.entrySet().stream()
                .map(e -> {
                    long tot = e.getValue()[0];
                    long corr = e.getValue()[1];
                    double acc = tot > 0 ? (double) corr / tot * 100.0 : 0.0;
                    return github.felkng.olha_minha_questao.dto.user.CategoryPerformanceDTO.builder()
                            .id(e.getKey())
                            .name(originNames.get(e.getKey()))
                            .totalQuestions(tot)
                            .correctAnswers(corr)
                            .accuracyPercentage(Math.round(acc * 100.0) / 100.0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getTotalQuestions(), a.getTotalQuestions()))
                .toList();

        // Cálculo comparativo com os outros usuários (Top % Ranking)
        List<User> allUsers = userRepository.findAll();
        long totalUsersCount = Math.max(allUsers.size(), 1);

        // Agrega estatísticas por usuário para compor o ranking
        List<long[]> userRankingData = new ArrayList<>(); // [userId, total, correct]
        double globalAccSum = 0.0;
        long globalResolvedSum = 0;
        int activeUsersCount = 0;

        for (User u : allUsers) {
            List<QuestionAttempt> uAttempts = questionAttemptRepository.findByUserId(u.getId());
            long uTotal = uAttempts.size();
            long uCorrect = uAttempts.stream().filter(qa -> Boolean.TRUE.equals(qa.getIsCorrect())).count();
            userRankingData.add(new long[]{u.getId(), uTotal, uCorrect});

            if (uTotal > 0) {
                double uAcc = (double) uCorrect / uTotal * 100.0;
                globalAccSum += uAcc;
                globalResolvedSum += uTotal;
                activeUsersCount++;
            }
        }

        // Ordena por maior pontuação (prioriza acertos e acurácia)
        userRankingData.sort((a, b) -> {
            long aTotal = a[1];
            long aCorrect = a[2];
            double aScore = (aCorrect * 10.0) + (aTotal > 0 ? ((double) aCorrect / aTotal * 100.0) : 0.0);

            long bTotal = b[1];
            long bCorrect = b[2];
            double bScore = (bCorrect * 10.0) + (bTotal > 0 ? ((double) bCorrect / bTotal * 100.0) : 0.0);

            return Double.compare(bScore, aScore);
        });

        long userRank = 1;
        for (int i = 0; i < userRankingData.size(); i++) {
            if (userRankingData.get(i)[0] == user.getId()) {
                userRank = i + 1;
                break;
            }
        }

        double topPercentage = Math.max(1.0, Math.round(((double) userRank / totalUsersCount) * 100.0 * 10.0) / 10.0);
        double percentileRank = Math.max(0.0, Math.round((100.0 - (((double) (userRank - 1) / totalUsersCount) * 100.0)) * 10.0) / 10.0);
        double globalAvgAcc = activeUsersCount > 0 ? Math.round((globalAccSum / activeUsersCount) * 100.0) / 100.0 : 0.0;
        double globalAvgResolved = activeUsersCount > 0 ? Math.round(((double) globalResolvedSum / activeUsersCount) * 10.0) / 10.0 : 0.0;

        github.felkng.olha_minha_questao.dto.user.UserComparisonDTO comparison = github.felkng.olha_minha_questao.dto.user.UserComparisonDTO.builder()
                .userRank(userRank)
                .totalUsers(totalUsersCount)
                .topPercentage(topPercentage)
                .percentileRank(percentileRank)
                .userAccuracy(Math.round(generalAcc * 100.0) / 100.0)
                .globalAverageAccuracy(globalAvgAcc)
                .userTotalResolved(totalResolved)
                .globalAverageResolved(globalAvgResolved)
                .build();

        List<Object[]> rawDaily = questionAttemptRepository.findDailyAttemptCountsByUserId(id);
        List<DailyActivityDTO> dailyActivity = new ArrayList<>();
        for (Object[] row : rawDaily) {
            if (row != null && row.length >= 2 && row[0] != null) {
                dailyActivity.add(DailyActivityDTO.builder()
                        .date(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build());
            }
        }

        return UserProfileDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .totalQuestionsResolved(totalResolved)
                .totalCorrectAnswers(totalCorrect)
                .generalAccuracyPercentage(Math.round(generalAcc * 100.0) / 100.0)
                .easyAccuracyPercentage(Math.round(easyAcc * 100.0) / 100.0)
                .mediumAccuracyPercentage(Math.round(mediumAcc * 100.0) / 100.0)
                .hardAccuracyPercentage(Math.round(hardAcc * 100.0) / 100.0)
                .dailyActivity(dailyActivity)
                .performanceByArea(performanceByArea)
                .performanceBySubject(performanceBySubject)
                .performanceByOrigin(performanceByOrigin)
                .comparison(comparison)
                .build();
    }

    @Transactional
    public UserSummaryDTO promoteToAdmin(Long targetUserId, Long actingUserId) {
        if (actingUserId != null) {
            User actingUser = userRepository.findById(actingUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário solicitante não encontrado com id: " + actingUserId));
            if (actingUser.getRole() != UserRole.ADMIN) {
                throw new IllegalArgumentException("Apenas administradores podem promover outros usuários a ADMIN.");
            }
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + targetUserId));

        targetUser.setRole(UserRole.ADMIN);
        User saved = userRepository.save(targetUser);
        return userMapper.toSummaryDTO(saved);
    }
}
