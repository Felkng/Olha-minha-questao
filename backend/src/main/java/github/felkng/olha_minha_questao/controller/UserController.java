package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.user.UserProfileDTO;
import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import github.felkng.olha_minha_questao.dto.user.UserUpdateRequestDTO;
import github.felkng.olha_minha_questao.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final github.felkng.olha_minha_questao.service.StatisticsService statisticsService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @GetMapping("/{id}/question-attempts")
    public ResponseEntity<java.util.List<github.felkng.olha_minha_questao.dto.question.QuestionAttemptHistoryDTO>> getUserQuestionAttempts(@PathVariable Long id) {
        return ResponseEntity.ok(statisticsService.getUserQuestionAttempts(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserSummaryDTO> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequestDTO dto,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId) {
        return ResponseEntity.ok(userService.updateUser(id, dto, actingUserId));
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<UserSummaryDTO>> findAll(
            @org.springframework.web.bind.annotation.RequestParam(required = false) String search,
            @org.springframework.web.bind.annotation.RequestParam(required = false) github.felkng.olha_minha_questao.domain.entity.UserRole role,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Boolean isBlocked,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(userService.findAllUsers(search, role, isBlocked, pageable, actingUserId));
    }

    @PatchMapping("/{id}/toggle-block")
    public ResponseEntity<UserSummaryDTO> toggleBlock(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId) {
        return ResponseEntity.ok(userService.toggleBlockUser(id, actingUserId));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserSummaryDTO> updateRole(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId) {
        String roleStr = body.get("role");
        if (roleStr == null || roleStr.trim().isEmpty()) {
            throw new IllegalArgumentException("O campo 'role' é obrigatório.");
        }
        github.felkng.olha_minha_questao.domain.entity.UserRole newRole = github.felkng.olha_minha_questao.domain.entity.UserRole.valueOf(roleStr.trim().toUpperCase());
        return ResponseEntity.ok(userService.setUserRole(id, newRole, actingUserId));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId) {
        userService.deleteUser(id, actingUserId);
        return ResponseEntity.noContent().build();
    }
}
