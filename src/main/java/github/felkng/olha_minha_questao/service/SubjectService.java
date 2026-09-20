package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.SubjectRepository;
import github.felkng.olha_minha_questao.dto.subject.SubjectRequestDTO;
import github.felkng.olha_minha_questao.dto.subject.SubjectResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.SubjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final AreaRepository areaRepository;
    private final github.felkng.olha_minha_questao.domain.repository.UserRepository userRepository;
    private final SubjectMapper subjectMapper;

    @Transactional(readOnly = true)
    public List<SubjectResponseDTO> findAll() {
        return subjectRepository.findAllByOrderByNameAsc()
                .stream()
                .map(subjectMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubjectResponseDTO> findByAreaId(Long areaId) {
        return subjectRepository.findByAreaIdOrderByNameAsc(areaId)
                .stream()
                .map(subjectMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubjectResponseDTO findById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com id: " + id));
        return subjectMapper.toDTO(subject);
    }

    @Transactional
    public SubjectResponseDTO create(SubjectRequestDTO dto) {
        Area area = areaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com id: " + dto.getAreaId()));

        Subject subject = subjectMapper.toEntity(dto);
        subject.setArea(area);
        Subject saved = subjectRepository.save(subject);
        return subjectMapper.toDTO(saved);
    }

    @Transactional
    public SubjectResponseDTO update(Long id, SubjectRequestDTO dto) {
        return update(id, dto, null);
    }

    @Transactional
    public SubjectResponseDTO update(Long id, SubjectRequestDTO dto, Long userId) {
        if (userId != null) {
            github.felkng.olha_minha_questao.domain.entity.User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != github.felkng.olha_minha_questao.domain.entity.UserRole.ADMIN) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN,
                        "Apenas administradores podem atualizar matérias.");
            }
        }

        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com id: " + id));

        Area area = areaRepository.findById(dto.getAreaId())
                .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com id: " + dto.getAreaId()));

        subjectMapper.updateEntityFromDTO(dto, subject);
        subject.setArea(area);
        Subject updated = subjectRepository.save(subject);
        return subjectMapper.toDTO(updated);
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
                        "Apenas administradores podem excluir matérias.");
            }
        }

        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Matéria não encontrada com id: " + id);
        }
        subjectRepository.deleteById(id);
    }
}
