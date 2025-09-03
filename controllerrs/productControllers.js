import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// Get all products
const getProducts = (req, res) => {
  const sql = "SELECT * FROM products ORDER BY created_at DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
};

// Helper: Upload a file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const publicId = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision",
        public_id: publicId,
        use_filename: true,
        unique_filename: false,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Create new product
const createProducts = async (req, res) => {
  try {
    const { description, price, features, style, quantity, category } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Upload all images to Cloudinary
    const uploadResults = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.buffer) {
        console.warn(`Skipping file ${file.originalname} - no buffer`);
        continue;
      }
      const result = await uploadToCloudinary(file.buffer, file.originalname);
      uploadResults.push(result);
    }

    if (uploadResults.length === 0) {
      return res.status(400).json({ error: "No files could be uploaded" });
    }

    // Prepare SQL insertion
    const values = [];
    const placeholders = [];

    uploadResults.forEach((upload, index) => {
      const title = files[index].originalname.split(".")[0] || `file_${index + 1}`;
      const startIndex = index * 8;
      values.push(upload.secure_url, title, description, price, features, style, quantity, category);
      placeholders.push(`($${startIndex + 1}, $${startIndex + 2}, $${startIndex + 3}, $${startIndex + 4}, $${startIndex + 5}, $${startIndex + 6}, $${startIndex + 7}, $${startIndex + 8})`);
    });

    const sql = `INSERT INTO products (image, title, description, price, features, style, quantity, category) VALUES ${placeholders.join(", ")}`;

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        message: "Products uploaded successfully",
        insertedRows: result.rowCount,
      });
    });

  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload images" });
  }
};

// Update product
const updateProducts = (req, res) => {
  const { ID } = req.params;
  const { description, price, category } = req.body;
  const sql = "UPDATE products SET description = $1, price = $2, category = $3 WHERE ID = $4";
  db.query(sql, [description, price, category, ID], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Product updated successfully", ID, description, price, category });
  });
};

// Delete product
const deleteProducts = (req, res) => {
  const { ID } = req.params;
  const sql = "DELETE FROM products WHERE ID = $1";
  db.query(sql, [ID], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Product successfully deleted" });
  });
};

// Truncate products
const truncateProducts = (req, res) => {
  const sql = "TRUNCATE TABLE products";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All products successfully deleted" });
  });
};

export { getProducts, createProducts, updateProducts, deleteProducts, truncateProducts };
