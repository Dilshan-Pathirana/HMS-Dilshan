import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login/access-token"
DOCTORS_URL = f"{BASE_URL}/doctors"

ADMIN_EMAIL = "admin@hospital.com"
ADMIN_PASSWORD = "Test@123"

def login():
    print(f"Logging in as {ADMIN_EMAIL}...")
    try:
        response = requests.post(LOGIN_URL, data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if response.status_code == 200:
            token = response.json().get("access_token")
            print("Login successful.")
            return token
        else:
            print(f"Login failed: {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Login error: {e}")
        sys.exit(1)

def get_first_doctor(headers):
    print("Fetching doctors...")
    try:
        response = requests.get(DOCTORS_URL, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # The API might return a list or a paginated object.
            # Let's inspect.
            if isinstance(data, list):
                if not data:
                    print("No doctors found.")
                    sys.exit(1)
                return data[0]
            elif isinstance(data, dict) and "data" in data:
                 # Standardized response?
                 if not data["data"]:
                     print("No doctors found.")
                     sys.exit(1)
                 return data["data"][0]
            else:
                print(f"Unexpected doctors response format: {str(data)[:100]}")
                # If it's a dict but not standardized, maybe it keys by id?
                # For now fail.
                sys.exit(1)
        else:
            print(f"Failed to fetch doctors: {response.status_code} {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Error fetching doctors: {e}")
        sys.exit(1)

def check_cancel_requests(headers, doctor_id):
    url = f"{BASE_URL}/schedules/cancel/requests?doctor_id={doctor_id}"
    print(f"Calling {url}...")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print("Raw Response Headers:", response.headers)
        print("Raw Response Body:")
        print(response.text)
        
        try:
            json_body = response.json()
            print("\nParsed JSON Type:", type(json_body))
        except:
            print("\nResponse is not valid JSON.")

    except Exception as e:
        print(f"Error calling endpoint: {e}")

def main():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    doctor = get_first_doctor(headers)
    print(f"Found doctor: {doctor.get('first_name')} (ID: {doctor.get('id')})")
    
    check_cancel_requests(headers, doctor.get('id'))

if __name__ == "__main__":
    main()
