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
    private final github.felkng.olha_minha_questao.domain.repository.QuestionRepository questionRepository;
    private final github.felkng.olha_minha_questao.domain.repository.TestRepository testRepository;
    private final github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;
    private final AreaMapper areaMapper;

    @Transactional(readOnly = true)
    public java.util.List<github.felkng.olha_minha_questao.dto.area.AreaCardDTO> findAreaCards() {
        return areaRepository.findAllByOrderByNameAsc().stream()
                .map(area -> github.felkng.olha_minha_questao.dto.area.AreaCardDTO.builder()
                        .id(area.getId())
                        .name(area.getName())
                        .description(area.getDescription())
                        .questionCount(questionRepository.countByAreaId(area.getId()))
                        .testCount(testRepository.countByAreaId(area.getId()))
                        .build())
                .toList();
    }

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
        return update(id, dto, null);
    }

    @Transactional
    public AreaResponseDTO update(Long id, AreaRequestDTO dto, Long userId) {
        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Apenas administradores podem atualizar áreas.");
            }
        }

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
        delete(id, null);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Apenas administradores podem excluir áreas.");
            }
        }

        if (!areaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Área não encontrada com o id: " + id);
        }
        areaRepository.deleteById(id);
    }
}
