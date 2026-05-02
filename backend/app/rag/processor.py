from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.core.config import settings
import os

class DocumentProcessor:
    def __init__(self, chunk_size=2000, chunk_overlap=300):
        self.strategy = settings.CHUNK_STRATEGY
        self.embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
        
        if self.strategy == "semantic":
            self.splitter = SemanticChunker(self.embeddings)
        else:
            self.splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
            )

    def process_file(self, file_path: str):
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == ".pdf":
            loader = PyPDFLoader(file_path)
        elif file_ext == ".txt":
            loader = TextLoader(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {file_ext}")

        documents = loader.load()
        # SemanticChunker also implements split_documents
        chunks = self.splitter.split_documents(documents)
        return chunks
