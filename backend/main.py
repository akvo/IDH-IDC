import uvicorn
# import models

from db.connection import engine, Base
from core.config import app, generate_config_file

Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    generate_config_file()
    uvicorn.run(app, host="0.0.0.0", port=5000)
