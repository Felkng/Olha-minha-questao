package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.entity.Test;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.domain.repository.TestRepository;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.domain.entity.DifficultyLevel;
import github.felkng.olha_minha_questao.domain.entity.Question;
import github.felkng.olha_minha_questao.domain.entity.TestStatistic;
import github.felkng.olha_minha_questao.domain.repository.QuestionRepository;
import github.felkng.olha_minha_questao.dto.question.QuestionResponseDTO;
import github.felkng.olha_minha_questao.dto.test.TestCardDTO;
import github.felkng.olha_minha_questao.dto.test.TestEvaluationDTO;
import github.felkng.olha_minha_questao.dto.test.TestRequestDTO;
import github.felkng.olha_minha_questao.dto.test.TestResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.QuestionMapper;
import github.felkng.olha_minha_questao.mapper.TestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TestService {

    private final TestRepository testRepository;
    private final OriginRepository originRepository;
    private final AreaRepository areaRepository;
    private final QuestionRepository questionRepository;
    private final github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;
    private final TestMapper testMapper;
    private final QuestionMapper questionMapper;

    @Transactional(readOnly = true)
    public List<TestCardDTO> findTestCards() {
        List<Test> tests = testRepository.findAllByOrderByYearDescIdDesc();
        return tests.stream().map(test -> {
            TestStatistic stat = test.getStatistic();
            int qCount = (int) questionRepository.countByTestId(test.getId());
            return TestCardDTO.builder()
                    .id(test.getId())
                    .name(test.getName())
                    .year(test.getYear())
                    .originId(test.getOrigin() != null ? test.getOrigin().getId() : null)
                    .originName(test.getOrigin() != null ? test.getOrigin().getName() : null)
                    .areaId(test.getArea() != null ? test.getArea().getId() : null)
                    .areaName(test.getArea() != null ? test.getArea().getName() : null)
                    .questionCount(qCount)
                    .difficultyLevel(stat != null ? stat.getDifficultyLevel() : DifficultyLevel.SEM_DADOS)
                    .averageScore(stat != null ? stat.getAverageScore() : 0.0)
                    .totalAttempts(stat != null ? stat.getTotalAttempts() : 0L)
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public TestEvaluationDTO getTestEvaluation(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        List<Question> questions = questionRepository.findByTestId(id);
        List<QuestionResponseDTO> questionDTOs = questions.stream()
                .map(questionMapper::toDTO)
                .toList();

        return TestEvaluationDTO.builder()
                .id(test.getId())
                .name(test.getName())
                .year(test.getYear())
                .originId(test.getOrigin() != null ? test.getOrigin().getId() : null)
                .originName(test.getOrigin() != null ? test.getOrigin().getName() : null)
                .areaId(test.getArea() != null ? test.getArea().getId() : null)
                .areaName(test.getArea() != null ? test.getArea().getName() : null)
                .questionCount(questionDTOs.size())
                .questions(questionDTOs)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year) {
        return findAll(originId, areaId, year, null);
    }

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year, Long createdByUserId) {
        List<Test> tests;
        if (createdByUserId != null) {
            tests = testRepository.findByCreatedByUserIdOrderByYearDescIdDesc(createdByUserId);
        } else if (originId != null && year != null) {
            tests = testRepository.findByOriginIdAndYear(originId, year);
        } else if (originId != null) {
            tests = testRepository.findByOriginId(originId);
        } else if (areaId != null) {
            tests = testRepository.findByAreaId(areaId);
        } else if (year != null) {
            tests = testRepository.findByYear(year);
        } else {
            tests = testRepository.findAllByOrderByYearDescIdDesc();
        }

        return tests.stream()
                .map(testMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TestResponseDTO findById(Long id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));
        return testMapper.toDTO(test);
    }

    @Transactional
    public TestResponseDTO create(TestRequestDTO dto) {
        return create(dto, null);
    }

    @Transactional
    public TestResponseDTO create(TestRequestDTO dto, Long userId) {
        Origin origin = originRepository.findById(dto.getOriginId())
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        github.felkng.olha_minha_questao.domain.entity.User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Test test = testMapper.toEntity(dto);
        test.setOrigin(origin);
        test.setArea(area);
        test.setCreatedByUser(user);

        Test saved = testRepository.save(test);

        if (saved.getStatistic() == null) {
            TestStatistic stat = TestStatistic.builder()
                    .test(saved)
                    .testId(saved.getId())
                    .totalAttempts(0L)
                    .averageScore(0.0)
                    .difficultyLevel(DifficultyLevel.SEM_DADOS)
                    .build();
            saved.setStatistic(stat);
            saved = testRepository.save(saved);
        }

        return testMapper.toDTO(saved);
    }

    @Transactional
    public TestResponseDTO update(Long id, TestRequestDTO dto) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada com o id: " + id));

        Origin origin = originRepository.findById(dto.getOriginId())
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        testMapper.updateEntityFromDTO(dto, test);
        test.setOrigin(origin);
        test.setArea(area);

        Test updated = testRepository.save(test);
        return testMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!testRepository.existsById(id)) {
            throw new ResourceNotFoundException("Prova não encontrada com o id: " + id);
        }
        testRepository.deleteById(id);
    }
}
