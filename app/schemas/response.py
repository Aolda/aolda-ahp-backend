from typing import Any, Optional

from pydantic import BaseModel


class ApiResponse(BaseModel):
    """
    API 응답 형식은 추후 제공될 문서를 기준으로 수정 예정입니다.
    """

    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
