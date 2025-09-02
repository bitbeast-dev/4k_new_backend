import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision/values", // Cloudinary folder for values
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// Get all 4k_values items
const getValues = (req, res) => {
  const sql = 'SELECT * FROM "4k_values" ORDER BY created_at DESC';
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
};

// Create new 4k_values item
const createValues = async (req, res) => {
  const { description } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  if (!description) {
    return res.status(400).json({ error: "Description is required" });
  }

  try {
    // Upload files to Cloudinary
    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file))
    );

    // Prepare values for DB insert
    const values = uploadResults.map((result) => [result.secure_url, description]);

    const placeholders = values
      .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
      .join(", ");
    const sql = `INSERT INTO "4k_values" (image, description) VALUES ${placeholders}`;
    const flatValues = values.flat();

    db.query(sql, flatValues, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: err });
      }

      res.status(201).json({
        message: "Values inserted successfully",
        insertedRows: result.rowCount,
      });
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// Update 4k_values item
const updateValues = (req, res) => {
  const { id } = req.params;
  const { image, description } = req.body;
  const sql =
    'UPDATE "4k_values" SET image = $1, description = $2 WHERE id = $3';
  db.query(sql, [image, description, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (result.rowCount === 0) {
      res.status(404).json({ error: "Record not found" });
    } else {
      res.json({ id: id, ...req.body });
    }
  });
};

// Delete 4k_values item
const deleteValues = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM "4k_values" WHERE id = $1';
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

export { getValues, createValues, updateValues, deleteValues };
