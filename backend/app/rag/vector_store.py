import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings

class VectorStoreManager:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        self.base_path = settings.VECTOR_STORE_DIR

    def _get_business_path(self, business_id: int):
        path = os.path.join(self.base_path, str(business_id))
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
        return path

    def add_documents(self, business_id: int, documents):
        business_path = self._get_business_path(business_id)
        index_path = os.path.join(business_path, "index.faiss")
        
        if os.path.exists(index_path):
            vector_store = FAISS.load_local(business_path, self.embeddings, allow_dangerous_deserialization=True)
            vector_store.add_documents(documents)
        else:
            vector_store = FAISS.from_documents(documents, self.embeddings)
        
        vector_store.save_local(business_path)
        return vector_store

    def search(self, business_id: int, query: str, k: int = 4):
        business_path = self._get_business_path(business_id)
        index_path = os.path.join(business_path, "index.faiss")
        
        if not os.path.exists(index_path):
            return []
        
        vector_store = FAISS.load_local(business_path, self.embeddings, allow_dangerous_deserialization=True)
        results = vector_store.similarity_search(query, k=k)
        return results
