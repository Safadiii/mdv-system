from fastapi import APIRouter, Depends
from sqlmodel import Session
from database.db import get_session
from models.sales import SaleCreate, SaleUpdate
from services.sales import create_sale, get_sales, get_sale_detail, update_sale, delete_sale

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("/", status_code=201)
def create(data: SaleCreate, session: Session = Depends(get_session)):
    return create_sale(session, data)

@router.get("/sales")
def get_all_sales(
    session: Session = Depends(get_session)
):

    return get_sales(session)



@router.get("/{sale_id}")
def get_sale_by_id(sale_id: int, session: Session = Depends(get_session)):
    return get_sale_detail(session, sale_id)

@router.put("/{sale_id}")
def update(sale_id: int, data: SaleUpdate, session: Session = Depends(get_session)):
    return update_sale(session, sale_id, data)

@router.delete("/{sale_id}")
def delete(
    sale_id: int,
    session: Session = Depends(get_session)
):
    return delete_sale(
        session,
        sale_id
    )