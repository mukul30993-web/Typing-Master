"""
Typing Master - Flask Application
A comprehensive typing practice platform with user management
"""

from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, jsonify
)
from functools import wraps
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import os
import hashlib
import secrets

# ============================================
# App Configuration
# ============================================

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour

# Database Configuration
DB_CONFIG = {
    "host": os.environ.get('DB_HOST', 'localhost'),
    "user": os.environ.get('DB_USER', 'root'),
    "password": os.environ.get('DB_PASSWORD', 'b1VsgjSL81'),
    "database": os.environ.get('DB_NAME', 'typing_test'),
    "pool_name": "typing_pool",
    "pool_size": 5
}


# ============================================
# Database Connection
# ============================================

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as err:
        print(f"Database Connection Error: {err}")
        return None


def close_db_connection(connection, cursor=None):
    """Safely close database connection and cursor"""
    try:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
    except Error as err:
        print(f"Error closing connection: {err}")


# ============================================
# Authentication Decorator
# ============================================

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page.', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


# ============================================
# Password Hashing
# ============================================

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


# ============================================
# Home Page
# ============================================

@app.route("/")
def home():
    """Display home page with leaderboard"""
    conn = get_db_connection()
    if conn is None:
        flash('Database connection failed. Please try again later.', 'error')
        return render_template("index.html", data=[])

    try:
        cursor = conn.cursor()

        # Get top 10 leaderboard
        cursor.execute("""
            SELECT 
                users.username, 
                leaderboard.best_wpm,
                leaderboard.avg_wpm,
                leaderboard.tests_completed,
                leaderboard.last_played
            FROM leaderboard
            JOIN users ON users.id = leaderboard.user_id
            ORDER BY leaderboard.best_wpm DESC
            LIMIT 10
        """)

        data = cursor.fetchall()

        # Get total stats
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM typing_history")
        total_tests = cursor.fetchone()[0]

        close_db_connection(conn, cursor)

        return render_template(
            "index.html",
            data=data,
            total_users=total_users,
            total_tests=total_tests
        )

    except Error as err:
        print(f"Database Error: {err}")
        close_db_connection(conn, cursor)
        flash('An error occurred. Please try again.', 'error')
        return render_template("index.html", data=[])


# ============================================
# Login Page
# ============================================

@app.route("/login", methods=["GET", "POST"])
def login():
    """Handle user login"""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        # Validate input
        if not username or not password:
            flash('Please enter both username and password.', 'error')
            return render_template("login.html")

        conn = get_db_connection()
        if conn is None:
            flash('Database connection failed. Please try again later.', 'error')
            return render_template("login.html")

        try:
            cursor = conn.cursor(dictionary=True)

            # Check user credentials
            cursor.execute(
                """
                SELECT id, username, email, password 
                FROM users 
                WHERE username = %s
                """,
                (username,)
            )

            user = cursor.fetchone()

            if user and user['password'] == hash_password(password):
                # Set session
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['email'] = user['email']
                session.permanent = True

                flash(f'Welcome back, {username}!', 'success')
                close_db_connection(conn, cursor)
                return redirect(url_for('home'))
            else:
                flash('Invalid username or password.', 'error')
                close_db_connection(conn, cursor)
                return render_template("login.html")

        except Error as err:
            print(f"Login Error: {err}")
            flash('An error occurred. Please try again.', 'error')
            close_db_connection(conn, cursor)
            return render_template("login.html")

    return render_template("login.html")


# ============================================
# Register Page
# ============================================

@app.route("/register", methods=["GET", "POST"])
def register():
    """Handle user registration"""
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        # Validate input
        errors = []

        if not username:
            errors.append('Username is required.')
        elif len(username) < 3:
            errors.append('Username must be at least 3 characters.')
        elif len(username) > 20:
            errors.append('Username must be less than 20 characters.')

        if not email:
            errors.append('Email is required.')
        elif '@' not in email or '.' not in email:
            errors.append('Please enter a valid email address.')

        if not password:
            errors.append('Password is required.')
        elif len(password) < 6:
            errors.append('Password must be at least 6 characters.')

        if password != confirm_password:
            errors.append('Passwords do not match.')

        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template("register.html")

        conn = get_db_connection()
        if conn is None:
            flash('Database connection failed. Please try again later.', 'error')
            return render_template("register.html")

        try:
            cursor = conn.cursor()

            # Check if username exists
            cursor.execute(
                "SELECT id FROM users WHERE username = %s",
                (username,)
            )
            if cursor.fetchone():
                flash('Username already exists. Please choose another.', 'error')
                close_db_connection(conn, cursor)
                return render_template("register.html")

            # Check if email exists
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (email,)
            )
            if cursor.fetchone():
                flash('Email already registered. Please use another email.', 'error')
                close_db_connection(conn, cursor)
                return render_template("register.html")

            # Hash password
            hashed_password = hash_password(password)

            # Insert user
            cursor.execute(
                """
                INSERT INTO users (username, email, password)
                VALUES (%s, %s, %s)
                """,
                (username, email, hashed_password)
            )

            conn.commit()
            user_id = cursor.lastrowid

            # Create leaderboard entry
            cursor.execute(
                """
                INSERT INTO leaderboard (user_id, best_wpm, avg_wpm, tests_completed)
                VALUES (%s, 0, 0, 0)
                """,
                (user_id,)
            )

            conn.commit()

            flash('Account created successfully! Please login.', 'success')
            close_db_connection(conn, cursor)
            return redirect(url_for('login'))

        except Error as err:
            print(f"Registration Error: {err}")
            flash('An error occurred during registration. Please try again.', 'error')
            close_db_connection(conn, cursor)
            return render_template("register.html")

    return render_template("register.html")


# ============================================
# Profile Page
# ============================================

@app.route("/profile")
@login_required
def profile():
    """Display user profile with statistics"""
    conn = get_db_connection()
    if conn is None:
        flash('Database connection failed.', 'error')
        return redirect(url_for('home'))

    try:
        cursor = conn.cursor(dictionary=True)

        # Get user stats
        cursor.execute(
            """
            SELECT 
                users.username,
                users.email,
                leaderboard.best_wpm,
                leaderboard.avg_wpm,
                leaderboard.tests_completed,
                leaderboard.last_played
            FROM users
            JOIN leaderboard ON users.id = leaderboard.user_id
            WHERE users.id = %s
            """,
            (session['user_id'],)
        )

        user = cursor.fetchone()

        # Get recent test history
        cursor.execute(
            """
            SELECT wpm, accuracy, mistakes, created_at
            FROM typing_history
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 10
            """,
            (session['user_id'],)
        )

        recent_tests = cursor.fetchall()

        # Calculate XP and level
        tests_completed = user['tests_completed'] if user else 0
        xp = tests_completed * 10
        xp_next = ((tests_completed // 10) + 1) * 100
        level = (tests_completed // 10) + 1

        # Determine level title
        if level >= 10:
            level_title = "Typing Master"
        elif level >= 7:
            level_title = "Expert"
        elif level >= 5:
            level_title = "Advanced"
        elif level >= 3:
            level_title = "Intermediate"
        else:
            level_title = "Beginner"

        close_db_connection(conn, cursor)

        return render_template(
            "profile.html",
            username=user['username'] if user else session['username'],
            email=user['email'] if user else '',
            best_wpm=user['best_wpm'] if user else 0,
            avg_wpm=user['avg_wpm'] if user else 0,
            tests_completed=tests_completed,
            recent_tests=recent_tests,
            xp=xp,
            xp_next=xp_next,
            level=level,
            level_title=level_title,
            xp_percent=(xp % 100)
        )

    except Error as err:
        print(f"Profile Error: {err}")
        flash('An error occurred loading your profile.', 'error')
        close_db_connection(conn, cursor)
        return redirect(url_for('home'))


# ============================================
# Update Profile
# ============================================

@app.route("/update_profile", methods=["POST"])
@login_required
def update_profile():
    """Update user profile"""
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip().lower()

    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"})

    try:
        cursor = conn.cursor()

        # Check if username is taken by another user
        cursor.execute(
            "SELECT id FROM users WHERE username = %s AND id != %s",
            (username, session['user_id'])
        )
        if cursor.fetchone():
            close_db_connection(conn, cursor)
            return jsonify({"success": False, "message": "Username already taken"})

        # Check if email is taken by another user
        cursor.execute(
            "SELECT id FROM users WHERE email = %s AND id != %s",
            (email, session['user_id'])
        )
        if cursor.fetchone():
            close_db_connection(conn, cursor)
            return jsonify({"success": False, "message": "Email already registered"})

        # Update user
        cursor.execute(
            """
            UPDATE users 
            SET username = %s, email = %s
            WHERE id = %s
            """,
            (username, email, session['user_id'])
        )

        conn.commit()

        # Update session
        session['username'] = username
        session['email'] = email

        close_db_connection(conn, cursor)
        return jsonify({"success": True, "message": "Profile updated successfully"})

    except Error as err:
        print(f"Update Profile Error: {err}")
        close_db_connection(conn, cursor)
        return jsonify({"success": False, "message": "An error occurred"})


# ============================================
# Save Score
# ============================================

@app.route("/save_score", methods=["POST"])
def save_score():
    """Save typing test score"""
    username = request.form.get("username", "").strip()
    wpm = int(request.form.get("wpm", 0))
    accuracy = int(request.form.get("accuracy", 100))
    mistakes = int(request.form.get("mistakes", 0))
    difficulty = request.form.get("difficulty", "medium")

    if not username:
        return "Error: Username required", 400

    conn = get_db_connection()
    if conn is None:
        return "Database Connection Failed", 500

    try:
        cursor = conn.cursor()

        # Get user ID
        cursor.execute(
            "SELECT id FROM users WHERE username = %s",
            (username,)
        )

        user = cursor.fetchone()

        if user:
            user_id = user[0]

            # Insert test history
            cursor.execute(
                """
                INSERT INTO typing_history 
                (user_id, wpm, accuracy, mistakes, difficulty)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, wpm, accuracy, mistakes, difficulty)
            )

            # Update leaderboard
            cursor.execute(
                """
                UPDATE leaderboard 
                SET 
                    best_wpm = GREATEST(best_wpm, %s),
                    avg_wpm = (
                        SELECT AVG(wpm) 
                        FROM typing_history 
                        WHERE user_id = %s
                    ),
                    tests_completed = tests_completed + 1,
                    last_played = NOW()
                WHERE user_id = %s
                """,
                (wpm, user_id, user_id)
            )

            conn.commit()
            close_db_connection(conn, cursor)
            return "Score Saved", 200
        else:
            close_db_connection(conn, cursor)
            return "User not found", 404

    except Error as err:
        print(f"Save Score Error: {err}")
        close_db_connection(conn, cursor)
        return f"Error: {err}", 500


# ============================================
# Leaderboard Page
# ============================================

@app.route("/leaderboard")
def leaderboard():
    """Display full leaderboard"""
    conn = get_db_connection()
    if conn is None:
        flash('Database connection failed.', 'error')
        return render_template("leaderboard.html", data=[])

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                users.username,
                leaderboard.best_wpm,
                leaderboard.avg_wpm,
                leaderboard.tests_completed,
                leaderboard.last_played
            FROM leaderboard
            JOIN users ON users.id = leaderboard.user_id
            ORDER BY leaderboard.best_wpm DESC
            LIMIT 100
        """)

        data = cursor.fetchall()

        close_db_connection(conn, cursor)

        return render_template("leaderboard.html", data=data)

    except Error as err:
        print(f"Leaderboard Error: {err}")
        flash('An error occurred loading the leaderboard.', 'error')
        close_db_connection(conn, cursor)
        return render_template("leaderboard.html", data=[])


# ============================================
# API Endpoints
# ============================================

@app.route("/api/user_stats")
@login_required
def api_user_stats():
    """Get user statistics as JSON"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
                best_wpm,
                avg_wpm,
                tests_completed,
                last_played
            FROM leaderboard
            WHERE user_id = %s
            """,
            (session['user_id'],)
        )

        stats = cursor.fetchone()
        close_db_connection(conn, cursor)

        return jsonify(stats or {})

    except Error as err:
        print(f"API Error: {err}")
        close_db_connection(conn, cursor)
        return jsonify({"error": str(err)}), 500


# ============================================
# Logout
# ============================================

@app.route("/logout")
def logout():
    """Handle user logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))


# ============================================
# Error Handlers
# ============================================

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(e):
    """Handle 500 errors"""
    return render_template("500.html"), 500


# ============================================
# Run App
# ============================================

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)