package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.SavedQuestion;
import github.felkng.olha_minha_questao.dto.folder.SavedQuestionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {QuestionMapper.class})
public interface SavedQuestionMapper {

    @Mapping(target = "folderId", source = "folder.id")
    @Mapping(target = "folderName", source = "folder.name")
    @Mapping(target = "folderColor", source = "folder.color")
    @Mapping(target = "question", source = "question")
    SavedQuestionResponseDTO toDTO(SavedQuestion entity);
}
