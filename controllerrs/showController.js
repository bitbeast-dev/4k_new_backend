import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// -------------------- Cloudinary Helpers --------------------
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("File buffer missing"));

    const publicId =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

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

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`4k_vision/${publicId}`);
  } catch (err) {
    console.warn("Cloudinary deletion failed:", err.message);
  }
};

// ================= GET SHOWCASE =================
const getShowcase = (req, res) => {
  const sql = "SELECT * FROM showcase ORDER BY created_at DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
};

// ================= CREATE SHOWCASE =================
const createShowcase = async (req, res) => {
  try {
    const { description = "" } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    // Upload all files to Cloudinary
    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, file.originalname))
    );

    // Build values + placeholders
    const values = [];
    const placeholders = uploadResults.map((upload, index) => {
      const originalName = files[index].originalname;
      const title =
        originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

      values.push(title, description, upload.secure_url);
      const start = index * 3;
      return `($${start + 1}, $${start + 2}, $${start + 3})`;
    });

    const sql = `INSERT INTO showcase (title, description, image) VALUES ${placeholders.join(
      ", "
    )} RETURNING *`;
    const result = await db.query(sql, values);

    res.status(201).json({
      message: "Showcase created successfully",
      insertedRows: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE SHOWCASE =================
const updateShowcase = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const files = req.files;

    // Find existing record
    const record = await db.query("SELECT * FROM showcase WHERE id = $1", [id]);
    if (record.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });

    let imageUrl = record.rows[0].image;

    // If new file uploaded → replace image
    if (files && files.length > 0 && files[0].buffer) {
      await deleteFromCloudinary(record.rows[0].image);

      const uploadResult = await uploadToCloudinary(
        files[0].buffer,
        files[0].originalname
      );
      imageUrl = uploadResult.secure_url;
    }

    const result = await db.query(
      "UPDATE showcase SET title = $1, description = $2, image = $3 WHERE id = $4 RETURNING *",
      [title || record.rows[0].title, description || record.rows[0].description, imageUrl, id]
    );

    res.json({ message: "Showcase updated successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= DELETE SHOWCASE =================
const deleteShowcase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT image FROM showcase WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });

    await deleteFromCloudinary(result.rows[0].image);
    await db.query("DELETE FROM showcase WHERE id = $1", [id]);

    res.json({ message: "Showcase deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= TRUNCATE SHOWCASE =================
const truncateShowcase = async (req, res) => {
  try {
    const result = await db.query("SELECT image FROM showcase");
    const imageUrls = result.rows.map((row) => row.image);

    // Delete all images from Cloudinary
    await Promise.allSettled(imageUrls.map((url) => deleteFromCloudinary(url)));

    await db.query("TRUNCATE TABLE showcase");

    res.json({ message: "All showcase items deleted successfully" });
  } catch (error) {
    console.error("Truncate error:", error);
    res.status(500).json({ error: error.message });
  }
};

export {
  getShowcase,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  truncateShowcase,
};
