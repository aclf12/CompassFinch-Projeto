from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime

# Importamos os nossos próprios ficheiros
from database import get_db
from models import tabelas
from schemas import validacoes
import seguranca

# Criamos o nosso "balcão de atendimento" focado em transações
router = APIRouter(
    prefix="/transacoes",
    tags=["Transações"]
)

# ---------------------------------------------------------
# ROTA POST: O React Native usa para CRIAR uma nova despesa/receita
# ---------------------------------------------------------
@router.post("/", response_model=validacoes.TransacaoResponse)
def criar_transacao(transacao: validacoes.TransacaoCreate, db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # 1. Pegamos nos dados validados pelo Pydantic e preparamos para o formato do SQLAlchemy
    nova_transacao = tabelas.Transacao(
        tipo=transacao.tipo,
        descricao=transacao.descricao,
        valor=transacao.valor,
        data=transacao.data,
        categoria_id=transacao.categoria_id,
        user_id= current_user.id
    )
    
    # 2. Adicionamos ao banco e guardamos (commit)
    db.add(nova_transacao)
    db.commit()
    db.refresh(nova_transacao) # Atualiza a variável para pegar o ID gerado pelo banco
    
    # 3. Devolvemos a transação salva (agora com ID) para o telemóvel
    return nova_transacao


# ---------------------------------------------------------
# ROTA GET: O React Native usa para LISTAR o histórico do mês
# ---------------------------------------------------------
@router.get("/", response_model=List[validacoes.TransacaoResponse])
def listar_transacoes(db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # Fazemos um SELECT * FROM transacoes;
    transacoes = db.query(tabelas.Transacao).filter(tabelas.Transacao.user_id == current_user.id).all()
    return transacoes

@router.get("/saldo")
def obter_saldo(db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # 1. Soma o valor de todas as transações do tipo 'receita'
    total_receitas = db.query(func.sum(tabelas.Transacao.valor)).filter(
        tabelas.Transacao.user_id == current_user.id, 
        tabelas.Transacao.tipo == "receita"
    ).scalar() or 0.0
    
    # 2. Soma o valor de todas as transações do tipo 'despesa'
    total_despesas = db.query(func.sum(tabelas.Transacao.valor)).filter(
        tabelas.Transacao.user_id == current_user.id, 
        tabelas.Transacao.tipo == "despesa"
    ).scalar() or 0.0
    
    # 3. Faz a matemática pura
    saldo_atual = total_receitas - total_despesas
    
    # Devolve o resultado em JSON para o frontend
    return {"saldo": saldo_atual}

# ---------------------------------------------------------
# ROTA GET: Dados dinâmicos para o Gráfico da Home (Últimos 4 meses)
# ---------------------------------------------------------
@router.get("/grafico")
def obter_dados_grafico(db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    hoje = datetime.now()
    meses_nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    # 1. Constrói a linha do tempo (Os últimos 4 meses)
    periodos = []
    for i in range(3, -1, -1):
        mes_calc = hoje.month - i
        ano_calc = hoje.year
        
        # Corrige a matemática se tivermos virado o ano (ex: Janeiro recuando para Dezembro)
        if mes_calc <= 0:
            mes_calc += 12
            ano_calc -= 1
            
        nome_mes = meses_nomes[mes_calc - 1]
        padrao_busca = f"/{mes_calc:02d}/{ano_calc}" # Formato exato do banco: /06/2026
        
        periodos.append({"nome": nome_mes, "padrao": padrao_busca, "total": 0.0})
        
    # 2. Busca todas as saídas de dinheiro do banco de dados
    despesas = db.query(tabelas.Transacao).filter(tabelas.Transacao.user_id==current_user.id,tabelas.Transacao.tipo == "despesa").all()
    
    # 3. Distribui os valores pelos meses correspondentes
    for despesa in despesas:
        if despesa.data:
            for periodo in periodos:
                if despesa.data.endswith(periodo["padrao"]):
                    periodo["total"] += float(despesa.valor)
                    break
                    
    # 4. Separa os dados no formato exato que o React Native Chart Kit exige
    labels = [p["nome"] for p in periodos]
    data_valores = [p["total"] for p in periodos]
    
    # Se não houver absolutamente nenhum gasto, enviamos zeros para o gráfico não quebrar a tela
    if not any(data_valores):
        data_valores = [0, 0, 0, 0]
        
    return {
        "labels": labels,
        "datasets": [{"data": data_valores}]
    }

# ---------------------------------------------------------
# ROTA GET: Análise Mensal Detalhada (Analytics)
# ---------------------------------------------------------
@router.get("/analise/{mes}/{ano}")
def analise_mensal(mes: int, ano: int, db: Session = Depends(get_db),current_user: tabelas.Usuario = Depends(seguranca.get_current_user)):
    # Formata o mês para ter sempre 2 dígitos (ex: 6 vira "06") e cria o padrão de busca
    mes_str = str(mes).zfill(2)
    padrao_data = f"/{mes_str}/{ano}"
    
    # 1. Busca todas as transações que aconteceram neste mês específico
    transacoes_mes = db.query(tabelas.Transacao).filter(tabelas.Transacao.user_id==current_user.id ,tabelas.Transacao.data.endswith(padrao_data)).all()
    
    total_receitas = 0.0
    total_despesas = 0.0
    categorias_dict = {}
    
    # 2. Separa receitas de despesas e agrupa os gastos por categoria
    for t in transacoes_mes:
        if t.tipo == "receita":
            total_receitas += float(t.valor)
        elif t.tipo == "despesa":
            total_despesas += float(t.valor)
            
            # Se a despesa tiver categoria, somamos o valor nela. Se não, vai para "Outros"
            if t.categoria_id:
                categoria = db.query(tabelas.Categoria).filter(tabelas.Categoria.id == t.categoria_id).first()
                nome_cat = categoria.titulo if categoria else "Outros"
            else:
                nome_cat = "Metas / Outros"
                
            if nome_cat in categorias_dict:
                categorias_dict[nome_cat] += float(t.valor)
            else:
                categorias_dict[nome_cat] = float(t.valor)
                
    # 3. Prepara a estrutura EXATA que o <PieChart> do React Native exige
    # Uma paleta de cores cyberpunk/neon para combinar com o seu layout
    paleta_cores = ["#00FF4D", "#FF3333", "#FFB800", "#008A2A", "#00E5FF", "#B026FF", "#FFF"]
    distribuicao_grafico = []
    
    i = 0
    for nome, valor in categorias_dict.items():
        distribuicao_grafico.append({
            "name": nome,
            "population": valor, # O React Native Chart Kit usa a palavra 'population' para o valor
            "color": paleta_cores[i % len(paleta_cores)],
            "legendFontColor": "#AAA",
            "legendFontSize": 12
        })
        i += 1
        
    # Se não houver despesas, mandamos um gráfico vazio e cinza para a tela não quebrar
    if not distribuicao_grafico:
        distribuicao_grafico.append({
            "name": "Sem gastos",
            "population": 1,
            "color": "#222",
            "legendFontColor": "#555",
            "legendFontSize": 12
        })

    return {
        "resumo": {
            "receitas": total_receitas,
            "despesas": total_despesas,
            "saldo_livre": total_receitas - total_despesas
        },
        "grafico_pizza": distribuicao_grafico
    }