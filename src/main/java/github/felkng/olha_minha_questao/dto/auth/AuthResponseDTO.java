package github.felkng.olha_minha_questao.dto.auth;

import github.felkng.olha_minha_questao.domain.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {
    private String token;
    private Long id;
    private String name;
    private String email;
    private UserRole role;

    public github.felkng.olha_minha_questao.dto.user.UserSummaryDTO getUser() {
        if (id == null) return null;
        return github.felkng.olha_minha_questao.dto.user.UserSummaryDTO.builder()
                .id(id)
                .name(name)
                .email(email)
                .role(role)
                .build();
    }
}
