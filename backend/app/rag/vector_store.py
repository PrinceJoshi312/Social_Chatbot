import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings

from app.db import models
import shutil

class VectorStoreManager:
    _instance = None
    _cache = {} # In-memory cache for business indices

    def __init__(self):
        # Use a shared embeddings instance to save memory
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        self.vector_dir = settings.VECTOR_STORE_DIR

    def add_documents(self, business_id: int, documents):
        """
        Appends documents to the existing business index.
        """
        if not documents:
            return

        business_path = os.path.join(self.vector_dir, str(business_id))
        os.makedirs(business_path, exist_ok=True)
        
        index_path = os.path.join(business_path, "index.faiss")
        if os.path.exists(index_path):
            try:
                vector_store = FAISS.load_local(business_path, self.embeddings, allow_dangerous_deserialization=True)
                vector_store.add_documents(documents)
            except:
                vector_store = FAISS.from_documents(documents, self.embeddings)
        else:
            vector_store = FAISS.from_documents(documents, self.embeddings)

        vector_store.save_local(business_path)
        self._cache[business_id] = vector_store

    def rebuild_index(self, business_id: int, db):
        """
        Safely rebuilds the entire index for a business from its SQL document records.
        This is the most production-safe way to ensure chunks are exactly in sync with DB.
        """
        from app.rag.processor import DocumentProcessor
        processor = DocumentProcessor()
        
        business_path = os.path.join(self.vector_dir, str(business_id))
        
        # 1. Fetch all documents for this business
        docs = db.query(models.Document).filter(models.Document.business_id == business_id).all()
        
        all_chunks = []
        for d in docs:
            if os.path.exists(d.file_path):
                try:
                    chunks = processor.process_file(d.file_path)
                    all_chunks.extend(chunks)
                except Exception as e:
                    print(f"Error processing {d.file_path} during rebuild: {e}")

        if not all_chunks:
            # If no chunks, remove the old index entirely
            if os.path.exists(business_path):
                shutil.rmtree(business_path)
            if business_id in self._cache:
                del self._cache[business_id]
            return

        # 2. Build new index
        vector_store = FAISS.from_documents(all_chunks, self.embeddings)
        
        # 3. Save and Cache
        os.makedirs(business_path, exist_ok=True)
        vector_store.save_local(business_path)
        self._cache[business_id] = vector_store
        print(f"[VECTOR STORE] Rebuilt index for Business {business_id} with {len(all_chunks)} chunks.")

    def search(self, business_id: int, query: str, k: int = 10):
        # 1. Check if index is already in RAM (SUPER FAST)
        if business_id in self._cache:
            return self._cache[business_id].similarity_search(query, k=k)

        # 2. If not in RAM, load from disk once
        business_path = os.path.join(self.vector_dir, str(business_id))
        index_path = os.path.join(business_path, "index.faiss")
        
        if not os.path.exists(index_path):
            return []
        
        try:
            vector_store = FAISS.load_local(business_path, self.embeddings, allow_dangerous_deserialization=True)
            self._cache[business_id] = vector_store # Store in RAM for next time
            return vector_store.similarity_search(query, k=k)
        except Exception as e:
            print(f"Error loading vector store: {e}")
            return []

    def clear_cache(self, business_id: int):
        if business_id in self._cache:
            del self._cache[business_id]
