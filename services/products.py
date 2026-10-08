from sqlmodel import Session, select
from database.models import Product
from models.product import ProductCreate, ProductUpdate
from fastapi import HTTPException

def create_product(session: Session, product_data: ProductCreate):
    product = Product.model_validate(product_data)

    session.add(product)
    session.commit()
    session.refresh(product)
    return product


def get_product(session: Session, product_id: int):
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def list_products(session: Session):
    return session.exec(select(Product)).all()


def update_product(
    session: Session,
    product_id: int,
    product_data: ProductUpdate
):
    product = session.get(Product, product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    # Make sure SKU isn't being used by another product
    if "sku" in update_data:
        existing = session.exec(
            select(Product).where(
                Product.sku == update_data["sku"],
                Product.id != product_id
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="A product with this SKU already exists"
            )

    for key, value in update_data.items():
        setattr(product, key, value)

    session.add(product)

    session.commit()

    session.refresh(product)

    return product