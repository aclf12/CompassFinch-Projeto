from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import tabelas
import bcrypt
import jwt
from datetime import datetime, timedelta

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Configurações do Token
SECRET_KEY = "ADMINISTRATOR_2026_T4X"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Preparamos o erro genérico caso algo falhe
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # O PASSO 2 AQUI: O bloco try/except que protege o seu servidor
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise credentials_exception
            
    except jwt.exceptions.InvalidSignatureError:
        # Cai aqui se a chave mudou ou o token foi adulterado
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Assinatura do token inválida. Faça login novamente."
        )
    except jwt.exceptions.ExpiredSignatureError:
        # Cai aqui se o tempo do token (7 dias) acabou
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado. Faça login novamente."
        )
    except jwt.PyJWTError:
        # Qualquer outro erro maluco do JWT cai aqui
        raise credentials_exception
        
    user = db.query(tabelas.Usuario).filter(tabelas.Usuario.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário inválido")
    
    return user

def criar_hash_senha(senha: str) -> str:
    # 1. Converter senha para bytes e limitar a 72 bytes (limite do bcrypt)
    senha_bytes = senha.encode('utf-8')[:72]
    # 2. Gerar o salt e o hash
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha_bytes, salt)
    return hash_bytes.decode('utf-8')

def verificar_senha(senha_limpa: str, senha_hash: str) -> bool:
    # 1. Converter senha e hash para bytes
    senha_bytes = senha_limpa.encode('utf-8')[:72]
    hash_bytes = senha_hash.encode('utf-8')
    # 2. Comparar
    return bcrypt.checkpw(senha_bytes, hash_bytes)

def criar_token_acesso(dados: dict):
    copia_dados = dados.copy()
    expiracao = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    copia_dados.update({"exp": expiracao})
    
    token_jwt = jwt.encode(copia_dados, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt