import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";
import multer from "multer";

// Multer configuration
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

// Helper: Upload file to Cloudinary
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error("File buffer is required"));
    }

    const publicId = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision",
        public_id: publicId,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Helper: Delete image from Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  try {
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`4k_vision/${publicId}`);
  } catch (error) {
    console.warn("Cloudinary deletion failed:", error.message);
  }
};

// Helper: Database query wrapper
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

    if (!files?.length) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Validate file buffers
    const invalidFiles = files.filter(file => !file.buffer);
    if (invalidFiles.length > 0) {
      return res.status(400).json({ error: "Invalid file data received" });
    }

    // Upload all images to Cloudinary
    const uploadResults = await Promise.all(
      files.map(file => uploadToCloudinary(file.buffer, file.originalname))
    );

    // Prepare batch insert
    const values = [];
    const placeholders = [];
    
    uploadResults.forEach((result, index) => {
      const title = files[index].originalname.split(".")[0];
      values.push(title, description, result.secure_url);
      placeholders.push(`($${values.length - 2}, $${values.length - 1}, $${values.length})`);
    });

    const sql = `INSERT INTO home (title, description, image) VALUES ${placeholders.join(", ")}`;
    const result = await queryDB(sql, values);

    res.status(201).json({ 
      message: "Images uploaded successfully", 
      insertedRows: result.rowCount 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE HOME =================
export const updateHome = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const files = req.files;

    // Get current record
    const result = await queryDB("SELECT * FROM home WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const currentRecord = result.rows[0];
    let imageUrl = currentRecord.image;

    // Update image if new file provided
    if (files?.length > 0 && files[0].buffer) {
      // Delete old image
      await deleteFromCloudinary(currentRecord.image);
      
      // Upload new image
      const uploadResult = await uploadToCloudinary(files[0].buffer, files[0].originalname);
      imageUrl = uploadResult.secure_url;
    }

    // Update record
    const updateResult = await queryDB(
      "UPDATE home SET description = $1, image = $2 WHERE id = $3 RETURNING *",
      [description || currentRecord.description, imageUrl, id]
    );

    res.json({ 
      message: "Record updated successfully", 
      record: updateResult.rows[0] 
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

    // Get record to delete
    const result = await queryDB("SELECT image FROM home WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const imageUrl = result.rows[0].image;

    // Delete from Cloudinary
    await deleteFromCloudinary(imageUrl);

    // Delete from database
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
    // Get all image URLs
    const result = await queryDB("SELECT image FROM home");
    const imageUrls = result.rows.map(row => row.image);

    // Delete all images from Cloudinary
    await Promise.allSettled(
      imageUrls.map(imageUrl => deleteFromCloudinary(imageUrl))
    );

    // Clear database table
    await queryDB("TRUNCATE TABLE home");

    res.json({ message: "All records deleted successfully" });
  } catch (error) {
    console.error("Truncate error:", error);
    res.status(500).json({ error: error.message });
  }
};
