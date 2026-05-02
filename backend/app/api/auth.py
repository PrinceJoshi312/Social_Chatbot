from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.db import session, models
from app.schemas import models as schemas
from datetime import datetime
from firebase_admin import auth
import os
import logging

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger("Auth")

import jwt # Use PyJWT or similar if available, or just fallback to simple logic

def verify_token(credentials = Depends(security)):
    token = credentials.credentials
    
    # 1. Standard Mock Tokens (for simple CLI/API tests)
    if token == "mock-token-admin":
        return {"uid": "mock-admin", "email": "princejoshij736@gmail.com", "name": "Mock Admin"}
    if token == "mock-token-user" or token == "mock-token":
        return {"uid": "mock-user", "email": "hello@gmail.com", "name": "Mock User"}

    try:
        # 2. Real Firebase Verification
        # If ALLOW_MOCK_AUTH is set, we can skip full verification for faster local testing 
        # OR if we don't have a valid service account yet.
        if os.getenv("ALLOW_MOCK_AUTH") == "true":
             # Try unverified decode first
             try:
                import base64
                import json
                parts = token.split('.')
                if len(parts) > 1:
                    payload = json.loads(base64.b64decode(parts[1] + "==").decode('utf-8'))
                    return {
                        "uid": payload.get("user_id") or payload.get("sub") or "mock-uid",
                        "email": payload.get("email") or "mock@example.com",
                        "name": payload.get("name") or "Mock User",
                        "firebase": payload.get("firebase", {})
                    }
             except Exception:
                 pass
             return {"uid": "mock-uid", "email": "hello@gmail.com", "name": "Developer User"}

        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_current_user(db: Session = Depends(session.get_db), decoded_token: dict = Depends(verify_token)):
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    
    if not firebase_uid or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    # Check if user exists in local DB
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()
    
    if not user:
        # Check by email
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Link existing user to Firebase UID
            user.firebase_uid = firebase_uid
        else:
            # Create new user
            user = models.User(
                email=email,
                firebase_uid=firebase_uid,
                display_name=decoded_token.get("name"),
                photo_url=decoded_token.get("picture"),
                provider=decoded_token.get("firebase", {}).get("sign_in_provider", "password"),
                role="super_admin" if email == 'princejoshij736@gmail.com' else "business_owner"
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
