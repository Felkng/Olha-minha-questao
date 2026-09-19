package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TestMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "origin", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "statistic", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Test toEntity(TestRequestDTO dto);

    @Mapping(target = "originId", source = "origin.id")
    @Mapping(target = "originName", source = "origin.name")
    @Mapping(target = "areaId", source = "area.id")
    @Mapping(target = "areaName", source = "area.name")
    TestResponseDTO toDTO(Test entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "origin", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "statistic", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDTO(TestRequestDTO dto, @MappingTarget Test entity);
}
