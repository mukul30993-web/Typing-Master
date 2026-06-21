from flask import Flask, render_template, request, redirect, url_for
import pymysql

app = Flask(__name__)

def get_db():
    return pymysql.connect(
        host="localhost",
        user="root",
        password="YOUR_MYSQL_PASSWORD",
        database="student_db",
        cursorclass=pymysql.cursors.DictCursor
    )

# ── HOME — show all notes
@app.route("/")
def home():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM notes ORDER BY id DESC")
    notes = cursor.fetchall()
    db.close()
    return render_template("index.html", notes=notes)

# ── ADD NOTE
@app.route("/add", methods=["GET", "POST"])
def add_note():
    if request.method == "POST":
        title   = request.form["title"]
        content = request.form["content"]
        db = get_db()
        cursor = db.cursor()
        cursor.execute("INSERT INTO notes (title, content) VALUES (%s, %s)", (title, content))
        db.commit()
        db.close()
        return redirect(url_for("home"))
    return render_template("add_note.html")

# ── EDIT NOTE
@app.route("/edit/<int:note_id>", methods=["GET", "POST"])
def edit_note(note_id):
    db = get_db()
    cursor = db.cursor()
    if request.method == "POST":
        title   = request.form["title"]
        content = request.form["content"]
        cursor.execute("UPDATE notes SET title=%s, content=%s WHERE id=%s", (title, content, note_id))
        db.commit()
        db.close()
        return redirect(url_for("home"))
    cursor.execute("SELECT * FROM notes WHERE id=%s", (note_id,))
    note = cursor.fetchone()
    db.close()
    return render_template("edit_note.html", note=note)

# ── DELETE NOTE
@app.route("/delete/<int:note_id>", methods=["POST"])
def delete_note(note_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("DELETE FROM notes WHERE id=%s", (note_id,))
    db.commit()
    db.close()
    return redirect(url_for("home"))

@app.route("/search")
def search():
    keyword = request.args.get("q", "")

    db = get_db()
    cursor = db.cursor()

    cursor.execute("""
        SELECT * FROM notes
        WHERE title LIKE %s
        OR content LIKE %s
        ORDER BY id DESC
    """, (f"%{keyword}%", f"%{keyword}%"))

    notes = cursor.fetchall()
    db.close()

    return render_template("index.html", notes=notes)

if __name__ == "__main__":
    app.run(debug=True)