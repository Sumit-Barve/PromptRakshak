import sys
import os
from pathlib import Path

# Add project root and backend directory to sys.path so modules resolve anywhere
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
backend_dir = root_dir / "backend"

for path in (root_dir, backend_dir):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# Ensure Vercel serverless environment writes SQLite DB to /tmp
if os.getenv("VERCEL") and not os.getenv("DATABASE_PATH"):
    os.environ["DATABASE_PATH"] = "/tmp/aegis.db"

try:
    from backend.app.main import app  # type: ignore[import]
except (ImportError, ModuleNotFoundError):
    from app.main import app  # type: ignore[import]
