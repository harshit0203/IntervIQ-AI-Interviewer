import motor.motor_asyncio
from dotenv import load_dotenv
import os
load_dotenv()

client = None
db = None

async def connect_to_mongo():
    global client, db
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client[os.getenv("DATABASE_NAME")]

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")

def get_database():
    """
    Return the active database instance.
    """
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db

def users_collection():
    """
    Shortcut to the users collection.
    """
    return get_database().get_collection("users")
