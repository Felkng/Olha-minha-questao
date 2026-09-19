package github.felkng.olha_minha_questao.mapper;

import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.dto.question.QuestionRequestDTO;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {OriginMapper.class, AreaMapper.class, SubjectMapper.class, TestMapper.class, AlternativeMapper.class})
public interface QuestionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "origin", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "test", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "correctAlternative", ignore = true)
    @Mapping(target = "statistic", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Question toEntity(QuestionRequestDTO dto);

    @Mapping(target = "correctAlternativeId", source = "correctAlternative.id")
    @Mapping(target = "correctAlternativeIdentifier", source = "correctAlternative.identifier")
    @Mapping(target = "difficultyLevel", source = "statistic.difficultyLevel")
    @Mapping(target = "accuracyPercentage", source = "statistic.firstAttemptAccuracy")
    @Mapping(target = "totalAttempts", source = "statistic.totalAttempts")
    QuestionResponseDTO toDTO(Question entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "origin", ignore = true)
    @Mapping(target = "area", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "test", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "correctAlternative", ignore = true)
    @Mapping(target = "statistic", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromDTO(QuestionRequestDTO dto, @MappingTarget Question entity);
}
