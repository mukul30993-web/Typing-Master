import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="b1VsgjSL81",
        database="typing_test"
    )