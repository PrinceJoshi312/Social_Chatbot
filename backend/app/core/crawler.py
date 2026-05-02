import os
import httpx
import re
import logging
import asyncio
import hashlib
from typing import Tuple, List, Optional
from bs4 import BeautifulSoup
from fpdf import FPDF
from sqlalchemy.orm import Session
from app.db import models
from app.rag.processor import DocumentProcessor
from app.rag.vector_store import VectorStoreManager
from app.core.config import settings
from datetime import datetime

logger = logging.getLogger("CrawlerService")

doc_processor = DocumentProcessor()
vector_manager = VectorStoreManager()

def generate_content_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

async def crawl_and_index(url: str, business_id: int, uploader_id: int, db: Session, max_retries: int = 3) -> Tuple[str, str]:
    """
    Crawls a URL, detects changes, generates PDF/TXT, and indexes for RAG.
    Returns: (status, message) where status is 'success', 'skipped', or 'failed'
    """
    biz = db.query(models.Business).filter(models.Business.id == business_id).first()
    if not biz:
        return "failed", "Business not found"

    headers = {"User-Agent": settings.CRAWLER_USER_AGENT}
    
    attempt = 0
    while attempt < max_retries:
        attempt += 1
        try:
            logger.info(f"Attempt {attempt}: Crawling {url} for Business {biz.name} (ID: {business_id})")
            async with httpx.AsyncClient(follow_redirects=True, verify=False, timeout=settings.CRAWLER_TIMEOUT_SECONDS) as client:
                response = await client.get(url)
                
                if response.status_code != 200:
                    logger.warning(f"Failed status {response.status_code} for {url}")
                    if attempt == max_retries:
                        biz.last_crawl_status = "failed"
                        biz.crawl_failure_count += 1
                        db.commit()
                        return "failed", f"Unreachable ({response.status_code})"
                    await asyncio.sleep(2 ** attempt)
                    continue

                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Cleanup
                for noise in soup.find_all(class_=re.compile("sidebar|widget|menu|nav|footer|header|social|ads", re.I)):
                    noise.decompose()
                for element in soup(["script", "style", "nav", "footer", "header", "button", "input", "iframe"]):
                    element.decompose()
                for br in soup.find_all("br"):
                    br.replace_with("\n")
                
                raw_text = soup.get_text(separator='\n')
                lines = [l.strip() for l in raw_text.splitlines() if l.strip() and len(l.strip()) < 1000]
                
                if not lines:
                    return "failed", "Empty content extracted"

                full_text = "\n".join(lines)
                new_hash = generate_content_hash(full_text)

                # Change Detection
                if biz.content_hash == new_hash:
                    logger.info(f"No changes detected for {url}. Skipping re-index.")
                    biz.last_crawled_at = datetime.utcnow()
                    biz.last_crawl_status = "skipped"
                    db.commit()
                    return "skipped", "Content unchanged"

                # Content Changed - Process Files
                upload_dir = os.path.join(settings.UPLOAD_DIR, str(business_id))
                os.makedirs(upload_dir, exist_ok=True)
                
                # PDF
                pdf_path = os.path.join(upload_dir, f"crawled_data_{business_id}.pdf")
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Courier", size=10)
                SAFE_WIDTH = 190
                pdf.set_font("Courier", style="B", size=12)
                pdf.multi_cell(SAFE_WIDTH, 10, f"DATA SOURCE: {url}")
                pdf.ln(5)
                pdf.set_font("Courier", size=9)
                for line in lines:
                    safe_line = "".join([c if ord(c) < 128 else " " for c in line])
                    if safe_line.strip():
                        try: pdf.multi_cell(SAFE_WIDTH, 5, safe_line)
                        except: continue
                pdf.output(pdf_path)

                # TXT
                txt_path = os.path.join(upload_dir, f"crawled_data_{business_id}.txt")
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(f"DATA SOURCE: {url}\n\n")
                    f.write(full_text)

                # Sync Documents in DB
                final_uploader_id = uploader_id or biz.owner_id
                for fmt in ["pdf", "txt"]:
                    fname = f"crawled_data_{business_id}.{fmt}"
                    fpath = pdf_path if fmt == "pdf" else txt_path
                    existing = db.query(models.Document).filter(
                        models.Document.business_id == business_id,
                        models.Document.filename == fname
                    ).first()
                    if not existing:
                        db.add(models.Document(
                            filename=fname, file_path=fpath,
                            business_id=business_id, uploader_id=final_uploader_id
                        ))
                
                db.commit() # MUST commit so rebuild_index sees the new docs in DB

                # Indexing
                # We rebuild the entire business index to ensure that ANY changes (manual uploads or crawls)
                # are perfectly synchronized and no orphaned chunks remain.
                vector_manager.rebuild_index(business_id, db)
                
                # Metadata Update
                biz.last_content_hash = biz.content_hash
                biz.content_hash = new_hash
                biz.last_crawled_at = datetime.utcnow()
                biz.last_crawl_status = "success"
                biz.crawl_failure_count = 0
                
                db.commit()
                logger.info(f"Successfully updated and indexed {url}")
                return "success", "Successfully updated"

        except Exception as e:
            logger.error(f"Error on attempt {attempt}: {str(e)}")
            if attempt == max_retries:
                biz.last_crawl_status = "failed"
                biz.crawl_failure_count += 1
                db.commit()
                return "failed", str(e)
            await asyncio.sleep(2 ** attempt)

    return "failed", "Unknown error"
