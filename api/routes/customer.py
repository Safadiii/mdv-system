from fastapi import APIRouter, Depends
from sqlmodel import Session
from models.customer import CustomerOverview

from database.db import get_session
from services.customers import (
    create_customer,
    get_customer,
    list_customers,
    get_customers,
    toggle_customer_status,
    get_customer_purchases
)
from models.customer import CustomerCreate, CustomerRead
from models.sales import SaleDetail

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerRead, status_code=201)
def create(customer: CustomerCreate, session: Session = Depends(get_session)):
    return create_customer(session, customer)


@router.get("/{customer_id}", response_model=CustomerRead, status_code=200)
def get(customer_id: int, session: Session = Depends(get_session)):
    return get_customer(session, customer_id)


@router.get("/", response_model=list[CustomerOverview])
def list_all_customers(session: Session = Depends(get_session)):
    return get_customers(session)

@router.patch("/{customer_id}/status", response_model=CustomerRead)
def toggle_status(
    customer_id: int,
    session: Session = Depends(get_session)
):

    return toggle_customer_status(
        session,
        customer_id
    )

@router.get(
    "/{customer_id}/purchases",
    response_model=list[SaleDetail],
    status_code=200,
)
def purchase_history(
    customer_id: int,
    session: Session = Depends(get_session),
):
    return get_customer_purchases(session, customer_id)