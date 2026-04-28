const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* DATABASE */
const db = new sqlite3.Database("./teachers.db", (err) => {
  if (err) console.error(err.message);
  else console.log("✅ Connected to SQLite");
});

/* CREATE TABLE */
db.run(`
CREATE TABLE IF NOT EXISTS teachers (
  teacher_id TEXT PRIMARY KEY,
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

/* SAVE / UPDATE */
app.post("/api/save-teacher", (req, res) => {

  const d = req.body;
  const now = new Date().toLocaleString();

  db.run(`
  INSERT INTO teachers (
    teacher_id, name, gender, position, subject, years_service,
    gsis_no, philhealth_no, tin_no, employee_no, bp_no, last_updated
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    last_updated=excluded.last_updated
  `, [
    d.teacher_id,
    d.name,
    d.gender,
    d.position,
    d.subject,
    d.years_service,
    d.gsis_no,
    d.philhealth_no,
    d.tin_no,
    d.employee_no,
    d.bp_no,
    now
  ], (err) => {
    if (err) return res.json({ success:false });
    res.json({ success:true });
  });

});

/* GET ALL */
app.get("/api/all-teachers", (req, res) => {
  db.all("SELECT * FROM teachers", [], (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

/* DELETE */
app.delete("/api/delete-teacher/:id", (req, res) => {
  db.run("DELETE FROM teachers WHERE teacher_id=?", [req.params.id], function(err){
    if(err) return res.json({ success:false });
    res.json({ success:true });
  });
});

/* START */
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});