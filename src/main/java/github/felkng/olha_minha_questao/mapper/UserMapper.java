package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.dto.auth.AuthResponseDTO;
import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserSummaryDTO toSummaryDTO(User entity);

    @org.mapstruct.Mapping(target = "token", ignore = true)
    AuthResponseDTO toAuthResponseDTO(User entity);
}
