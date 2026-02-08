import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"
# Adjust credentials if needed
ADMIN_EMAIL = "admin@hospital.com" 
ADMIN_PASSWORD = "Test@123"

def login():
    print(f"Logging in as {ADMIN_EMAIL}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login/access-token", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            sys.exit(1)
        return resp.json()["access_token"]
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

import time

def verify_flow():
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    timestamp = int(time.time())
    
    print("\n--- Testing Branch Refactor ---")
    
    # 1. Create Branch
    print("Creating Branch...")
    branch_data = {
        "center_name": f"Refactor Test Branch {timestamp}",
        "register_number": f"RTB{timestamp}",
        "center_type": "Main",
        "division": "West",
        "division_number": f"D{timestamp}"
    }
    # Using multipart/form-data as expected by create_branch
    resp = requests.post(f"{BASE_URL}/branches/", headers=headers, data=branch_data)
    if resp.status_code != 200:
        print(f"Failed to create branch: {resp.text}")
        return
    branch_id = resp.json()["id"]
    print(f"Branch created: {branch_id}")

    # 2. Create Branch Admin
    print("Creating Branch Admin...")
    admin_data = {
        "user_type": "Branch Admin",
        "first_name": "Admin",
        "last_name": "Refactor",
        "email": f"admin.refactor.{timestamp}@hms.com",
        "password": "password123",
        "branch_id": branch_id # Allowed for creation
    }
    # FIXED: Route is /users/create-staff, not /staff/create-staff
    resp = requests.post(f"{BASE_URL}/users/create-staff", headers=headers, data=admin_data)
    if resp.status_code != 200 and "already exists" not in resp.text:
        print(f"Failed to create Branch Admin: {resp.text}")
    elif resp.status_code == 200:
        user_id = resp.json()["user_id"]
        print(f"Branch Admin created: {user_id}")
        
        # 3. Assign Admin to Branch (New endpoint)
        print("Assigning Admin to Branch...")
        assign_data = {
            "admin_id": user_id
        }
        resp = requests.put(f"{BASE_URL}/branches/{branch_id}/assign-admin", headers=headers, data=assign_data)
        if resp.status_code != 200:
            print(f"Failed to assign admin: {resp.text}")
        else:
            print("Branch Admin assigned successfully.")
            
    print("\n--- Testing Pharmacy Refactor ---")
    
    # 4. Create Pharmacy (No Branch)
    print("Creating Pharmacy...")
    pharm_data = {
        "name": f"Refactor Pharmacy {timestamp}",
        "pharmacy_code": f"PH{timestamp}",
        "license_number": f"LIC{timestamp}",
        "location": "Colombo",
        "status": "active"
        # No branch_id
    }
    resp = requests.post(f"{BASE_URL}/pharmacies/", headers=headers, json=pharm_data)
    if resp.status_code != 200:
        print(f"Failed to create Pharmacy: {resp.text}")
    else:
        pharmacy_id = resp.json()["data"]["id"]
        print(f"Pharmacy created: {pharmacy_id}")

        # 5. Create Pharmacist (No Branch)
        print("Creating Pharmacist...")
        pharmacist_data = {
            "first_name": "Pharm",
            "last_name": "Refactor",
            "email": f"pharm.refactor.{timestamp}@hms.com",
            "password": "password123",
            # No branch_id
        }
        # FIXED: Route is /pharmacist/create-pharmacist (singular)
        resp = requests.post(f"{BASE_URL}/pharmacist/create-pharmacist", headers=headers, data=pharmacist_data)
        if resp.status_code != 200 and "already exists" not in resp.text:
            print(f"Failed to create Pharmacist: {resp.text}")
        else:
            if resp.status_code == 200:
                phys_user_id = resp.json()["user_id"]
                pharmacist_id = resp.json()["pharmacist_id"] # API returns this
            else:
                # Handle existing user if testing multiple times
                pass 
                
            print(f"Pharmacist created/exists")
            
            # Since create_pharmacist might not return user_id if we rely on "exists" error handling in script (not perfect)
            # But here let's assume success
            if resp.status_code == 200:
                 # 6. Assign Pharmacist to Pharmacy (Update Pharmacy)
                print("Assigning Pharmacist...")
                update_data = {
                    "pharmacist_id": phys_user_id
                }
                resp = requests.put(f"{BASE_URL}/pharmacies/{pharmacy_id}", headers=headers, json=update_data)
                if resp.status_code != 200:
                     print(f"Failed to assign pharmacist: {resp.text}")
                else:
                     print("Pharmacist assigned successfully.")

    # 7. Link Pharmacy to Branch (New functionality)
    if 'pharmacy_id' in locals() and 'branch_id' in locals():
        print("Linking Pharmacy to Branch...")
        resp = requests.put(f"{BASE_URL}/branches/{branch_id}/pharmacies/{pharmacy_id}", headers=headers)
        if resp.status_code != 200:
            print(f"Failed to link pharmacy to branch: {resp.text}")
        else:
            print("Pharmacy linked to Branch successfully.")
            
            # Verify details
            print("Verifying Branch Details...")
            resp = requests.get(f"{BASE_URL}/branches/{branch_id}/details", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                pharmacies = data.get("pharmacies", [])
                linked = any(p["id"] == pharmacy_id for p in pharmacies)
                if linked:
                    print("SUCCESS: Pharmacy found in branch details.")
                else:
                    print("FAILURE: Pharmacy NOT found in branch details.")
            else:
                 print(f"Failed to get branch details: {resp.text}")

    # 8. Assign Staff to Branch (Re-assignment Test)
    print("\n--- Testing Staff Assignment Refactor ---")
    
    # 8a. Create a second branch to move staff TO
    print("Creating Target Branch (B2)...")
    branch2_data = {
        "center_name": f"Target Branch {timestamp}",
        "register_number": f"TB{timestamp}",
        "center_type": "Sub",
        "division": "East",
        "division_number": f"D2{timestamp}"
    }
    resp = requests.post(f"{BASE_URL}/branches/", headers=headers, data=branch2_data)
    if resp.status_code != 200:
        print(f"Failed to create Target Branch: {resp.text}")
        branch2_id = None
    else:
        branch2_id = resp.json()["id"]
        print(f"Target Branch created: {branch2_id}")

    if branch2_id:
        print("Creating Staff User linked to Branch 1...")
        staff_data = {
            "user_type": "Receptionist",
            "first_name": "Staff",
            "last_name": "Mover",
            "email": f"staff.mover.{timestamp}@hms.com",
            "password": "password123",
            "branch_id": branch_id # Linked to First Branch
        }
        resp = requests.post(f"{BASE_URL}/users/create-staff", headers=headers, data=staff_data)
        if resp.status_code != 200:
            print(f"Failed to create Staff: {resp.text}")
        else:
            staff_id = resp.json()["user_id"]
            print(f"Staff created at Branch 1: {staff_id}")
            
            print(f"Assigning Staff to Branch 2 ({branch2_id})...")
            assign_data = {
                "user_id": staff_id,
                "role": "Receptionist"
            }
            resp = requests.post(f"{BASE_URL}/branches/{branch2_id}/assign-staff", headers=headers, json=assign_data)
            if resp.status_code != 200:
                print(f"Failed to assign staff to Branch 2: {resp.text}")
            else:
                print("Staff assigned to Branch 2 successfully.")
                
                # Verify
                print("Verifying Branch 2 Staff List...")
                resp = requests.get(f"{BASE_URL}/branches/{branch2_id}/staff", headers=headers)
                if resp.status_code == 200:
                    staff_list = resp.json() 
                    if isinstance(staff_list, list):
                        assigned = any(s["id"] == staff_id for s in staff_list)
                        if assigned:
                             print("SUCCESS: Staff found in Branch 2 staff list.")
                        else:
                             print("FAILURE: Staff NOT found in Branch 2 list.")
                    else:
                        print(f"Unexpected response format: {staff_list}")
                else:
                     print(f"Failed to get staff list: {resp.text}")

if __name__ == "__main__":
    verify_flow()
