package github.felkng.olha_minha_questao.service;

import github.felkng.olha_minha_questao.domain.entity.User;
import github.felkng.olha_minha_questao.domain.entity.UserRole;
import github.felkng.olha_minha_questao.domain.repository.UserRepository;
import github.felkng.olha_minha_questao.dto.auth.AuthResponseDTO;
import github.felkng.olha_minha_questao.dto.auth.LoginRequestDTO;
import github.felkng.olha_minha_questao.dto.auth.RegisterRequestDTO;
import github.felkng.olha_minha_questao.exception.ResourceNotFoundException;
import github.felkng.olha_minha_questao.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO dto) {
        if (userRepository.existsByEmail(dto.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Já existe um usuário cadastrado com este e-mail.");
        }

        User user = User.builder()
                .name(dto.getName().trim())
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(hashPassword(dto.getPassword()))
                .role(UserRole.GENERAL)
                .build();

        User saved = userRepository.save(user);
        AuthResponseDTO response = userMapper.toAuthResponseDTO(saved);
        response.setToken("token-usr-" + saved.getId() + "-" + System.currentTimeMillis());
        return response;
    }

    @Transactional(readOnly = true)
    public AuthResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas: e-mail não encontrado."));

        if (!hashPassword(dto.getPassword()).equals(user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciais inválidas: senha incorreta.");
        }

        AuthResponseDTO response = userMapper.toAuthResponseDTO(user);
        response.setToken("token-usr-" + user.getId() + "-" + System.currentTimeMillis());
        return response;
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com id: " + id));
    }

    public String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao criptografar senha", e);
        }
    }
}
