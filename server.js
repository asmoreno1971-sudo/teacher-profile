const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;


const defaultMenu = [
  { id: 'latte', name: 'Cafe Latte', price: 130, image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=640&q=60' },
  { id: 'mocha', name: 'Cafe Mocha', price: 145, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=640&q=60' },
  { id: 'americano', name: 'Americano', price: 110, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=640&q=60' },
  { id: 'matcha', name: 'Matcha Latte', price: 150, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=640&q=60' }
];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

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
  bp_no TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS sales (
  sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  customer_name TEXT,
  pickup_time TEXT,
  total REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'PENDING'
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER,
  item_name TEXT,
  qty INTEGER,
  price REAL,
  subtotal REAL,
  FOREIGN KEY(sale_id) REFERENCES sales(sale_id)
)
`);

/* SAVE / UPDATE */
app.post("/api/save-teacher", (req, res) => {

  const d = req.body;

  db.run(`
  INSERT INTO teachers (
    teacher_id, name, gender, position, subject, years_service,
    gsis_no, philhealth_no, tin_no, employee_no, bp_no
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    bp_no=excluded.bp_no
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
    d.bp_no
  ], (err) => {
    if (err) {
      console.error(err);
      return res.json({ success:false });
    }
    res.json({ success:true });
  });

});

/* GET ONE */
app.get("/api/teacher/:id", (req, res) => {
  db.get("SELECT * FROM teachers WHERE teacher_id=?", [req.params.id], (err, row) => {
    if (err) return res.json({});
    res.json(row || {});
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
    if(err){
      console.error(err);
      return res.json({ success:false });
    }
    res.json({ success:true });
  });
});


/* PREORDER MENU */
app.get('/menu', (req, res) => {
  res.json(defaultMenu);
});

app.post('/place-order', (req, res) => {
  const order = req.body || {};

  if (!order.customer_name || !order.pickup_time || !Array.isArray(order.items) || order.items.length === 0) {
    return res.json({ success: false });
  }

  const stamp = Date.now().toString().slice(-6);
  const orderId = `PO-${stamp}`;

  console.log('New preorder:', { order_id: orderId, ...order });

  res.json({ success: true, order_id: orderId });
});


/* SALES */
app.post('/api/sales', (req, res) => {
  const sale = req.body || {};
  const items = Array.isArray(sale.items) ? sale.items : [];

  if (!sale.order_id || !sale.customer_name || !sale.pickup_time || !items.length) {
    return res.json({ success:false, message:'Invalid sale payload' });
  }

  db.run(
    `INSERT INTO sales (order_id, customer_name, pickup_time, total, status) VALUES (?, ?, ?, ?, ?)`,
    [sale.order_id, sale.customer_name, sale.pickup_time, sale.total || 0, "PENDING"],
    function (err) {
      if (err) {
        console.error(err);
        return res.json({ success:false });
      }

      const saleId = this.lastID;
      const stmt = db.prepare(
        `INSERT INTO sale_items (sale_id, item_name, qty, price, subtotal) VALUES (?, ?, ?, ?, ?)`
      );

      for (const it of items) {
        stmt.run([saleId, it.name, it.qty, it.price, it.subtotal]);
      }

      stmt.finalize((finalErr) => {
        if (finalErr) {
          console.error(finalErr);
          return res.json({ success:false });
        }
        res.json({ success:true, sale_id: saleId });
      });
    }
  );
});

app.get('/api/sales', (req, res) => {
  db.all(`SELECT * FROM sales ORDER BY sale_id DESC`, [], (err, sales) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    res.json(sales || []);
  });
});


app.patch('/api/sales/:id/status', (req, res) => {
  const status = req.body && req.body.status ? req.body.status : 'PENDING';
  db.run(`UPDATE sales SET status=? WHERE sale_id=?`, [status, req.params.id], function(err){
    if (err) return res.json({ success:false });
    res.json({ success:true, updated:this.changes });
  });
});

/* START */
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});