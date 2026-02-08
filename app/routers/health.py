from fastapi import APIRouter

from app.schemas.response import ApiResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=ApiResponse)
def health_check() -> ApiResponse:
    return ApiResponse(success=True, message="ok", data=None)
