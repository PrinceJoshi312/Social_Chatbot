import sys
import os
# Add the app directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.rag.processor import DocumentProcessor
from app.rag.vector_store import VectorStoreManager
import shutil

def test_rag_pipeline():
    # Setup
    test_dir = "storage/test_vectors"
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    
    os.makedirs("storage/test_uploads", exist_ok=True)
    test_file = "storage/test_uploads/test.txt"
    with open(test_file, "w") as f:
        f.write("The capital of France is Paris. It is known for the Eiffel Tower.")

    processor = DocumentProcessor(chunk_size=100, chunk_overlap=20)
    print(f"Using strategy: {processor.strategy}")
    vector_manager = VectorStoreManager()
    vector_manager.base_path = test_dir

    # 1. Process
    chunks = processor.process_file(test_file)
    assert len(chunks) > 0

    # 2. Embed & Store
    business_id = 999
    vector_manager.add_documents(business_id, chunks)
    
    # 3. Search
    results = vector_manager.search(business_id, "What is the capital of France?")
    assert len(results) > 0
    assert "Paris" in results[0].page_content

    print("RAG Pipeline Test Passed!")

if __name__ == "__main__":
    test_rag_pipeline()
