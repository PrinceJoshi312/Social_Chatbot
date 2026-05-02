import os
import sys
import time
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

# Ensure backend directory is in sys.path
# This script is in backend/app/workers/crawl_worker.py
# We want to add 'backend/' to the path.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.db import models, session
from app.core.config import settings
from app.core.crawler import crawl_and_index

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("CrawlWorker")

# Semaphore for concurrency control
semaphore = asyncio.Semaphore(settings.CRAWLER_CONCURRENCY)

async def process_job(job_id: int):
    """
    Processes a single crawl job with concurrency control.
    """
    async with semaphore:
        db = session.SessionLocal()
        try:
            job = db.query(models.CrawlJob).filter(models.CrawlJob.id == job_id).first()
            if not job or job.status != "running":
                return

            biz = db.query(models.Business).filter(models.Business.id == job.business_id).first()
            url = biz.config.get("crawl_url")
            if not url and biz.name == "Acme Corp":
                url = "https://www.wdmma.org/ranking.php"

            if not url:
                job.status = "skipped"
                job.error_message = "No crawl URL configured"
                job.finished_at = datetime.utcnow()
                db.commit()
                return

            # Execute crawl
            status, message = await crawl_and_index(url, biz.id, biz.owner_id, db)
            
            job.status = status
            job.error_message = message if status == "failed" else None
            job.finished_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Job {job_id} finished with status: {status}")

        except Exception as e:
            logger.error(f"Unexpected error in job {job_id}: {str(e)}")
            job.status = "failed"
            job.error_message = str(e)
            job.finished_at = datetime.utcnow()
            db.commit()
        finally:
            db.close()

async def worker_loop():
    """
    Main loop that polls for pending jobs.
    """
    logger.info(f"Crawl Worker started. Concurrency: {settings.CRAWLER_CONCURRENCY}")
    
    while True:
        db = session.SessionLocal()
        try:
            # 1. Handle stale "running" jobs (timed out or crashed)
            stale_threshold = datetime.utcnow() - timedelta(minutes=10)
            stale_jobs = db.query(models.CrawlJob).filter(
                models.CrawlJob.status == "running",
                models.CrawlJob.started_at < stale_threshold
            ).all()
            for s_job in stale_jobs:
                logger.warning(f"Marking stale job {s_job.id} as failed.")
                s_job.status = "failed"
                s_job.error_message = "Job timed out or worker crashed"
                s_job.finished_at = datetime.utcnow()
            if stale_jobs:
                db.commit()

            # 2. Fetch and Claim pending jobs atomically
            # Using with_for_update(skip_locked=True) is the production standard for 
            # safe job queuing in relational databases (Postgres).
            pending_jobs = db.query(models.CrawlJob).filter(
                or_(
                    models.CrawlJob.status == "pending",
                    models.CrawlJob.status == "failed"
                ),
                models.CrawlJob.attempts < models.CrawlJob.max_attempts
            ).order_by(models.CrawlJob.created_at.asc()).with_for_update(skip_locked=True).limit(settings.CRAWLER_CONCURRENCY).all()

            if not pending_jobs:
                db.close()
                await asyncio.sleep(settings.CRAWLER_POLL_INTERVAL_SECONDS)
                continue

            # 3. Mark jobs as running and start them
            tasks = []
            for job in pending_jobs:
                job.status = "running"
                job.attempts += 1
                job.started_at = datetime.utcnow()
                job_id = job.id
                db.commit() # Release lock on this row so it stays 'running'
                
                tasks.append(asyncio.create_task(process_job(job_id)))

            db.close()
            # Wait for this batch to process or just let them run? 
            # With Semaphore, we can just launch them and continue.
            # But we don't want to over-poll. Let's wait for the batch.
            if tasks:
                await asyncio.gather(*tasks)

        except Exception as e:
            logger.error(f"Worker loop error: {str(e)}")
            if db: db.close()
            await asyncio.sleep(settings.CRAWLER_POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker stopped by user.")
