import os
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username="root",
    password=os.environ.get("FINDBACK_DB_PASSWORD", ""),
    host="127.0.0.1",
    port=3306,
    database="findback_db"
)


engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()