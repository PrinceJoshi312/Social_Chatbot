import firebase_admin
from firebase_admin import credentials
import os

# Get the base directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Use environment variable if set, otherwise look for serviceAccountKey.json in the same folder as this script
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")
if not cred_path:
    cred_path = os.path.join(BASE_DIR, "serviceAccountKey.json")

if not os.path.exists(cred_path):
    print(f"[FIREBASE] ERROR: Service account file not found at {cred_path}", flush=True)

print(f"[FIREBASE] Initializing Firebase Admin SDK using {cred_path}...", flush=True)
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("[FIREBASE] Firebase Admin SDK initialized successfully.", flush=True)
except Exception as e:
    print(f"[FIREBASE] FAILED to initialize: {e}", flush=True)
