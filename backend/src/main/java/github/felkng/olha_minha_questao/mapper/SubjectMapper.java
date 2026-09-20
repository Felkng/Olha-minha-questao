package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO;
import github.felkng.olha_minha_questao.dto.subject.SubjectResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SubjectMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Subject toEntity(SubjectRequestDTO dto);

    @Mapping(target = "areaId", source = "area.id")
    @Mapping(target = "areaName", source = "area.name")
    SubjectResponseDTO toDTO(Subject entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDTO(SubjectRequestDTO dto, @MappingTarget Subject entity);
}
