from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlmodel import Session

from services.invoices import build_purchase_invoice, build_sale_invoice
from database.db import get_session

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def _pdf_response(pdf: bytes, filename: str, download: bool) -> Response:
    disposition = "attachment" if download else "inline"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'},
    )


@router.get("/sales/{sale_id}")
def sale_invoice(
    sale_id: int,
    download: bool = Query(True, description="false = open in browser"),
    session: Session = Depends(get_session),
):
    pdf, filename = build_sale_invoice(session, sale_id)
    return _pdf_response(pdf, filename, download)


@router.get("/purchases/{purchase_id}")
def purchase_invoice(
    purchase_id: int,
    download: bool = Query(True, description="false = open in browser"),
    session: Session = Depends(get_session),
):
    pdf, filename = build_purchase_invoice(session, purchase_id)
    return _pdf_response(pdf, filename, download)