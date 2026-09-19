package github.felkng.olha_minha_questao.dto.test;

import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestResponseDTO {
    private Long id;
    private String name;
    private Integer year;
    private Long originId;
    private String originName;
    private Long areaId;
    private String areaName;
    private UserSummaryDTO createdByUser;
    private Instant createdAt;
    private Instant updatedAt;
}
