from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

app = Flask(__name__)


# DATABASE CONNECTION
def get_db_connection():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="MYSql PASSWORD",
            database="typing_test"
        )
    except mysql.connector.Error as err:
        print("Database Error:", err)
        return None


# HOME PAGE
@app.route("/")
def home():

    conn = get_db_connection()

    if conn is None:
        return "Database Connection Failed"

    cursor = conn.cursor()

    cursor.execute("""
        SELECT users.username, leaderboard.best_wpm
        FROM leaderboard
        JOIN users
        ON users.id = leaderboard.user_id
        ORDER BY leaderboard.best_wpm DESC
        LIMIT 10
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template("index.html", data=data)


# LOGIN PAGE
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()

        if conn is None:
            return "Database Connection Failed"

        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT * FROM users
            WHERE username=%s AND password=%s
            """,
            (username, password)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if user:
            return redirect(url_for("home"))

        return render_template(
            "login.html",
            error="❌ Account not found. Please register first."
        )

    return render_template("login.html")


# REGISTER PAGE
@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]

        conn = get_db_connection()

        if conn is None:
            return "Database Connection Failed"

        cursor = conn.cursor()

        # CHECK USERNAME
        cursor.execute(
            "SELECT id FROM users WHERE username=%s",
            (username,)
        )

        if cursor.fetchone():

            cursor.close()
            conn.close()

            return render_template(
                "register.html",
                error="❌ Username already exists!"
            )

        # CHECK EMAIL
        cursor.execute(
            "SELECT id FROM users WHERE email=%s",
            (email,)
        )

        if cursor.fetchone():

            cursor.close()
            conn.close()

            return render_template(
                "register.html",
                error="❌ Email already registered!"
            )

        try:

            # INSERT USER
            cursor.execute("""
                INSERT INTO users
                (username,email,password)
                VALUES(%s,%s,%s)
            """, (
                username,
                email,
                password
            ))

            conn.commit()

            user_id = cursor.lastrowid

            # CREATE LEADERBOARD ROW
            cursor.execute("""
                INSERT INTO leaderboard
                (user_id,best_wpm)
                VALUES(%s,%s)
            """, (
                user_id,
                0
            ))

            conn.commit()

            print("USER REGISTERED:", username)

        except mysql.connector.Error as err:

            print("REGISTER ERROR:", err)

            cursor.close()
            conn.close()

            return render_template(
                "register.html",
                error=f"Database Error: {err}"
            )

        cursor.close()
        conn.close()

        return redirect(url_for("login"))

    return render_template("register.html")


# PROFILE PAGE
@app.route("/profile")
def profile():

    conn = get_db_connection()

    if conn is None:
        return "Database Connection Failed"

    cursor = conn.cursor()

    cursor.execute("""
        SELECT users.username,
               leaderboard.best_wpm
        FROM users
        JOIN leaderboard
        ON users.id = leaderboard.user_id
        ORDER BY leaderboard.best_wpm DESC
        LIMIT 1
    """)

    user = cursor.fetchone()

    cursor.execute("""
        SELECT COUNT(*)
        FROM typing_history
    """)

    tests_completed = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return render_template(
        "profile.html",
        username=user[0] if user else "Guest",
        best_wpm=user[1] if user else 0,
        tests_completed=tests_completed
    )


# SAVE SCORE
@app.route("/save_score", methods=["POST"])
def save_score():

    username = request.form["username"]
    wpm = int(request.form["wpm"])

    conn = get_db_connection()

    if conn is None:
        return "Database Connection Failed"

    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE username=%s",
        (username,)
    )

    user = cursor.fetchone()

    if user:

        user_id = user[0]

        cursor.execute("""
            INSERT INTO typing_history
            (user_id,wpm,accuracy,mistakes)
            VALUES(%s,%s,%s,%s)
        """, (
            user_id,
            wpm,
            100,
            0
        ))

        cursor.execute("""
            UPDATE leaderboard
            SET best_wpm = GREATEST(best_wpm,%s)
            WHERE user_id=%s
        """, (
            wpm,
            user_id
        ))

        conn.commit()

    cursor.close()
    conn.close()

    return "Score Saved"


# LEADERBOARD PAGE
@app.route("/leaderboard")
def leaderboard():

    conn = get_db_connection()

    if conn is None:
        return "Database Connection Failed"

    cursor = conn.cursor()

    cursor.execute("""
        SELECT users.username,
               leaderboard.best_wpm
        FROM leaderboard
        JOIN users
        ON users.id = leaderboard.user_id
        ORDER BY leaderboard.best_wpm DESC
        LIMIT 10
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return render_template(
        "leaderboard.html",
        data=data
    )


# LOGOUT
@app.route("/logout")
def logout():
    return redirect(url_for("login"))


# RUN APP
if __name__ == "__main__":
    app.run(debug=True)