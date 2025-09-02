import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// -------------------- CLOUDINARY HELPERS --------------------
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("File buffer is required"));

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

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`4k_vision/${publicId}`);
  } catch (error) {
    console.warn("Cloudinary deletion failed:", error.message);
  }
};

// -------------------- DATABASE HELPER --------------------
const queryDB = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ================= GET HOME =================
export const getHome = async (req, res) => {
  try {
    const result = await queryDB("SELECT * FROM home ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= CREATE HOME =================
export const createHome = async (req, res) => {
  try {
    const { description = "" } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    const uploadResults = await Promise.all(
      files.map(file => uploadToCloudinary(file.buffer, file.originalname))
    );

    const values = [];
    const placeholders = uploadResults.map((upload, index) => {
      const title = files[index].originalname.split(".")[0] || `file_${index + 1}`;
      values.push(title, description, upload.secure_url);
      const start = index * 3;
      return `($${start + 1}, $${start + 2}, $${start + 3})`;
    });

    const sql = `INSERT INTO home (title, description, image) VALUES ${placeholders.join(", ")} RETURNING *`;
    const result = await queryDB(sql, values);

    res.status(201).json({
      message: "Home items uploaded successfully",
      insertedRows: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE HOME =================
export const updateHome = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const files = req.files;

    const result = await queryDB("SELECT * FROM home WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });

    const currentRecord = result.rows[0];
    let imageUrl = currentRecord.image;

    if (files && files.length > 0 && files[0].buffer) {
      try {
        await deleteFromCloudinary(currentRecord.image);
        const uploadResult = await uploadToCloudinary(files[0].buffer, files[0].originalname);
        imageUrl = uploadResult.secure_url;
      } catch (err) {
        console.warn("Failed to update image:", err.message);
      }
    }

    const updateResult = await queryDB(
      "UPDATE home SET description = $1, image = $2 WHERE id = $3 RETURNING *",
      [description || currentRecord.description, imageUrl, id]
    );

    res.json({
      message: "Record updated successfully",
      record: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= DELETE HOME =================
export const deleteHome = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await queryDB("SELECT image FROM home WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });

    const imageUrl = result.rows[0].image;
    await deleteFromCloudinary(imageUrl);

    await queryDB("DELETE FROM home WHERE id = $1", [id]);

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= TRUNCATE HOME =================
export const truncateHome = async (req, res) => {
  try {
    const result = await queryDB("SELECT image FROM home");
    const imageUrls = result.rows.map(row => row.image);

    await Promise.allSettled(imageUrls.map(url => deleteFromCloudinary(url)));

    await queryDB("TRUNCATE TABLE home");

    res.json({ message: "All home items deleted successfully" });
  } catch (error) {
    console.error("Truncate error:", error);
    res.status(500).json({ error: error.message });
  }
};
