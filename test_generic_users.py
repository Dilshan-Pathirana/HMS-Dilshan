import requests
import json
import random
import string

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_EMAIL = "admin@hospital.com"
LOGIN_PASSWORD = "Test@123"

GENERIC_USER_TYPES = [
    "Cashier",
    "Branch Admin",
    "IT Assistant",
    "Receptionist",
    "Supplier",
    "Auditor"
]

def get_random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def login():
    print("Step 1: Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login/access-token",
        data={
            "username": LOGIN_EMAIL,
            "password": LOGIN_PASSWORD
        }
    )
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return None
    print("✅ Login successful!")
    return login_response.json()["access_token"]

def get_branch(token):
    print("\nStep 2: Fetching branches...")
    branches_response = requests.get(
        f"{BASE_URL}/branches",
        headers={"Authorization": f"Bearer {token}"}
    )
    if branches_response.status_code != 200:
        print(f"❌ Failed to fetch branches: {branches_response.status_code}")
        return None
    
    branches = branches_response.json()
    if not branches:
        print("❌ No branches found.")
        return None
    
    print(f"✅ Found branch: {branches[0]['center_name']} (ID: {branches[0]['id']})")
    return branches[0]['id']

def test_create_user(token, branch_id, user_type):
    print(f"\n--- Testing creation of {user_type} ---")
    
    email = f"test.{user_type.lower().replace(' ', '')}.{get_random_string()}@example.com"
    
    user_data = {
        "user_type": user_type,
        "first_name": f"Test",
        "last_name": user_type,
        "email": email,
        "password": "testpass123",
        "branch_id": branch_id,
        "contact_number_mobile": "0771234567",
        "home_address": "123 Test Street",
        "nic": f"{get_random_string(10)}V"
    }
    
    response = requests.post(
        f"{BASE_URL}/users/create-staff",
        data=user_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        print(f"✅ {user_type} created successfully!")
        return user_data
    else:
        print(f"❌ Failed to create {user_type}: {response.status_code}")
        print(response.text)
        return None

def test_duplicate_email(token, user_data):
    print(f"\n--- Testing duplicate email for {user_data['user_type']} ---")
    
    response = requests.post(
        f"{BASE_URL}/users/create-staff",
        data=user_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 400 and "already exists" in response.text:
        print(f"✅ Duplicate email correctly rejected for {user_data['user_type']}")
    else:
        print(f"❌ Failed to reject duplicate email for {user_data['user_type']}: {response.status_code}")
        print(response.text)

def main():
    token = login()
    if not token: exit(1)
    
    branch_id = get_branch(token)
    if not branch_id: exit(1)
    
    for user_type in GENERIC_USER_TYPES:
        user_data = test_create_user(token, branch_id, user_type)
        if user_data:
            test_duplicate_email(token, user_data)

if __name__ == "__main__":
    main()
