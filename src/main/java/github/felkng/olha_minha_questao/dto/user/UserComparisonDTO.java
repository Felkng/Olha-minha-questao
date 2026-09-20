package github.felkng.olha_minha_questao.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserComparisonDTO {
    private long userRank;
    private long totalUsers;
    private double topPercentage;
    private double percentileRank;
    private double userAccuracy;
    private double globalAverageAccuracy;
    private long userTotalResolved;
    private double globalAverageResolved;
}
