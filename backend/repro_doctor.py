import requests
import json

url = "http://localhost:8000/api/v1/doctors/v2-doctors/"

# Use a random email to avoid collision on repeated runs
import random
import string
random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
email = f"doctor_{random_suffix}@example.com"

payload = {
    "first_name": "Test",
    "last_name": "Doctor",
    "email": email,
    "password": "password123",
    "specialization": "Cardiology",
    "qualification": "MD",
    "contact_number": "1234567890",
    "experience_years": 5,
    "branch_id": None
}

headers = {
    "Content-Type": "application/json",
    # Add Authorization header if needed, but I assume I can test without it 
    # OR better, I need to login first to get a token because the endpoint is protected!
    # "Authorization": "Bearer <TOKEN>" 
}


# Login to get token
login_url = "http://localhost:8000/api/v1/auth/login/access-token"
login_data = {"username": "admin@hospital.com", "password": "Test@123"}
print("Logging in...")
try:
    login_response = requests.post(login_url, data=login_data)
    if login_response.status_code == 200:
        token = login_response.json().get("access_token")
        headers["Authorization"] = f"Bearer {token}"
        print("Login successful. Token acquired.")
    else:
        print(f"Login failed: {login_response.text}")
        exit(1)
except Exception as e:
    print(f"Login error: {e}")
    exit(1)

print(f"Sending payload to {url}: {json.dumps(payload, indent=2)}")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 422:
        with open("error_detail.json", "w") as f:
            json.dump(response.json(), f, indent=2)
        print("Logged error detail to error_detail.json")
    else:
        print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")

