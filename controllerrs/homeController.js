import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import fs from "fs";

// Get all home items
const getHome = (req, res) => {
  const sql = "SELECT * FROM home ORDER BY created_at DESC";
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
};

// Create new home item
const createHome = async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Upload images to Cloudinary
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "4k_vision", // Cloudinary folder name
        use_filename: true,
        unique_filename: false,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Prepare values for DB insert
    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const title =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;

      return [title, description || "", result.secure_url];
    });

    const placeholders = values.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const sql = `INSERT INTO home (title, description, image) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    db.query(sql, flatValues, (err, result) => {
      if (err) {
        console.error("PostgreSQL insert error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: "Images uploaded successfully",
        insertedRows: result.rowCount,
      });
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload images" });
  } finally {
    // Remove temp files from local disk
    if (req.files) {
      req.files.forEach((file) => fs.unlinkSync(file.path));
    }
  }
};

// Update home item
const updateHome = (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  const sql = "UPDATE home SET description = $1 WHERE id = $2";
  db.query(sql, [description, id], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({
      message: "Home record updated successfully",
      id,
      description,
    });
  });
};

// Delete home item
const deleteHome = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM home WHERE id = $1";
  db.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (result.rowCount === 0) {
      res.status(404).json({ error: "Record not found" });
    } else {
      res.json({ message: "Data successfully deleted" });
    }
  });
};

const truncateHome = (req, res) => {
  const sql = "TRUNCATE TABLE home";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "All products successfully deleted" });
  });
};


export { getHome, createHome, updateHome, deleteHome,truncateHome };
