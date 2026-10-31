.PHONY: all run start build test docker-up clean

all: run

run:
	@./start.sh

start:
	@./start.sh

build:
	@npm --prefix frontend run build

test:
	@cd backend && PYTHONPATH=. ./venv/bin/pytest tests/

docker-up:
	@docker-compose up --build

clean:
	@rm -rf backend.log frontend.log
