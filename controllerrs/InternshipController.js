import db from "../config/db.js";

// ✅ Get all internship items
const getInternship = (req, res) => {
    const sql = "SELECT * FROM internship ORDER BY created_at DESC";
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(result.rows);
    });
};

// ✅ Create new internship item
const createInternship = (req, res) => {
    const { title, description, requirement, duration } = req.body;

    const sql = "INSERT INTO internship (title, description, requirement, duration) VALUES ($1, $2, $3, $4) RETURNING id";
    db.query(sql, [title, description, requirement, duration], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.rows[0].id, ...req.body });
    });
};

// ✅ Update internship item
const updateInternship = (req, res) => {
    const { id } = req.params;
    const { icon, title, description, requirement, duration } = req.body;

    const sql = "UPDATE internship SET icon = $1, title = $2, description = $3, requirement = $4, duration = $5 WHERE id = $6";
    db.query(sql, [icon, title, description, requirement, duration, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ id: id, ...req.body });
    });
};

// ✅ Delete internship item
const deleteInternship = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM internship WHERE id = $1";
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json({ message: "Data successfully deleted" });
    });
};

export { getInternship, createInternship, updateInternship, deleteInternship };
