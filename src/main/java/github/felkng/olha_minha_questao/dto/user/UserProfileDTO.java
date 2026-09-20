package github.felkng.olha_minha_questao.dto.user;

import github.felkng.olha_minha_questao.domain.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private Instant createdAt;

    private long totalQuestionsResolved;
    private long totalCorrectAnswers;
    private double generalAccuracyPercentage;
    private double easyAccuracyPercentage;
    private double mediumAccuracyPercentage;
    private double hardAccuracyPercentage;

    @Builder.Default
    private List<DailyActivityDTO> dailyActivity = new ArrayList<>();

    @Builder.Default
    private List<CategoryPerformanceDTO> performanceByArea = new ArrayList<>();

    @Builder.Default
    private List<CategoryPerformanceDTO> performanceBySubject = new ArrayList<>();

    @Builder.Default
    private List<CategoryPerformanceDTO> performanceByOrigin = new ArrayList<>();

    private UserComparisonDTO comparison;

    public long getTotalResolved() {
        return totalQuestionsResolved;
    }

    public double getEasyAccuracy() {
        return easyAccuracyPercentage;
    }

    public double getMediumAccuracy() {
        return mediumAccuracyPercentage;
    }

    public double getHardAccuracy() {
        return hardAccuracyPercentage;
    }

    public List<DailyActivityDTO> getDailyActivities() {
        return dailyActivity;
    }
}
