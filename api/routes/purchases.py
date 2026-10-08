from fastapi import APIRouter, Depends
from sqlmodel import Session

from database.db import get_session

from services.purchase import (
    create_purchase,
    get_purchases,
    get_purchase_detail,
    update_purchase,
    delete_purchase,
)

from models.purchase import (
    PurchaseCreate,
    PurchaseUpdate,
)


router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)


@router.post("/")
def create_purchase_api(
    data: PurchaseCreate,
    session: Session = Depends(get_session)
):
    return create_purchase(
        session,
        data
    )


@router.get("/")
def get_all_purchases(
    session: Session = Depends(get_session)
):
    return get_purchases(
        session
    )


@router.get("/{purchase_id}")
def get_purchase_api(
    purchase_id: int,
    session: Session = Depends(get_session)
):
    return get_purchase_detail(
        session,
        purchase_id
    )


@router.patch("/{purchase_id}")
def update_purchase_api(
    purchase_id: int,
    data: PurchaseUpdate,
    session: Session = Depends(get_session)
):
    return update_purchase(
        session,
        purchase_id,
        data
    )



@router.delete("/{purchase_id}")
def delete_purchase_api(
    purchase_id: int,
    session: Session = Depends(get_session)
):
    return delete_purchase(
        session,
        purchase_id
    )