from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de Conexão Local: postgresql://utilizador:senha@localhost:porta/nome_do_banco
# Substitua 'suasenhaaqui' pela senha que definiu na instalação do PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin@localhost:5432/compass_finch"

# O Engine é o motor que gere as conexões com o PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cada instância da classe SessionLocal será uma sessão de conversação com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe base para mapear as tabelas do banco em classes Python (Models)
Base = declarative_base()

# Função utilitária para abrir e fechar a conexão a cada requisição da API
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
