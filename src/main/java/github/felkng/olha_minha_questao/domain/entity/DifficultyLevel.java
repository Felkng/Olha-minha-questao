package github.felkng.olha_minha_questao.domain.entity;

public enum DifficultyLevel {
    FACIL,
    MEDIA,
    DIFICIL,
    SEM_DADOS;

    public static DifficultyLevel fromAccuracy(Double accuracyPercentage) {
        if (accuracyPercentage == null) {
            return SEM_DADOS;
        }
        if (accuracyPercentage >= 80.0) {
            return FACIL;
        } else if (accuracyPercentage >= 50.0) {
            return MEDIA;
        } else {
            return DIFICIL;
        }
    }
}
