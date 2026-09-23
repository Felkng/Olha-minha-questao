package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Flashcard;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSessionItem;
import github.felkng.olha_minha_questao.domain.entity.Folder;
import github.felkng.olha_minha_questao.domain.entity.FolderType;
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
import github.felkng.olha_minha_questao.mapper.FlashcardMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlashcardServiceTest {

    @Mock
    private FlashcardRepository flashcardRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private FolderRepository folderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FlashcardSessionRepository flashcardSessionRepository;

    @Mock
    private FlashcardSessionItemRepository flashcardSessionItemRepository;

    @Mock
    private FlashcardMapper flashcardMapper;

    @InjectMocks
    private FlashcardService flashcardService;

    private User user1;
    private User adminUser;
    private Flashcard publicCard;
    private Flashcard privateCard;

    @BeforeEach
    void setUp() {
        user1 = User.builder().id(1L).name("User 1").email("user1@test.com").role(UserRole.GENERAL).build();
        adminUser = User.builder().id(2L).name("Admin").email("admin@test.com").role(UserRole.ADMIN).build();

        publicCard = Flashcard.builder()
                .id(10L)
                .front("Pergunta 1")
                .back("Resposta 1")
                .createdByUser(user1)
                .isPublic(true)
                .build();

        privateCard = Flashcard.builder()
                .id(20L)
                .front("Pergunta Secreta")
                .back("Resposta Secreta")
                .createdByUser(user1)
                .isPublic(false)
                .build();
    }

    @Test
    @DisplayName("Deve criar flashcard com sucesso")
    void shouldCreateFlashcard() {
        FlashcardRequestDTO req = FlashcardRequestDTO.builder()
                .front("O que é inércia?")
                .back("Tendência a manter o estado de movimento.")
                .isPublic(true)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(flashcardMapper.toEntity(req)).thenReturn(Flashcard.builder().front(req.getFront()).back(req.getBack()).isPublic(true).build());
        when(flashcardRepository.save(any(Flashcard.class))).thenAnswer(invocation -> {
            Flashcard f = invocation.getArgument(0);
            f.setId(100L);
            return f;
        });
        when(flashcardMapper.toDTO(any(Flashcard.class))).thenReturn(FlashcardResponseDTO.builder().id(100L).front(req.getFront()).back(req.getBack()).isPublic(true).build());

        FlashcardResponseDTO res = flashcardService.create(req, 1L);
        assertNotNull(res);
        assertEquals(100L, res.getId());
        assertEquals("O que é inércia?", res.getFront());
    }

    @Test
    @DisplayName("Admin deve conseguir deletar flashcard público de outro usuário")
    void adminShouldDeletePublicFlashcardOfOtherUser() {
        when(flashcardRepository.findById(10L)).thenReturn(Optional.of(publicCard));
        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

        flashcardService.delete(10L, 2L);
        verify(flashcardRepository).delete(publicCard);
    }

    @Test
    @DisplayName("Admin NÃO deve conseguir deletar flashcard PRIVADO de outro usuário")
    void adminShouldNotDeletePrivateFlashcardOfOtherUser() {
        when(flashcardRepository.findById(20L)).thenReturn(Optional.of(privateCard));
        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

        assertThrows(ResponseStatusException.class, () -> flashcardService.delete(20L, 2L));
    }

    @Test
    @DisplayName("Usuário comum NÃO deve conseguir deletar flashcard de outro usuário")
    void generalUserShouldNotDeleteOtherUserFlashcard() {
        User otherUser = User.builder().id(3L).name("User 3").role(UserRole.GENERAL).build();
        when(flashcardRepository.findById(10L)).thenReturn(Optional.of(publicCard));
        when(userRepository.findById(3L)).thenReturn(Optional.of(otherUser));

        assertThrows(ResponseStatusException.class, () -> flashcardService.delete(10L, 3L));
    }

    @Test
    @DisplayName("Deve alternar a visibilidade de um flashcard")
    void shouldToggleVisibility() {
        when(flashcardRepository.findById(10L)).thenReturn(Optional.of(publicCard));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(flashcardRepository.save(any(Flashcard.class))).thenReturn(publicCard);
        when(flashcardMapper.toDTO(publicCard)).thenReturn(FlashcardResponseDTO.builder().id(10L).isPublic(false).build());

        FlashcardResponseDTO res = flashcardService.toggleVisibility(10L, 1L);
        assertNotNull(res);
        assertFalse(res.getIsPublic());
    }

    @Test
    @DisplayName("Deve registrar sessão de estudo de flashcards")
    void shouldSaveFlashcardSession() {
        FlashcardSessionRequestDTO sessionReq = FlashcardSessionRequestDTO.builder()
                .items(List.of(
                        FlashcardSessionItemDTO.builder().flashcardId(10L).status("CORRECT").build(),
                        FlashcardSessionItemDTO.builder().flashcardId(20L).status("WRONG").build()
                ))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(flashcardRepository.findById(10L)).thenReturn(Optional.of(publicCard));
        when(flashcardRepository.findById(20L)).thenReturn(Optional.of(privateCard));
        when(flashcardSessionRepository.save(any(FlashcardSession.class))).thenAnswer(inv -> {
            FlashcardSession s = inv.getArgument(0);
            s.setId(55L);
            return s;
        });
        when(flashcardSessionItemRepository.save(any(FlashcardSessionItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(flashcardMapper.toSessionDTO(any(FlashcardSession.class))).thenReturn(FlashcardSessionResponseDTO.builder()
                .id(55L)
                .totalCards(2)
                .correctCount(1)
                .wrongCount(1)
                .skippedCount(0)
                .accuracyPercentage(50.0)
                .build());

        FlashcardSessionResponseDTO sessionRes = flashcardService.saveSession(sessionReq, 1L);
        assertNotNull(sessionRes);
        assertEquals(2, sessionRes.getTotalCards());
        assertEquals(1, sessionRes.getCorrectCount());
        assertEquals(1, sessionRes.getWrongCount());
    }
}
