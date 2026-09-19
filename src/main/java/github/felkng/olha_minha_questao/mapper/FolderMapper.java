package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.dto.folder.FolderRequestDTO;
import github.felkng.olha_minha_questao.dto.folder.FolderResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FolderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "savedQuestions", ignore = true)
    @Mapping(target = "savedTests", ignore = true)
    Folder toEntity(FolderRequestDTO dto);

    @Mapping(target = "questionCount", expression = "java(entity.getSavedQuestions() != null ? entity.getSavedQuestions().size() : 0L)")
    @Mapping(target = "testCount", expression = "java(entity.getSavedTests() != null ? entity.getSavedTests().size() : 0L)")
    FolderResponseDTO toDTO(Folder entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "savedQuestions", ignore = true)
    @Mapping(target = "savedTests", ignore = true)
    void updateEntityFromDTO(FolderRequestDTO dto, @MappingTarget Folder entity);
}
