from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import tabelas
from schemas import validacoes
import seguranca

router = APIRouter(
    prefix="/auth",
    tags=["Autenticação"]
)

# ---------------------------------------------------------
# ROTA POST: Criar uma nova conta (Registo)
# ---------------------------------------------------------
@router.post("/registrar", response_model=validacoes.UsuarioResponse)
def registrar_usuario(usuario: validacoes.UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Normalização: Remove espaços extras e coloca e-mail em minúsculas
    email_normalizado = usuario.email.strip().lower()
    nome_normalizado = usuario.nome.strip()
    
    # DEBUG: Para ver exatamente o que está a ser processado
    print(f"DEBUG: Processando registro para: {email_normalizado}")

    # 2. Verifica se o e-mail já existe (usando o formato normalizado)
    usuario_existente = db.query(tabelas.Usuario).filter(tabelas.Usuario.email == email_normalizado).first()
    if usuario_existente:
        raise HTTPException(status_code=400, detail="Este e-mail já está registado.")
        
    # 3. Guarda o utilizador com dados tratados
    novo_usuario = tabelas.Usuario(
        nome=nome_normalizado,
        email=email_normalizado,
        senha_hash=seguranca.criar_hash_senha(usuario.senha)
    )
    
    try:
        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar no banco: {str(e)}")

# ---------------------------------------------------------
# ROTA POST: Fazer Login e receber o Token
# ---------------------------------------------------------
@router.post("/login")
def login(credenciais: validacoes.LoginRequest, db: Session = Depends(get_db)):
    # 1. Tenta encontrar o utilizador pelo e-mail (também normalizado)
    email_normalizado = credenciais.email.strip().lower()
    
    usuario = db.query(tabelas.Usuario).filter(tabelas.Usuario.email == email_normalizado).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        
    # 2. Testa se a senha digitada bate com o Hash guardado
    if not seguranca.verificar_senha(credenciais.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
        
    # 3. Gera o Token
    token = seguranca.criar_token_acesso({"sub": usuario.email, "id": usuario.id})
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "nome": usuario.nome
    }

@router.post("/esqueceu-senha")
def esqueceu_senha(email_req: validacoes.EmailRequest, db: Session = Depends(get_db)):
    email_normalizado = email_req.email.strip().lower()
    
    usuario = db.query(tabelas.Usuario).filter(tabelas.Usuario.email == email_normalizado).first()
    
    if not usuario:
        # Por segurança, não confirmamos se o e-mail existe ou não para evitar ataques de enumeração
        return {"detail": "Se este e-mail estiver registado, enviaremos um link de recuperação."}
    
    # AQUI ENTRA A LOGICA DE EMAIL:
    # 1. Gerar um token único e temporário de reset
    # 2. Salvar o token no banco com data de expiração
    # 3. Enviar um e-mail com o link (ex: seuapp.com/reset?token=xyz)
    print(f"DEBUG: Link de recuperação gerado para {email_normalizado}")
    
    return {"detail": "Se este e-mail estiver registado, enviaremos um link de recuperação."}