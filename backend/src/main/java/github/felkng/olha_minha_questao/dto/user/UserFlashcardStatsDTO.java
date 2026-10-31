package github.felkng.olha_minha_questao.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFlashcardStatsDTO {
    private long totalSessions;
    private long totalCardsStudied;
    private long totalCorrect;
    private long totalWrong;
    private long totalSkipped;
    private long totalTimeSpentSeconds;
    private double generalAccuracyPercentage;

    @Builder.Default
    private List<CategoryPerformanceDTO> performanceByArea = new ArrayList<>();

    @Builder.Default
    private List<CategoryPerformanceDTO> performanceBySubject = new ArrayList<>();
}
