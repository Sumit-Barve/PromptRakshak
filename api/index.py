import sys
import os
from pathlib import Path

# Add backend directory to sys.path so app modules are resolvable
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Ensure Vercel serverless environment writes SQLite DB to /tmp
if os.getenv("VERCEL") and not os.getenv("DATABASE_PATH"):
    os.environ["DATABASE_PATH"] = "/tmp/aegis.db"

from app.main import app
