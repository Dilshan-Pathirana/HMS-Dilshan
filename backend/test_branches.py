import requests
import json

def test_create_branch():
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Login to get token
    login_data = {
        "username": "admin@hms.com",
        "password": "password123"
    }
    response = requests.post(f"{base_url}/auth/login/access-token", data=login_data)
    token = response.json().get("access_token")
    
    if not token:
        print("Login failed, cannot test branch creation.")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Branch
    branch_data = {
        "center_name": "Colombo Central",
        "location": "Colombo 01",
        "contact_number": "0112345678",
        "is_active": True
    }
    
    # Assuming BranchCreate model has these fields. 
    # Let's check model definition if it fails.
    
    response = requests.post(f"{base_url}/branches/", headers=headers, json=branch_data)
    print(f"Create Branch Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_create_branch()
