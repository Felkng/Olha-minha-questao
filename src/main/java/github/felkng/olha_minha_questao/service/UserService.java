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

        long easyTotal = 0;
        long easyCorrect = 0;
        long mediumTotal = 0;
        long mediumCorrect = 0;
        long hardTotal = 0;
        long hardCorrect = 0;

        for (QuestionAttempt qa : attempts) {
            DifficultyLevel diff = qa.getQuestion().getStatistic() != null
                    ? qa.getQuestion().getStatistic().getDifficultyLevel()
                    : DifficultyLevel.SEM_DADOS;

            if (diff == DifficultyLevel.FACIL) {
                easyTotal++;
                if (Boolean.TRUE.equals(qa.getIsCorrect())) easyCorrect++;
            } else if (diff == DifficultyLevel.MEDIA) {
                mediumTotal++;
                if (Boolean.TRUE.equals(qa.getIsCorrect())) mediumCorrect++;
            } else if (diff == DifficultyLevel.DIFICIL) {
                hardTotal++;
                if (Boolean.TRUE.equals(qa.getIsCorrect())) hardCorrect++;
            }
        }

        double easyAcc = easyTotal > 0 ? (double) easyCorrect / easyTotal * 100.0 : 0.0;
        double mediumAcc = mediumTotal > 0 ? (double) mediumCorrect / mediumTotal * 100.0 : 0.0;
        double hardAcc = hardTotal > 0 ? (double) hardCorrect / hardTotal * 100.0 : 0.0;

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
                .easyAccuracyPercentage(Math.round(easyAcc * 100.0) / 100.0)
                .mediumAccuracyPercentage(Math.round(mediumAcc * 100.0) / 100.0)
                .hardAccuracyPercentage(Math.round(hardAcc * 100.0) / 100.0)
                .dailyActivity(dailyActivity)
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
