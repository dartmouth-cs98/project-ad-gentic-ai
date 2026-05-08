.PHONY: help up down build logs backend frontend

help:
	@echo "Available commands:"
	@echo "  make up         - Start the application (backend & frontend)"
	@echo "  make backend    - Start only the backend"
	@echo "  make frontend   - Start only the frontend"
	@echo "  make down       - Stop the application"
	@echo "  make build      - Rebuild the containers"
	@echo "  make logs       - View logs"

up:
	docker-compose up

backend:
	docker-compose up backend

frontend:
	docker-compose up frontend

down:
	docker-compose down

build:
	docker-compose up --build

logs:
	docker-compose logs -f

