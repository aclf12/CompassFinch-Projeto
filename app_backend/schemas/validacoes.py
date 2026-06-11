from pydantic import BaseModel, EmailStr
from typing import List, Optional

# ==========================================
# 1. SCHEMAS PARA TRANSAÇÕES (Movemos para cima)
# ==========================================
class TransacaoBase(BaseModel):
    tipo: str            
    descricao: str       
    valor: float         
    data: str            
    categoria_id: Optional[int] = None

class TransacaoCreate(TransacaoBase):
    pass

class TransacaoResponse(TransacaoBase):
    id: int
    descricao: str
    valor: float
    data: str
    tipo: str

    class Config:
        from_attributes = True


# ==========================================
# 2. SCHEMAS PARA CATEGORIAS
# ==========================================
class CategoriaBase(BaseModel):
    titulo: str          
    icone: str 
    tipo: str          

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(BaseModel): 
    id: int
    titulo: str
    icone: str
    tipo: str = "despesa" 

    # Isso diz ao FastAPI: "Pode liberar o envio do histórico para o celular!"
    transacoes: List[TransacaoResponse] = []

    class Config:
        from_attributes = True # Atualizado para o padrão mais moderno

# ==========================================
# 3. SCHEMAS PARA METAS FINANCEIRAS
# ==========================================
class MetaBase(BaseModel):
    titulo: str          
    valor: float    
    valor_atual: float = 0.0     
    data_previsao: str   
    concluida: bool = False 

class MetaCreate(MetaBase):
    pass

class MetaResponse(BaseModel):
    id: int
    titulo: str
    valor: float
    valor_atual: float = 0.0  # <-- VEJA SE ESTÁ AQUI
    data_previsao: str
    concluida: bool = False   # <-- VEJA SE ESTÁ AQUI

    class Config:
        from_attributes = True  # Ou orm_mode = True se for uma versão mais antiga do Pydantic

# ----------------------------------------
# SCHEMAS DE AUTENTICAÇÃO E USUÁRIO
# ----------------------------------------
class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str

    class Config:
        from_attributes = True  # Se estiver usando Pydantic v1, use orm_mode = True

class LoginRequest(BaseModel):
    email: str
    senha: str

class EmailRequest(BaseModel):
    email: EmailStr # Certifique-se de ter o pydantic[email] instalado