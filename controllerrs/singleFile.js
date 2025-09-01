import mysql2 from "mysql2";
import db from "../config/db.js";

// Get all home items
const getHome = (req, res) => {
    const sql = "SELECT * FROM home ORDER BY created_at DESC";
    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
};

// Create new home item
const createHome = (req, res) => {
    const {description} = req.body;
    const image=req.file?.filename

    if(!image){
        res.status(400).json({error:"Image is required"})
    }

    const originalName = file.originalname;
    const title = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

    const sql = "INSERT INTO home (title, description, image) VALUES (?, ?, ?)";
    db.query(sql, [title, description, image], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ id: result.insertId, ...req.body });
        }
    });
};

// Update home item
const updateHome = (req, res) => {
    const { id } = req.params;
    const { title, description, image_path } = req.body;
    const sql = "UPDATE home SET title = ?, description = ?, image = ? WHERE id = ?";
    db.query(sql, [title, description, image_path, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({ id: id, ...req.body });
        }
    });
};

// Delete home item
const deleteHome = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM home WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            
            res.json({message:"data successfully deleted"})
        }
    });
};

export { getHome, createHome, updateHome, deleteHome };
