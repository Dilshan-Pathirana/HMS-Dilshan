import json
import urllib.request
import urllib.parse
from urllib.error import HTTPError

API_URL = "http://127.0.0.1:8000/api/v1"

def main():
    # 1. Login
    login_data = urllib.parse.urlencode({
        "username": "admin@hms.com",
        "password": "password123",
    }).encode()
    
    req = urllib.request.Request(f"{API_URL}/auth/login/access-token", data=login_data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode()
            token = json.loads(res_body)["access_token"]
            print("Login successful.")
    except HTTPError as e:
        print(f"Login failed: {e.read().decode()}")
        return

    # 2. Get Dashboard Stats
    req = urllib.request.Request(f"{API_URL}/receptionist/dashboard-stats")
    req.add_header("Authorization", f"Bearer {token}")
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode()
            print(f"Dashboard Stats: {res_body}")
    except HTTPError as e:
        print(f"Dashboard Stats Failed: {e.read().decode()}")

if __name__ == "__main__":
    main()
