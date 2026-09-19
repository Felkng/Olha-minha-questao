package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.dto.area.AreaRequestDTO;
import github.felkng.olha_minha_questao.dto.area.AreaResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.AreaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaService {

    private final AreaRepository areaRepository;
    private final AreaMapper areaMapper;

    @Transactional(readOnly = true)
    public List<AreaResponseDTO> findAll() {
        return areaRepository.findAll()
                .stream()
                .map(areaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AreaResponseDTO findById(Long id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + id));
        return areaMapper.toDTO(area);
    }

    @Transactional
    public AreaResponseDTO create(AreaRequestDTO dto) {
        if (areaRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Já existe uma área cadastrada com o nome: " + dto.getName());
        }
        Area area = areaMapper.toEntity(dto);
        Area saved = areaRepository.save(area);
        return areaMapper.toDTO(saved);
    }

    @Transactional
    public AreaResponseDTO update(Long id, AreaRequestDTO dto) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + id));

        areaRepository.findByNameIgnoreCase(dto.getName())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Já existe outra área cadastrada com o nome: " + dto.getName());
                });

        areaMapper.updateEntityFromDTO(dto, area);
        Area updated = areaRepository.save(area);
        return areaMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!areaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Área não encontrada com o id: " + id);
        }
        areaRepository.deleteById(id);
    }
}
