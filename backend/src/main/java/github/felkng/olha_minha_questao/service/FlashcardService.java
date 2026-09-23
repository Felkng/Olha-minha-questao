package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.Flashcard;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSessionItem;
import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.FolderType;
import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.AreaRepository;
import github.felkng.olha_minha_questao.domain.repository.FlashcardRepository;
import github.felkng.olha_minha_questao.domain.repository.FlashcardSessionItemRepository;
import github.felkng.olha_minha_questao.domain.repository.FlashcardSessionRepository;
import github.felkng.olha_minha_questao.domain.repository.FolderRepository;
import github.felkng.olha_minha_questao.domain.repository.SubjectRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardRequestDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardResponseDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionItemDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionRequestDTO;
import github.felkng.olha_minha_questao.dto.flashcard.FlashcardSessionResponseDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.FlashcardMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final AreaRepository areaRepository;
    private final SubjectRepository subjectRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final FlashcardSessionRepository flashcardSessionRepository;
    private final FlashcardSessionItemRepository flashcardSessionItemRepository;
    private final FlashcardMapper flashcardMapper;

    @Transactional(readOnly = true)
    public Page<FlashcardResponseDTO> findAll(
            Long areaId,
            Long subjectId,
            Long folderId,
            String search,
            Long createdByUserId,
            Long currentUserId,
            Pageable pageable) {

        Specification<Flashcard> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Regra de Privacidade
            if (currentUserId == null) {
                predicates.add(cb.isTrue(root.get("isPublic")));
            } else {
                if (createdByUserId != null && createdByUserId.equals(currentUserId)) {
                    // Usuário visualizando seus próprios cards -> exibe públicos e privados
                } else {
                    predicates.add(cb.or(
                            cb.isTrue(root.get("isPublic")),
                            cb.equal(root.get("createdByUser").get("id"), currentUserId)
                    ));
                }
            }

            if (createdByUserId != null) {
                predicates.add(cb.equal(root.get("createdByUser").get("id"), createdByUserId));
            }

            if (areaId != null) {
                predicates.add(cb.equal(root.get("area").get("id"), areaId));
            }

            if (subjectId != null) {
                predicates.add(cb.equal(root.get("subject").get("id"), subjectId));
            }

            if (folderId != null) {
                predicates.add(cb.equal(root.get("folder").get("id"), folderId));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("front")), pattern),
                        cb.like(cb.lower(root.get("back")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return flashcardRepository.findAll(spec, pageable).map(flashcardMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public FlashcardResponseDTO findById(Long id, Long currentUserId) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com o id: " + id));

        if (Boolean.FALSE.equals(flashcard.getIsPublic())) {
            if (currentUserId == null || (flashcard.getCreatedByUser() != null && !flashcard.getCreatedByUser().getId().equals(currentUserId))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este flashcard é privado.");
            }
        }

        return flashcardMapper.toDTO(flashcard);
    }

    @Transactional
    public FlashcardResponseDTO create(FlashcardRequestDTO dto, Long userId) {
        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        Subject subject = null;
        if (dto.getSubjectId() != null) {
            subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com o id: " + dto.getSubjectId()));
        }

        Folder folder = null;
        if (dto.getFolderId() != null) {
            folder = folderRepository.findById(dto.getFolderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + dto.getFolderId()));
        }

        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Flashcard flashcard = flashcardMapper.toEntity(dto);
        flashcard.setArea(area);
        flashcard.setSubject(subject);
        flashcard.setFolder(folder);
        flashcard.setCreatedByUser(user);
        if (dto.getIsPublic() != null) {
            flashcard.setIsPublic(dto.getIsPublic());
        }

        Flashcard saved = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(saved);
    }

    @Transactional
    public FlashcardResponseDTO update(Long id, FlashcardRequestDTO dto, Long userId) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != UserRole.ADMIN) {
                if (flashcard.getCreatedByUser() == null || !flashcard.getCreatedByUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem permissão para editar este flashcard.");
                }
            }
        }

        Area area = null;
        if (dto.getAreaId() != null) {
            area = areaRepository.findById(dto.getAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Área não encontrada com o id: " + dto.getAreaId()));
        }

        Subject subject = null;
        if (dto.getSubjectId() != null) {
            subject = subjectRepository.findById(dto.getSubjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada com o id: " + dto.getSubjectId()));
        }

        Folder folder = null;
        if (dto.getFolderId() != null) {
            folder = folderRepository.findById(dto.getFolderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pasta não encontrada com o id: " + dto.getFolderId()));
        }

        flashcardMapper.updateEntityFromDTO(dto, flashcard);
        flashcard.setArea(area);
        flashcard.setSubject(subject);
        flashcard.setFolder(folder);
        if (dto.getIsPublic() != null) {
            flashcard.setIsPublic(dto.getIsPublic());
        }

        Flashcard updated = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(updated);
    }

    @Transactional
    public FlashcardResponseDTO toggleVisibility(Long id, Long userId) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() != UserRole.ADMIN) {
                if (flashcard.getCreatedByUser() == null || !flashcard.getCreatedByUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem permissão para alterar a visibilidade deste flashcard.");
                }
            }
        }

        flashcard.setIsPublic(!Boolean.TRUE.equals(flashcard.getIsPublic()));
        Flashcard updated = flashcardRepository.save(flashcard);
        return flashcardMapper.toDTO(updated);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard não encontrado com o id: " + id));

        if (userId != null) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o id: " + userId));
            if (user.getRole() == UserRole.ADMIN) {
                // Admin pode excluir se for público ou criado por ele mesmo
                if (!Boolean.TRUE.equals(flashcard.getIsPublic()) && (flashcard.getCreatedByUser() == null || !flashcard.getCreatedByUser().getId().equals(user.getId()))) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administradores podem moderar apenas conteúdos públicos de terceiros.");
                }
            } else {
                // Usuário comum só pode excluir seus próprios cards
                if (flashcard.getCreatedByUser() == null || !flashcard.getCreatedByUser().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não tem permissão para excluir este flashcard.");
                }
            }
        }

        flashcardRepository.delete(flashcard);
    }

    @Transactional
    public FlashcardSessionResponseDTO saveSession(FlashcardSessionRequestDTO dto, Long userId) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        Folder folder = null;
        if (dto.getFolderId() != null) {
            folder = folderRepository.findById(dto.getFolderId()).orElse(null);
        }

        int correct = 0;
        int wrong = 0;
        int skipped = 0;

        List<FlashcardSessionItem> sessionItems = new ArrayList<>();
        FlashcardSession session = FlashcardSession.builder()
                .user(user)
                .folder(folder)
                .totalCards(dto.getItems().size())
                .correctCount(0)
                .wrongCount(0)
                .skippedCount(0)
                .build();

        FlashcardSession savedSession = flashcardSessionRepository.save(session);

        for (FlashcardSessionItemDTO itemDTO : dto.getItems()) {
            Flashcard card = flashcardRepository.findById(itemDTO.getFlashcardId()).orElse(null);
            if (card == null) continue;

            String status = itemDTO.getStatus() != null ? itemDTO.getStatus().toUpperCase() : "SKIPPED";
            if ("CORRECT".equals(status)) {
                correct++;
            } else if ("WRONG".equals(status)) {
                wrong++;
            } else {
                skipped++;
                status = "SKIPPED";
            }

            FlashcardSessionItem item = FlashcardSessionItem.builder()
                    .session(savedSession)
                    .flashcard(card)
                    .status(status)
                    .build();

            sessionItems.add(flashcardSessionItemRepository.save(item));
        }

        savedSession.setCorrectCount(correct);
        savedSession.setWrongCount(wrong);
        savedSession.setSkippedCount(skipped);
        savedSession.setItems(sessionItems);
        savedSession = flashcardSessionRepository.save(savedSession);

        FlashcardSessionResponseDTO response = flashcardMapper.toSessionDTO(savedSession);
        response.setItems(sessionItems.stream().map(flashcardMapper::toItemDTO).toList());
        return response;
    }

    @Transactional(readOnly = true)
    public List<FlashcardSessionResponseDTO> getUserSessions(Long userId) {
        if (userId == null) return List.of();
        return flashcardSessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(session -> {
                    FlashcardSessionResponseDTO dto = flashcardMapper.toSessionDTO(session);
                    dto.setItems(session.getItems().stream().map(flashcardMapper::toItemDTO).toList());
                    return dto;
                })
                .toList();
    }
}
