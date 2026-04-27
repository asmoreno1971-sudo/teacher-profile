const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   DATABASE
========================= */
const db = new sqlite3.Database("./teachers.db", (err) => {
  if (err) console.error(err.message);
  else console.log("✅ DB Connected");
});

/* =========================
   TABLES
========================= */
db.run(`
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT UNIQUE,
  name TEXT,
  gender TEXT,
  position TEXT,
  subject TEXT,
  years_service TEXT,
  gsis_no TEXT,
  philhealth_no TEXT,
  tin_no TEXT,
  employee_no TEXT,
  bp_no TEXT,
  last_updated TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT
)
`);

/* =========================
   LOGIN
========================= */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (!row) return res.json({ ok: false });
      res.json({ ok: true });
    }
  );
});

/* =========================
   REGISTER (AUTO)
========================= */
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username,password) VALUES (?,?)",
    [username, password],
    (err) => {
      if (err) return res.json({ ok: false });
      res.json({ ok: true });
    }
  );
});

/* =========================
   SAVE TEACHER (🔥 FIXED)
========================= */
app.post("/api/save-teacher", (req, res) => {

  const t = req.body;

  db.run(`
    INSERT INTO teachers (
      teacher_id,name,gender,position,subject,
      years_service,gsis_no,philhealth_no,
      tin_no,employee_no,bp_no,last_updated
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,
      strftime('%Y-%m-%d %H:%M:%S','now','+8 hours')
    )
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
      last_updated=strftime('%Y-%m-%d %H:%M:%S','now','+8 hours')
  `, [
    t.teacher_id,
    t.name,
    t.gender,
    t.position,
    t.subject,
    t.years_service,
    t.gsis_no,
    t.philhealth_no,
    t.tin_no,
    t.employee_no,
    t.bp_no   // ✅ CORRECT FIELD (FIXED)
  ], (err) => {
    if (err) {
      console.error(err);
      return res.json({ ok:false });
    }
    res.json({ ok:true });
  });

});

/* =========================
   GET ONE TEACHER
========================= */
app.get("/api/teacher/:id", (req,res)=>{
  db.get(
    "SELECT * FROM teachers WHERE teacher_id=?",
    [req.params.id],
    (err,row)=>{
      res.json(row||{});
    }
  );
});

/* =========================
   GET ALL TEACHERS
========================= */
app.get("/api/teachers", (req,res)=>{
  db.all(
    "SELECT * FROM teachers ORDER BY id DESC",
    [],
    (err,rows)=>{
      res.json(rows||[]);
    }
  );
});

/* =========================
   DELETE
========================= */
app.delete("/api/teachers/:id", (req,res)=>{
  db.run(
    "DELETE FROM teachers WHERE id=?",
    [req.params.id],
    ()=> res.json({ok:true})
  );
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
});