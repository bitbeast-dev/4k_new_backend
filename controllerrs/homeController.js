import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

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

// Stream upload function
const streamUpload = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision",
        use_filename: true,
        unique_filename: false,
        public_id: originalName.substring(0, originalName.lastIndexOf(".")) || originalName,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
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

    // Upload images via stream
    const uploadResults = await Promise.all(
      files.map((file) => streamUpload(file.buffer, file.originalname))
    );

    // Prepare values for DB insert
    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const title =
        originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

      return [title, description || "", result.secure_url];
    });

    const placeholders = values
      .map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`)
      .join(", ");

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
  }
};

export { getHome, createHome, updateHome, deleteHome, truncateHome };
