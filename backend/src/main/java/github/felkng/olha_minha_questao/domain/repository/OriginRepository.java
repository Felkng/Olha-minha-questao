package github.felkng.olha_minha_questao.domain.repository;

import github.felkng.olha_minha_questao.domain.entity.Origin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OriginRepository extends JpaRepository<Origin, Long> {
    Optional<Origin> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    java.util.List<Origin> findAllByOrderByNameAsc();
}
