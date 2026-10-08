from fastapi import (
    APIRouter,
    Depends
)

from sqlmodel import Session

from database.db import (
    get_session
)

from services.dashboard import (
    get_dashboard
)

from models.dashboard import (
    DashboardResponse
)

from datetime import datetime

from fastapi.responses import StreamingResponse

from services.export import (
    export_database_excel
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/",
    response_model=DashboardResponse
)
def dashboard(
    session: Session = Depends(
        get_session
    )
):
    return get_dashboard(
        session
    )

@router.get("/export")
def export_database(
    session: Session = Depends(
        get_session
    )
):

    excel_file = export_database_excel(
        session
    )

    filename = (
        f"Backup_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    )

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/"
            "vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        }
    )