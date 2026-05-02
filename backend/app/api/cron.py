from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db import session, models
from app.core.config import settings
from datetime import datetime
import logging

router = APIRouter(prefix="/api/cron", tags=["cron"])
logger = logging.getLogger("CronAPI")

def verify_cron_auth(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.split(" ")[1]
    if token != settings.CRON_SECRET:
        logger.warning("Unauthorized cron access attempt.")
        raise HTTPException(status_code=403, detail="Forbidden")

@router.post("")
async def trigger_cron_jobs(
    db: Session = Depends(session.get_db),
    _ = Depends(verify_cron_auth)
):
    """
    Triggers the creation of crawl jobs for all configured businesses.
    """
    businesses = db.query(models.Business).all()
    jobs_created = 0
    
    for biz in businesses:
        url = biz.config.get("crawl_url")
        # Hardcode WDMMA for Acme for demo purposes if not set
        if not url and biz.name == "Acme Corp":
            url = "https://www.wdmma.org/ranking.php"
        
        if url:
            # Check if there's already an active (pending or running) job for this business
            active_job = db.query(models.CrawlJob).filter(
                models.CrawlJob.business_id == biz.id,
                models.CrawlJob.status.in_(["pending", "running"])
            ).first()
            
            if not active_job:
                new_job = models.CrawlJob(
                    business_id=biz.id,
                    status="pending",
                    max_attempts=3
                )
                db.add(new_job)
                jobs_created += 1
    
    db.commit()
    logger.info(f"Cron trigger: Created {jobs_created} crawl jobs.")
    return {"status": "queued", "jobs_created": jobs_created}

@router.get("/jobs")
async def list_cron_jobs(
    limit: int = 50,
    db: Session = Depends(session.get_db),
    _ = Depends(verify_cron_auth)
):
    return db.query(models.CrawlJob).order_by(models.CrawlJob.created_at.desc()).limit(limit).all()

@router.get("/jobs/{job_id}")
async def get_cron_job(
    job_id: int,
    db: Session = Depends(session.get_db),
    _ = Depends(verify_cron_auth)
):
    job = db.query(models.CrawlJob).filter(models.CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/jobs/{job_id}/retry")
async def retry_cron_job(
    job_id: int,
    db: Session = Depends(session.get_db),
    _ = Depends(verify_cron_auth)
):
    job = db.query(models.CrawlJob).filter(models.CrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.status = "pending"
    job.attempts = 0
    job.error_message = None
    job.started_at = None
    job.finished_at = None
    db.commit()
    
    return {"status": "retrying", "job_id": job_id}
