from fastapi import APIRouter, Depends
from sqlmodel import Session
from database.db import get_session
from models.product import ProductCreate, ProductUpdate
from services.products import create_product, get_product, list_products, update_product

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("/", status_code=201)
def create(product: ProductCreate, session: Session = Depends(get_session)):
    return create_product(session, product)


@router.get("/{product_id}", status_code=200)
def get(product_id: int, session: Session = Depends(get_session)):
    return get_product(session, product_id)


@router.get("/", status_code=200)
def list_all(session: Session = Depends(get_session)):
    return list_products(session)

@router.patch("/{product_id}", status_code=200)
def update(
    product_id: int,
    product: ProductUpdate,
    session: Session = Depends(get_session)
):
    return update_product(
        session,
        product_id,
        product
    )