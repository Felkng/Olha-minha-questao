from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from parser import parse_exam_pdf, parse_answer_key_pdf
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdf-worker")

app = FastAPI(title="Olha Minha Questão - PDF Worker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/parse-exam-pdf")
async def parse_exam(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")

    try:
        content = await file.read()
        result = parse_exam_pdf(content)
        logger.info(f"Parsed {len(result.get('questions', []))} questions and {len(result.get('textualReferences', []))} references from {file.filename}")
        return result
    except Exception as e:
        logger.error(f"Error parsing exam PDF {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF da prova: {str(e)}")

@app.post("/parse-answer-key-pdf")
async def parse_answer_key(
    file: UploadFile = File(...),
    prova_name: str = None
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são suportados.")

    try:
        content = await file.read()
        result = parse_answer_key_pdf(content, prova_name=prova_name)
        logger.info(f"Parsed {len(result.get('answers', []))} answers from {file.filename} (prova_name={prova_name})")
        return result
    except Exception as e:
        logger.error(f"Error parsing answer key PDF {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao processar PDF do gabarito: {str(e)}")
