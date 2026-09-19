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
    private final TestMapper testMapper;

    @Transactional(readOnly = true)
    public List<TestResponseDTO> findAll(Long originId, Long areaId, Integer year) {
        List<Test> tests;
        if (originId != null && year != null) {
            tests = testRepository.findByOriginIdAndYear(originId, year);
        } else if (originId != null) {
            tests = testRepository.findByOriginId(originId);
        } else if (areaId != null) {
            tests = testRepository.findByAreaId(areaId);
        } else if (year != null) {
            tests = testRepository.findByYear(year);
        } else {
            tests = testRepository.findAll();
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
        Origin origin = originRepository.findById(dto.getOriginId())
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + dto.getOriginId()));

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        Test test = testMapper.toEntity(dto);
        test.setOrigin(origin);
        test.setArea(area);

        Test saved = testRepository.save(test);
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
