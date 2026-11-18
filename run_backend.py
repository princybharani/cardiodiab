"""
CardioDiab Production & Local Backend Runner
Runs FastAPI backend with proper Python paths, binding dynamically to $PORT on Render/Cloud or 8000 locally.
"""

import os
import sys

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    is_dev = os.environ.get("ENVIRONMENT", "development") == "development"
    
    print(f"[*] Starting CardioDiab FastAPI server on {host}:{port} (env: {os.environ.get('ENVIRONMENT', 'development')}) ...")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=is_dev,
        app_dir=backend_dir
    )
