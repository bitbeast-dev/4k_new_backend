import db from "../config/db.js";

// Get all categories
const getCategory = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM category ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create new category
const createCategory = async (req, res) => {
    const { cat } = req.body;
    try {
        const result = await db.query("INSERT INTO category (id) VALUES ($1)", [cat]);
        res.status(201).json({
            message: "Category Inserted successfully",
            insertedRows: result.rowCount,
        });
    } catch (err) {
        console.error("PostgreSQL insert error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    const { cat_id } = req.params;
    const { id } = req.body;
    try {
        const result = await db.query("UPDATE category SET id = $1 WHERE cat_id = $2", [id, cat_id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({ id: id, ...req.body });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query("DELETE FROM category WHERE cat_id = $1", [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({ message: "data successfully deleted" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export { getCategory, createCategory, updateCategory, deleteCategory };
