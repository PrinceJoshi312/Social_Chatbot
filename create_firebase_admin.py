import firebase_admin
from firebase_admin import auth, credentials
import os

def create_super_admin():
    # Initialize Firebase Admin
    cred_path = "backend/serviceAccountKey.json"
    if not os.path.exists(cred_path):
        print(f"Error: {cred_path} not found.")
        return

    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    email = "princejoshij736@gmail.com"
    password = "048Nc3"

    try:
        # Check if user already exists
        user = auth.get_user_by_email(email)
        print(f"User {email} already exists. Updating password...")
        auth.update_user(user.uid, password=password)
        print("Password updated successfully.")
    except auth.UserNotFoundError:
        print(f"User {email} not found. Creating new user...")
        user = auth.create_user(
            email=email,
            password=password,
            display_name="Super Admin"
        )
        print(f"Successfully created new user: {user.uid}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    create_super_admin()
