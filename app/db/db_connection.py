from dotenv import load_dotenv, find_dotenv
import os
from pymongo import MongoClient

load_dotenv(find_dotenv())

def get_database():
    user = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PWD")

    if not(user and password):
        return RuntimeError("MongoDB Connection not established")

    CONNECTION_STRING = f"mongodb+srv://{user}:{password}@cluster0.wvalpdx.mongodb.net/?retryWrites=true&w=majority"
    client = MongoClient(CONNECTION_STRING)

    return client["FinanceTracker"]
