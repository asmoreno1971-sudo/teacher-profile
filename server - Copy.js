const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

const db = new sqlite3.Database("./teachers.db", (err) => {
  if (err) console.error(err.message);
  else console.log("✅ Connected to database");
});

db.serialize(() => {
  db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT UNIQUE,
    name TEXT,
    gender TEXT,
    position TEXT,
    subject TEXT,
    years_service INTEGER,
    gsis_no TEXT,
    philhealth_no TEXT,
    tin_no TEXT,
    employee_no TEXT,
    bp_no TEXT,
    last_updated TEXT
  )
  `);
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.json({ success: false, error: err.message });

      if (row) {
        res.json({ success: true });
      } else {
        res.json({ success: false, error: "Invalid login" });
      }
    }
  );
});

/* REGISTER */
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, password],
    (err) => {
      if (err) return res.json({ success: false, error: "User exists" });
      res.json({ success: true });
    }
  );
});

/* SAVE TEACHER */
app.post("/save-teacher", (req, res) => {

  const {
    teacher_id,
    name,
    gender,
    position,
    subject,
    years_service,
    gsis_no,
    philhealth_no,
    tin_no,
    employee_no,
    bp_no
  } = req.body;

  const sql = `
    INSERT INTO teachers (
      teacher_id, name, gender, position, subject,
      years_service, gsis_no, philhealth_no,
      tin_no, employee_no, bp_no, last_updated
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(teacher_id) DO UPDATE SET
      name=excluded.name,
      gender=excluded.gender,
      position=excluded.position,
      subject=excluded.subject,
      years_service=excluded.years_service,
      gsis_no=excluded.gsis_no,
      philhealth_no=excluded.philhealth_no,
      tin_no=excluded.tin_no,
      employee_no=excluded.employee_no,
      bp_no=excluded.bp_no,
      last_updated=datetime('now')
  `;

  db.run(sql, [
    teacher_id,
    name,
    gender,
    position,
    subject,
    years_service,
    gsis_no,
    philhealth_no,
    tin_no,
    employee_no,
    bp_no
  ], (err) => {
    if (err) {
      console.error(err.message);
      return res.json({ success: false, error: err.message });
    }

    res.json({ success: true });
  });

});

/* GET ALL TEACHERS (ADMIN) */
app.get("/teachers", (req, res) => {
  db.all("SELECT * FROM teachers ORDER BY last_updated DESC", [], (err, rows) => {
    if (err) return res.json({ success: false, error: err.message });
    res.json(rows);
  });
});

/* START */
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});