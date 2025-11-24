import sys
if sys.platform.startswith("win"):
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
import time
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv # type: ignore
import google.generativeai as genai # type: ignore
import numpy as np # type: ignore

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stores = {}


def chunk_text(text, max_chunks=3):
    """Split text into a maximum of max_chunks large chunks to reduce API calls."""
    words = text.split()
    if len(words) == 0:
        return []
    chunk_size = max(len(words) // max_chunks, 100)
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i+chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    return chunks[:max_chunks]  # Limit to max_chunks


def get_gemini_embedding(text):
    """Get embedding from Gemini API with error handling."""
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return np.array(result['embedding'])
    except Exception as e:
        raise Exception(f"Embedding API failed: {e}")


def cosine_sim(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def call_gemini_llm(prompt: str) -> str:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-pro")
    try:
        res = model.generate_content(prompt)
        return res.text if hasattr(res, "text") else "No answer."
    except Exception as e:
        return f"LLM error: {e}"


@app.get("/")
def root():
    return {"message": "Gemini File Search API is running."}


@app.post("/api/create-store")
def create_store():
    store_id = f"store_{len(stores) + 1}"
    stores[store_id] = []
    return {"success": True, "store_id": store_id}


@app.post("/api/upload")
async def upload(files: list[UploadFile] = File(...), store_id: str = Form(...)):
    if store_id not in stores:
        stores[store_id] = []
    uploaded = []
    errors = []
    
    for file in files:
        text = (await file.read()).decode("utf-8", "ignore")
        # Create max 3 large chunks per file to minimize API calls
        chunks = chunk_text(text, max_chunks=3)
        filenames = set()
        
        for idx, chunk in enumerate(chunks):
            try:
                emb = get_gemini_embedding(chunk)
                stores[store_id].append({
                    "filename": file.filename,
                    "chunk": chunk,
                    "embedding": emb.tolist(),
                })
                filenames.add(file.filename)
                print(f"Successfully embedded chunk {idx+1}/{len(chunks)} from {file.filename}")
                time.sleep(3)  # Wait 3 seconds between calls
            except Exception as e:
                error_msg = str(e)
                print(f"Embedding failed for chunk {idx+1}: {error_msg}")
                errors.append(f"{file.filename} chunk {idx+1}: {error_msg[:100]}")
                
        if filenames:
            uploaded.extend(filenames)
    
    if errors:
        return {"success": False, "error": "Some embeddings failed", "details": errors, "files": list(uploaded)}
    
    return {"success": True, "files": list(uploaded), "store_id": store_id}


@app.post("/api/query")
def query(query: str = Form(...), store_id: str = Form(...)):
    if store_id not in stores or not stores[store_id]:
        return {"llm_answer": "No data uploaded for this store.", "supporting_chunks": []}
    
    try:
        query_emb = get_gemini_embedding(query)
    except Exception as e:
        return {"llm_answer": f"Embedding error: {e}", "supporting_chunks": []}

    entries = stores[store_id]
    top_n = 2
    scored = [
        (cosine_sim(query_emb, entry["embedding"]), entry)
        for entry in entries
    ]
    top_chunks = sorted(scored, reverse=True)[:top_n]
    context = "\n\n".join(entry["chunk"] for _, entry in top_chunks)
    
    prompt = f"""Context from uploaded files:
{context}

User Question: {query}
Answer based only on the context above."""
    
    llm_answer = call_gemini_llm(prompt)
    
    return {
        "llm_answer": llm_answer,
        "supporting_chunks": [entry["chunk"][:200] + "..." for _, entry in top_chunks]  # Show preview
    }
