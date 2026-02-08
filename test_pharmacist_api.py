import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_EMAIL = "dilshan.pathirana.121@gmail.com"  # Replace with your admin email
LOGIN_PASSWORD = "your_password_here"  # Replace with your admin password

# Step 1: Login to get token
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
    exit(1)

token = login_response.json()["access_token"]
print("✅ Login successful!")

# Step 2: Get branches list
print("\nStep 2: Fetching branches...")
branches_response = requests.get(
    f"{BASE_URL}/branches",
    headers={"Authorization": f"Bearer {token}"}
)

if branches_response.status_code != 200:
    print(f"❌ Failed to fetch branches: {branches_response.status_code}")
    print(branches_response.text)
    exit(1)

branches = branches_response.json()
print(f"✅ Found {len(branches)} branches")
if branches:
    print(f"   Using branch: {branches[0]['center_name']} (ID: {branches[0]['id']})")
    branch_id = branches[0]['id']
else:
    print("❌ No branches found. Please create a branch first.")
    exit(1)

# Step 3: Create pharmacist
print("\nStep 3: Creating pharmacist...")

# Test data
pharmacist_data = {
    "first_name": "Test",
    "last_name": "Pharmacist",
    "email": "test.pharmacist@example.com",  # Make sure this email is unique
    "password": "testpass123",
    "branch_id": branch_id,
    "contact_number_mobile": "0771234567",
    "home_address": "123 Test Street, Test City"
}

create_response = requests.post(
    f"{BASE_URL}/pharmacist/create-pharmacist",
    data=pharmacist_data,
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\nResponse Status: {create_response.status_code}")
print(f"Response Body: {json.dumps(create_response.json(), indent=2)}")

if create_response.status_code == 200:
    print("\n✅ Pharmacist created successfully!")
else:
    print(f"\n❌ Failed to create pharmacist: {create_response.status_code}")
