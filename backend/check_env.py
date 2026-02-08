import sys
import os
try:
    import requests
    print("requests available")
except ImportError:
    print("requests NOT available")

try:
    import alembic
    print("alembic available")
except ImportError:
    print("alembic NOT available")

print(f"Executable: {sys.executable}")
print(f"Path: {sys.path}")
print(f"CWD: {os.getcwd()}")
