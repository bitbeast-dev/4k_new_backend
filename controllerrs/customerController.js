import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision/partners",
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

// Get all partners
const getcustomer = (req, res) => {
  const sql = "SELECT * FROM partner";
  db.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
};

// Create new partner(s)
const createcustomer = async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Upload all files to Cloudinary
    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file))
    );

    // Prepare values for DB insert
    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const title =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;

      return [title, description || "", result.secure_url];
    });

    const placeholders = values
      .map(
        (_, index) =>
          `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
      )
      .join(", ");
    const sql = `INSERT INTO partner (title_name, description, image) VALUES ${placeholders}`;
    const flatValues = values.flat();

    db.query(sql, flatValues, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({
          message: "Partners created successfully",
          count: result.rowCount,
        });
      }
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload partner images" });
  }
};

// Update partner description
const updatecustomer = (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const sql = "UPDATE partner SET description = $1 WHERE id = $2";
  db.query(sql, [description, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (result.rowCount === 0) {
      res.status(404).json({ error: "Record not found" });
    } else {
      res.json({ id: id, description });
    }
  });
};

// Delete partner
const deletecustomer = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM partner WHERE id = $1";
  db.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (result.rowCount === 0) {
      res.status(404).json({ error: "Record not found" });
    } else {
      res.json({ message: "Partner deleted successfully" });
    }
  });
};

export { getcustomer, createcustomer, updatecustomer, deletecustomer };
