import requests

def test_login():
    url = "http://localhost:8000/api/v1/auth/login/access-token"
    # Note: OAuth2PasswordRequestForm expects form data, not JSON
    data = {
        "username": "admin@hms.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("Login Successful!")
            return response.json().get("access_token")
        else:
            print("Login Failed.")
            return None
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
