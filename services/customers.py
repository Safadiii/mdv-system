from sqlmodel import Session, select
from fastapi import HTTPException

from database.models import Customer, SaleItem, Sale, SaleStatus
from models.customer import CustomerCreate, CustomerOverview
from models.sales import SaleDetail
from services.sales import get_sale_detail


def create_customer(session: Session, data: CustomerCreate):

    if data.email:
        existing = session.exec(
            select(Customer)
            .where(Customer.email == data.email)
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Customer with this email already exists"
            )


    customer = Customer.model_validate(data)

    session.add(customer)
    session.commit()
    session.refresh(customer)

    return customer


def get_customer(session: Session, customer_id: int):
    customer = session.get(Customer, customer_id)

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


def list_customers(session: Session):
    return session.exec(select(Customer)).all()

def get_customers(session: Session):

    customers = session.exec(
        select(Customer)
        .order_by(Customer.name)
    ).all()

    result = []

    for customer in customers:

        sales = session.exec(
            select(Sale)
            .where(Sale.customer_id == customer.id)
            .where(Sale.sale_status != SaleStatus.CANCELLED)
            .order_by(Sale.sale_date.desc())
        ).all()

        total_orders = len(sales)

        total_spent = 0

        for sale in sales:

            sale_items = session.exec(
                select(SaleItem)
                .where(SaleItem.sale_id == sale.id)
            ).all()

            total_spent += sum(
                (item.quantity * item.unit_price)
                * (1 - item.discount_percentage / 100)               
                for item in sale_items
            )

        last_order = (
            sales[0].sale_date.strftime("%Y-%m-%d")
            if sales
            else None
        )

        result.append(
            CustomerOverview(
                id=customer.id,
                name=customer.name,
                phone=customer.phone,
                email=customer.email,
                total_purchases=total_orders,
                total_spent=total_spent,
                last_order=last_order,
                active=customer.active
            )
        )

    return result

def toggle_customer_status(
    session: Session,
    customer_id: int
):

    customer = session.get(
        Customer,
        customer_id
    )


    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )


    customer.active = not customer.active


    session.add(customer)
    session.commit()
    session.refresh(customer)


    return customer

def get_customer_purchases(
    session: Session,
    customer_id: int,
) -> list[SaleDetail]:
    customer = session.get(Customer, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    sales = session.exec(
        select(Sale)
        .where(Sale.customer_id == customer_id)
        .order_by(Sale.sale_date.desc())
    ).all()

    return [
        get_sale_detail(session, sale.id)
        for sale in sales
    ]
