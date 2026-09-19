package github.felkng.olha_minha_questao.dto.user;

import github.felkng.olha_minha_questao.domain.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDTO {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
}
