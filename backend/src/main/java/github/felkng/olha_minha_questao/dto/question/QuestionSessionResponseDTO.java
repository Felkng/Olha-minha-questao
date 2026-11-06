package github.felkng.olha_minha_questao.dto.question;

import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionSessionResponseDTO {
    private Long id;
    private UserSummaryDTO user;
    private Long folderId;
    private String folderName;
    private Long originId;
    private String originName;
    private Long areaId;
    private String areaName;
    private Long subjectId;
    private String subjectName;
    private String title;
    private Integer totalQuestions;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer skippedCount;
    private Integer timeSpentSeconds;
    private Double accuracyPercentage;
    private Boolean completed;
    @Builder.Default
    private List<Long> questionIds = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;
    @Builder.Default
    private List<QuestionSessionItemDTO> items = new ArrayList<>();
}
