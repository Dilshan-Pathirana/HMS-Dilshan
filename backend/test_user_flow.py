import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_user_flow():
    # 1. Login as SuperAdmin
    print("1. Logging in as Admin...")
    login_data = {"username": "admin@hms.com", "password": "password123"}
    resp = requests.post(f"{BASE_URL}/auth/login/access-token", data=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Create a new User (Doctor)
    print("2. Creating new Doctor User...")
    user_data = {
        "email": "doctor@hms.com",
        "username": "dr_smith",
        "password": "securepassword",
        "role_as": 2, # Doctor
        "is_active": True
    }
    resp = requests.post(f"{BASE_URL}/users/", headers=headers, json=user_data)
    if resp.status_code == 200:
        user_id = resp.json()["id"]
        print(f"User created: {user_id}")
    elif resp.status_code == 400 and "already exists" in resp.text:
         # Need to fetch existing user if it exists to continue test
         print("User already exists, fetching list to find ID...")
         resp = requests.get(f"{BASE_URL}/users/", headers=headers)
         users = resp.json()
         found = next((u for u in users if u["email"] == "doctor@hms.com"), None)
         if found:
             user_id = found["id"]
             print(f"Found existing user: {user_id}")
         else:
             print("Could not find existing user.")
             return
    else:
        print(f"User creation failed: {resp.text}")
        return

    # 3. Create Doctor Profile
    print("3. Creating Doctor Profile...")
    doctor_data = {
        "user_id": user_id,
        "specialization": "Cardiology",
        "qualification": "MBBS, MD",
        "contact_number": "0771234567",
        "experience_years": 10
    }
    resp = requests.post(f"{BASE_URL}/doctors/", headers=headers, json=doctor_data)
    if resp.status_code == 200:
        print("Doctor profile created successfully.")
        print(resp.json())
    elif resp.status_code == 400 and "already exists" in resp.text:
        print("Doctor profile already exists.")
    else:
        print(f"Doctor creation failed: {resp.text}")

if __name__ == "__main__":
    test_user_flow()
