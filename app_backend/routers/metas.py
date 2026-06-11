from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import tabelas
from schemas import validacoes
import seguranca

router = APIRouter(
    prefix="/metas",
    tags=["Metas"]
)

# ---------------------------------------------------------
# ROTA POST: Cria uma nova meta (Com abatimento de saldo)
# ---------------------------------------------------------
@router.post("/", response_model=validacoes.MetaResponse)
def criar_meta(meta: validacoes.MetaCreate, db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    nova_meta = tabelas.MetaFinanceira(
        titulo=meta.titulo,
        valor=meta.valor,
        valor_atual=meta.valor_atual,  
        data_previsao=meta.data_previsao,
        concluida=meta.concluida,
        user_id=current_user.id
    )
    db.add(nova_meta)
    
    # --- O GATILHO QUE FALTAVA ---
    # Se o utilizador já preencher o "Valor já guardado" na criação, morde o saldo global
    if meta.valor_atual > 0:
        hoje = datetime.now().strftime("%d/%m/%Y")
        transacao_reserva = tabelas.Transacao(
            tipo="despesa",
            descricao=f"Reserva Inicial: {meta.titulo}",
            valor=meta.valor_atual,
            data=hoje,
            categoria_id=None,
            user_id=current_user.id  # <--- ADICIONADO: Agora a transação tem dono!
        )
        db.add(transacao_reserva)
    # -----------------------------

    db.commit()
    db.refresh(nova_meta)
    return nova_meta

# ---------------------------------------------------------
# ROTA GET: Lista todas as metas
# ---------------------------------------------------------
@router.get("/", response_model=List[validacoes.MetaResponse])
def listar_metas(db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    metas = db.query(tabelas.MetaFinanceira).filter(tabelas.MetaFinanceira.user_id == current_user.id).all()
    return metas

# ---------------------------------------------------------
# ROTA PUT: O motor do Checkbox (Com Estorno Automático)
# ---------------------------------------------------------
@router.put("/{meta_id}", response_model=validacoes.MetaResponse)
def atualizar_meta(meta_id: int, dados_atualizados: dict, db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # Adicionado filtro para garantir que a meta é do usuário logado
    meta = db.query(tabelas.MetaFinanceira).filter(tabelas.MetaFinanceira.id == meta_id, tabelas.MetaFinanceira.user_id == current_user.id).first()
    
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
    hoje = datetime.now().strftime("%d/%m/%Y")

    if "concluida" in dados_atualizados:
        novo_status = dados_atualizados["concluida"]
        
        # CASO 1: O utilizador MARCOU o checkbox (Concluiu a meta)
        if novo_status is True and meta.concluida is False:
            diferenca = meta.valor - meta.valor_atual
            if diferenca > 0:
                transacao_reserva = tabelas.Transacao(
                    tipo="despesa",
                    descricao=f"Reserva Final: {meta.titulo}",
                    valor=diferenca,
                    data=hoje,
                    categoria_id=None,
                    user_id=current_user.id  # <--- ADICIONADO
                )
                db.add(transacao_reserva)
            meta.valor_atual = meta.valor
            meta.concluida = True
            
        # CASO 2: O utilizador DESMARCOU o checkbox (Arrependeu-se ou errou)
        elif novo_status is False and meta.concluida is True:
            # Devolvemos todo o dinheiro guardado para o saldo global (como receita)
            if meta.valor_atual > 0:
                transacao_estorno = tabelas.Transacao(
                    tipo="receita", 
                    descricao=f"Estorno de Meta: {meta.titulo}",
                    valor=meta.valor_atual,
                    data=hoje,
                    categoria_id=None,
                    user_id=current_user.id  # <--- ADICIONADO
                )
                db.add(transacao_estorno)
            
            # Zera a meta para a pessoa poder começar a separar os valores novamente
            meta.valor_atual = 0.0
            meta.concluida = False

    db.commit()
    db.refresh(meta)
    return meta

# ---------------------------------------------------------
# ROTA PUT: Separar Valor Adicional
# ---------------------------------------------------------
@router.put("/{meta_id}/separar", response_model=validacoes.MetaResponse)
def separar_valor_meta(meta_id: int, dados: dict, db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    meta = db.query(tabelas.MetaFinanceira).filter(tabelas.MetaFinanceira.id == meta_id, tabelas.MetaFinanceira.user_id == current_user.id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
    valor_a_separar = float(dados.get("valor_a_separar", 0))
    
    if valor_a_separar <= 0:
        raise HTTPException(status_code=400, detail="O valor inserido deve ser maior que zero")
        
    meta.valor_atual += valor_a_separar
    if meta.valor_atual >= meta.valor:
        meta.concluida = True
        
    hoje = datetime.now().strftime("%d/%m/%Y")
    transacao_reserva = tabelas.Transacao(
        tipo="despesa",
        descricao=f"Reserva Meta: {meta.titulo}",
        valor=valor_a_separar,
        data=hoje,
        categoria_id=None,
        user_id=current_user.id  # <--- ADICIONADO
    )
    db.add(transacao_reserva)
    
    db.commit()
    db.refresh(meta)
    return meta

# ---------------------------------------------------------
# NOVA ROTA PUT: Corrigir o valor exato guardado (Ajusta o saldo)
# ---------------------------------------------------------
@router.put("/{meta_id}/corrigir", response_model=validacoes.MetaResponse)
def corrigir_valor_meta(meta_id: int, dados: dict, db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    meta = db.query(tabelas.MetaFinanceira).filter(tabelas.MetaFinanceira.id == meta_id, tabelas.MetaFinanceira.user_id == current_user.id).first()
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
    # Captura o novo valor exato que o utilizador digitou
    novo_valor = float(dados.get("novo_valor", 0))
    if novo_valor < 0:
        raise HTTPException(status_code=400, detail="O valor não pode ser negativo")
        
    valor_antigo = meta.valor_atual
    diferenca = novo_valor - valor_antigo
    hoje = datetime.now().strftime("%d/%m/%Y")
    
    # Se a diferença for positiva (colocou mais dinheiro), é Despesa
    if diferenca > 0:
        transacao = tabelas.Transacao(
            tipo="despesa",
            descricao=f"Ajuste Meta (Adição): {meta.titulo}",
            valor=diferenca,
            data=hoje,
            categoria_id=None,
            user_id=current_user.id  # <--- ADICIONADO
        )
        db.add(transacao)
        
    # Se a diferença for negativa (tinha colocado a mais por engano), é Receita (Estorno)
    elif diferenca < 0:
        transacao = tabelas.Transacao(
            tipo="receita",
            descricao=f"Ajuste Meta (Estorno): {meta.titulo}",
            valor=abs(diferenca), # abs() transforma número negativo em positivo
            data=hoje,
            categoria_id=None,
            user_id=current_user.id  # <--- ADICIONADO
        )
        db.add(transacao)

    # Atualiza a meta com o valor corrigido e verifica se concluiu
    meta.valor_atual = novo_valor
    if meta.valor_atual >= meta.valor:
        meta.concluida = True
    else:
        meta.concluida = False
        
    db.commit()
    db.refresh(meta)
    return meta

# ---------------------------------------------------------
# ROTA DELETE: Remove a meta e devolve o dinheiro se houver
# ---------------------------------------------------------
@router.delete("/{meta_id}")
def deletar_meta(meta_id: int, db: Session = Depends(get_db), current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    meta = db.query(tabelas.MetaFinanceira).filter(tabelas.MetaFinanceira.id == meta_id, tabelas.MetaFinanceira.user_id == current_user.id).first()
    
    if not meta:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    
    # Se a pessoa apagar uma meta que tinha dinheiro guardado, faz o estorno!
    if meta.valor_atual > 0:
        hoje = datetime.now().strftime("%d/%m/%Y")
        transacao_estorno = tabelas.Transacao(
            tipo="receita",
            descricao=f"Estorno (Meta Apagada): {meta.titulo}",
            valor=meta.valor_atual,
            data=hoje,
            categoria_id=None,
            user_id=current_user.id  # <--- ADICIONADO
        )
        db.add(transacao_estorno)
        
    db.delete(meta)
    db.commit()
    return {"detail": "Meta excluída com sucesso!"}