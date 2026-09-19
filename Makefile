MVN = ./mvnw

.PHONY: build up down logs status \
        clean compile test package package-all run \
        mvn-clean mvn-compile mvn-test mvn-package mvn-package-all mvn-run \
        frontend-install frontend-dev frontend-build

# ==========================================
# Docker Commands
# ==========================================

# Derruba os containers atuais e sobe nova versão com o código modificado
build:
	docker compose down
	docker compose up -d --build

# Sobe os containers
up:
	docker compose up -d

# Derruba os containers
down:
	docker compose down

# Exibe os logs dos containers em tempo real
logs:
	docker compose logs -f

# Exibe o status dos containers
status:
	docker compose ps

# ==========================================
# Maven Commands
# ==========================================

# Limpa o diretório target
clean mvn-clean:
	$(MVN) clean

# Compila o código-fonte
compile mvn-compile:
	$(MVN) compile

# Executa os testes automatizados
test mvn-test:
	$(MVN) test

# Gera o pacote jar (pulando testes)
package mvn-package:
	$(MVN) clean package -DskipTests

# Gera o pacote jar executando todos os testes
package-all mvn-package-all:
	$(MVN) clean package

# Executa a aplicação localmente via Spring Boot
run mvn-run:
	$(MVN) spring-boot:run

# ==========================================
# Frontend Commands
# ==========================================

# Instala as dependências do frontend
frontend-install:
	cd frontend && npm install

# Executa o servidor de desenvolvimento do frontend
frontend-dev:
	cd frontend && npm run dev

# Gera a build de produção do frontend
frontend-build:
	cd frontend && npm run build

