import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings

class VectorStoreManager:
    _instance = None
    _cache = {} # In-memory cache for business indices

    def __init__(self):
        # Use a shared embeddings instance to save memory
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        self.vector_dir = settings.VECTOR_STORE_DIR

    def add_documents(self, business_id: int, documents):
        business_path = os.path.join(self.vector_dir, str(business_id))
        os.makedirs(business_path, exist_ok=True)
        
        vector_store = FAISS.from_documents(documents, self.embeddings)
        vector_store.save_local(business_path)
        
        # Update cache immediately
        self._cache[business_id] = vector_store

    def search(self, business_id: int, query: str, k: int = 3):
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
