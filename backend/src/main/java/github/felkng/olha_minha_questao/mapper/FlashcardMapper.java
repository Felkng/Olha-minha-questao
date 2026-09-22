package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.Flashcard;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSessionItem;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardRequestDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardResponseDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionItemDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface FlashcardMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "folder", ignore = true)
    @Mapping(target = "createdByUser", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Flashcard toEntity(FlashcardRequestDTO dto);

    @Mapping(target = "areaId", source = "area.id")
    @Mapping(target = "areaName", source = "area.name")
    @Mapping(target = "subjectId", source = "subject.id")
    @Mapping(target = "subjectName", source = "subject.name")
    @Mapping(target = "folderId", source = "folder.id")
    @Mapping(target = "folderName", source = "folder.name")
    @Mapping(target = "folderColor", source = "folder.color")
    FlashcardResponseDTO toDTO(Flashcard entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "folder", ignore = true)
    @Mapping(target = "createdByUser", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDTO(FlashcardRequestDTO dto, @MappingTarget Flashcard entity);

    @Mapping(target = "flashcardId", source = "flashcard.id")
    @Mapping(target = "flashcardFront", source = "flashcard.front")
    @Mapping(target = "flashcardBack", source = "flashcard.back")
    FlashcardSessionItemDTO toItemDTO(FlashcardSessionItem entity);

    @Mapping(target = "folderId", source = "folder.id")
    @Mapping(target = "folderName", source = "folder.name")
    @Mapping(target = "accuracyPercentage", expression = "java(entity.getTotalCards() != null && entity.getTotalCards() > 0 ? ((double) entity.getCorrectCount() / entity.getTotalCards()) * 100.0 : 0.0)")
    FlashcardSessionResponseDTO toSessionDTO(FlashcardSession entity);
}
