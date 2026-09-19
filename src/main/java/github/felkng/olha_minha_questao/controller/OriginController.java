package github.felkng.olha_minha_questao.controller;

import github.felkng.olha_minha_questao.dto.origin.OriginRequestDTO;
import github.felkng.olha_minha_questao.dto.origin.OriginResponseDTO;
import github.felkng.olha_minha_questao.service.OriginService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/origins")
@RequiredArgsConstructor
public class OriginController {

    private final OriginService originService;

    @GetMapping
    public ResponseEntity<List<OriginResponseDTO>> findAll() {
        return ResponseEntity.ok(originService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OriginResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(originService.findById(id));
    }

    @PostMapping
    public ResponseEntity<OriginResponseDTO> create(@Valid @RequestBody OriginRequestDTO dto) {
        OriginResponseDTO created = originService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OriginResponseDTO> update(@PathVariable Long id, @Valid @RequestBody OriginRequestDTO dto) {
        return ResponseEntity.ok(originService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        originService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
