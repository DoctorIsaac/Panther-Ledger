from dotenv import load_dotenv, find_dotenv
import os
import certifi
from pymongo import MongoClient

load_dotenv(find_dotenv())

def get_database():
    uri = os.getenv("MONGO_URI")

    if not uri:
        raise RuntimeError("MONGO_URI is not set in app/db/.env")

    client = MongoClient(uri, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)

    return client["FinanceTracker"]
