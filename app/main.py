from fastapi import FastAPI

from app.core.config import settings
from app.routers import health, team


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
    )

    app.include_router(health.router)
    app.include_router(team.router)
    return app


app = create_app()
