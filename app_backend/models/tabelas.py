from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base # Importamos aquela base de conexão que criamos


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    
# 1. TABELA DE CATEGORIAS
class Categoria(Base):
    __tablename__ = "categorias" # Nome oficial da tabela no PostgreSQL

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False) # Ex: "Alimentação", "Casa"
    icone = Column(String) # O nome do ícone do Ionicons. Ex: "home-outline"
    tipo = Column(String, default="despesa")
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    # Isso cria uma ponte invisível: Uma categoria pode ter várias transações
    transacoes = relationship("Transacao", back_populates="categoria")

# 2. TABELA DE TRANSAÇÕES (Receitas e Despesas)
class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, nullable=False) # "receita" ou "despesa"
    descricao = Column(String, nullable=False) # Ex: "Supermercado"
    valor = Column(Float, nullable=False) # Ex: 450.00
    data = Column(String, nullable=False) # Ex: "08/06"
    user_id = Column(Integer, ForeignKey("usuarios.id"))
    # Chave Estrangeira (ForeignKey): Liga esta transação a uma Categoria específica
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    
    # A ponte de volta para a categoria
    categoria = relationship("Categoria", back_populates="transacoes")

# 3. TABELA DE METAS
class MetaFinanceira(Base):
    __tablename__ = "metas"

    user_id = Column(Integer, ForeignKey("usuarios.id"))
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, nullable=False) # Ex: "Comprar um carro"
    valor = Column(Float, nullable=False) # Ex: 200000.00
    valor_atual = Column(Float, default=0.0)
    data_previsao = Column(String) # Ex: "Dez/2026"
    concluida = Column(Boolean, default=False) # True se a meta foi batida, False se está pendente