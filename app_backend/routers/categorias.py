from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import tabelas
from schemas import validacoes
import seguranca

router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"]
)

# ---------------------------------------------------------
# ROTA POST: Cria uma nova categoria
# ---------------------------------------------------------
@router.post("/", response_model=validacoes.CategoriaResponse)
def criar_categoria(categoria: validacoes.CategoriaCreate, db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    nova_categoria = tabelas.Categoria(
        titulo=categoria.titulo,
        icone=categoria.icone,
        tipo=categoria.tipo,
        user_id=current_user.id
    )
    db.add(nova_categoria)
    db.commit()
    db.refresh(nova_categoria)
    return nova_categoria

# ---------------------------------------------------------
# ROTA GET: Lista todas as categorias
# ---------------------------------------------------------
@router.get("/", response_model=List[validacoes.CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # O joinedload FORÇA o banco a buscar as transações junto com a categoria num único comando!
    categorias = db.query(tabelas.Categoria).filter(tabelas.Categoria.user_id == current_user.id).all()
    return categorias

# ---------------------------------------------------------
# ROTA PUT: Edita o título ou o ícone de uma categoria existente
# ---------------------------------------------------------
@router.put("/{categoria_id}", response_model=validacoes.CategoriaResponse)
def atualizar_categoria(categoria_id: int, dados: dict, db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    categoria = db.query(tabelas.Categoria).filter(tabelas.Categoria.id == categoria_id, tabelas.Categoria.user_id == current_user.id).first()
    if not categoria: raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
    if "titulo" in dados:
        categoria.titulo = dados["titulo"]
    if "icone" in dados:
        categoria.icone = dados["icone"]
        
    db.commit()
    db.refresh(categoria)
    return categoria

# ---------------------------------------------------------
# ROTA DELETE: Remove uma categoria do PostgreSQL
# ---------------------------------------------------------
@router.delete("/{categoria_id}")
def deletar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(tabelas.Categoria).filter(tabelas.Categoria.id == categoria_id).first()
    
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
    # Proteção do fluxo de caixa:
    # Desvincula transações órfãs definindo a categoria delas como nula,
    # assim você não perde o histórico de gastos se apagar a categoria.
    db.query(tabelas.Transacao).filter(tabelas.Transacao.categoria_id == categoria_id).update({tabelas.Transacao.categoria_id: None})
    
    db.delete(categoria)
    db.commit()
    return {"detail": "Categoria excluída com sucesso!"}