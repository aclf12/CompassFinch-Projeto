from fastapi import FastAPI
from database import engine, Base
from models import tabelas
from routers import transacoes, categorias, metas, auth

app = FastAPI(
    title="Compass Finch API",
    description="Backend para o assistente financeiro",
    version="1.0.0"
)
#print("--- REINICIANDO BANCO DE DADOS ---")
#Base.metadata.drop_all(bind=engine)  # Apaga tudo
Base.metadata.create_all(bind=engine) # Cria tudo de novo, AGORA COM A COLUNA user_id
#print("--- BANCO DE DADOS REINICIADO COM SUCESSO ---")

app.include_router(transacoes.router)
app.include_router(categorias.router)
app.include_router(metas.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"status": "Servidor online!", "app": "Compass Finch"}

@app.get("/ping")
def ping_teste():
    return {"mensagem": "A conexão entre o Emulador e o FastAPI está funcionando!"}