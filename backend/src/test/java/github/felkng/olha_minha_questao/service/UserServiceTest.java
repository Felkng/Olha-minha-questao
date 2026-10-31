package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.Area;
import github.felkng.olha_minha_questao.domain.entity.FlashcardSession;
import github.felkng.olha_minha_questao.domain.entity.QuestionAttempt;
import github.felkng.olha_minha_questao.domain.entity.Subject;
import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.FlashcardSessionRepository;
import github.felkng.olha_minha_questao.domain.repository.QuestionAttemptRepository;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.user.DailyActivityDTO;
import github.felkng.olha_minha_questao.dto.user.UserProfileDTO;
import github.felkng.olha_minha_questao.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuestionAttemptRepository questionAttemptRepository;

    @Mock
    private FlashcardSessionRepository flashcardSessionRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuthService authService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Deve carregar perfil com estatísticas de flashcards e frequência combinada")
    void shouldGetUserProfileWithFlashcardStatsAndCombinedFrequency() {
        User user = User.builder()
                .id(1L)
                .name("Estudante Teste")
                .email("estudante@test.com")
                .role(UserRole.GENERAL)
                .createdAt(Instant.now())
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(questionAttemptRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        Area area = Area.builder().id(10L).name("Direito Constitucional").build();
        Subject subject = Subject.builder().id(20L).name("Direitos Fundamentais").build();

        FlashcardSession session = FlashcardSession.builder()
                .id(100L)
                .user(user)
                .area(area)
                .subject(subject)
                .totalCards(10)
                .correctCount(8)
                .wrongCount(2)
                .skippedCount(0)
                .timeSpentSeconds(150)
                .createdAt(Instant.now())
                .build();

        when(flashcardSessionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(session));

        // Mock daily counts: Questions on 2026-10-30 and Flashcards on 2026-10-30 & 2026-10-31
        List<Object[]> rawDailyQuestions = new java.util.ArrayList<>();
        rawDailyQuestions.add(new Object[]{"2026-10-30", 5L});

        List<Object[]> rawDailyFlashcards = new java.util.ArrayList<>();
        rawDailyFlashcards.add(new Object[]{"2026-10-30", 1L, 10L});
        rawDailyFlashcards.add(new Object[]{"2026-10-31", 2L, 25L});

        when(questionAttemptRepository.findDailyAttemptCountsByUserId(1L)).thenReturn(rawDailyQuestions);
        when(flashcardSessionRepository.findDailySessionCountsByUserId(1L)).thenReturn(rawDailyFlashcards);

        UserProfileDTO profile = userService.getUserProfile(1L);

        assertNotNull(profile);
        assertNotNull(profile.getFlashcardStats());
        assertEquals(1, profile.getFlashcardStats().getTotalSessions());
        assertEquals(10, profile.getFlashcardStats().getTotalCardsStudied());
        assertEquals(8, profile.getFlashcardStats().getTotalCorrect());
        assertEquals(2, profile.getFlashcardStats().getTotalWrong());
        assertEquals(150, profile.getFlashcardStats().getTotalTimeSpentSeconds());
        assertEquals(80.0, profile.getFlashcardStats().getGeneralAccuracyPercentage());

        // Daily Activity checks
        List<DailyActivityDTO> daily = profile.getDailyActivity();
        assertNotNull(daily);
        assertEquals(2, daily.size());

        // Day 1 (2026-10-30): 5 questions + 10 flashcards = 15 total activity count
        DailyActivityDTO day1 = daily.get(0);
        assertEquals("2026-10-30", day1.getDate());
        assertEquals(5, day1.getQuestionsCount());
        assertEquals(10, day1.getFlashcardsCount());
        assertEquals(15, day1.getCount());

        // Day 2 (2026-10-31): 0 questions + 25 flashcards = 25 total activity count (carimbo ativo!)
        DailyActivityDTO day2 = daily.get(1);
        assertEquals("2026-10-31", day2.getDate());
        assertEquals(0, day2.getQuestionsCount());
        assertEquals(25, day2.getFlashcardsCount());
        assertEquals(25, day2.getCount());
    }
}
