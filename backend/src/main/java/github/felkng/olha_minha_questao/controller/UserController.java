package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.user.UserProfileDTO;
import github.felkng.olha_minha_questao.dto.user.UserSummaryDTO;
import github.felkng.olha_minha_questao.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PatchMapping("/{id}/promote-admin")
    public ResponseEntity<UserSummaryDTO> promoteToAdmin(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long actingUserId) {
        return ResponseEntity.ok(userService.promoteToAdmin(id, actingUserId));
    }
}
