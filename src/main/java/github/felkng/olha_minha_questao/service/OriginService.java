package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Origin;
import github.felkng.olha_minha_questao.domain.repository.OriginRepository;
import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.OriginMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OriginService {

    private final OriginRepository originRepository;
    private final OriginMapper originMapper;

    @Transactional(readOnly = true)
    public List<OriginResponseDTO> findAll() {
        return originRepository.findAll()
                .stream()
                .map(originMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public OriginResponseDTO findById(Long id) {
        Origin origin = originRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + id));
        return originMapper.toDTO(origin);
    }

    @Transactional
    public OriginResponseDTO create(OriginRequestDTO dto) {
        if (originRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("Já existe uma origem cadastrada com o nome: " + dto.getName());
        }
        Origin origin = originMapper.toEntity(dto);
        Origin saved = originRepository.save(origin);
        return originMapper.toDTO(saved);
    }

    @Transactional
    public OriginResponseDTO update(Long id, OriginRequestDTO dto) {
        Origin origin = originRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Origem não encontrada com o id: " + id));

        originRepository.findByNameIgnoreCase(dto.getName())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Já existe outra origem cadastrada com o nome: " + dto.getName());
                });

        originMapper.updateEntityFromDTO(dto, origin);
        Origin updated = originRepository.save(origin);
        return originMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!originRepository.existsById(id)) {
            throw new ResourceNotFoundException("Origem não encontrada com o id: " + id);
        }
        originRepository.deleteById(id);
    }
}
