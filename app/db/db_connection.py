from dotenv import load_dotenv, find_dotenv
import os
import pprint
from pymongo import MongoClient
load_dotenv(find_dotenv())

user = os.getenv("MONGO_USER")
password = os.getenv("MONGO_PWD")

CONNECTION_STRING = f"mongodb+srv://{user}:{password}@cluster0.wvalpdx.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(CONNECTION_STRING)
