from sqlmodel import SQLModel, create_engine, Session
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = (
    f"mysql+pymysql://"
    f"{os.getenv('DB_USER')}:"
    f"{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:"
    f"{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)

engine = create_engine(
    DATABASE_URL,
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)



def get_session():
    with Session(engine) as session:
        yield session