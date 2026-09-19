package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByAreaIdOrderByNameAsc(Long areaId);
    Optional<Subject> findByName(String name);
    List<Subject> findAllByOrderByNameAsc();
}
