from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.db import get_session
from services.suppliers import (
    create_supplier,
    get_supplier,
    get_suppliers,
    toggle_supplier_status,
    get_supplier_purchases
)
from models.suppliers import SupplierCreate, SupplierRead, SupplierOverview, SupplierPurchaseRead

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("/", response_model=SupplierRead, status_code=201)
def create(supplier: SupplierCreate, session: Session = Depends(get_session)):
    return create_supplier(session, supplier)


@router.get("/{supplier_id}", response_model=SupplierRead, status_code=200)
def get(supplier_id: int, session: Session = Depends(get_session)):
    return get_supplier(session, supplier_id)



@router.get("/", response_model=list[SupplierOverview])
def list_suppliers(
    session: Session = Depends(get_session)
):
    return get_suppliers(session)

@router.patch("/{supplier_id}/status", response_model=SupplierRead)
def toggle_status(
    supplier_id: int,
    session: Session = Depends(get_session)
):
    return toggle_supplier_status(
        session,
        supplier_id
    )

@router.get(
    "/{supplier_id}/purchases",
    response_model=list[SupplierPurchaseRead]
)
def supplier_purchases(
    supplier_id: int,
    session: Session = Depends(get_session)
):
    return get_supplier_purchases(
        session,
        supplier_id
    )