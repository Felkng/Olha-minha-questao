package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.TextualReference;
import github.felkng.olha_minha_questao.dto.reference.TextualReferenceRequestDTO;
import github.felkng.olha_minha_questao.dto.reference.TextualReferenceResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TextualReferenceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "test", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    TextualReference toEntity(TextualReferenceRequestDTO dto);

    @Mapping(target = "testId", source = "test.id")
    TextualReferenceResponseDTO toDTO(TextualReference entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "test", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDTO(TextualReferenceRequestDTO dto, @MappingTarget TextualReference entity);
}
