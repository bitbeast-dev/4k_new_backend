import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";
import multer from "multer";

// Multer configuration - NO RESTRICTIONS AT ALL
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max per file
    files: 20 // Allow up to 20 files
  }
  // NO fileFilter - accepts ALL file types
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
        resource_type: "auto" // Auto-detect any file type
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

    console.log("Received files:", files?.length || 0);
    console.log("Content-Type:", req.headers['content-type']);

    // Accept ANY files - just check if they exist
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    // Process ALL files - no filtering whatsoever
    const uploadResults = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only skip if completely no buffer at all
      if (file && file.buffer) {
        try {
          const result = await uploadToCloudinary(file.buffer, file.originalname);
          uploadResults.push({ result, originalname: file.originalname });
          console.log(`File ${i + 1} uploaded:`, file.originalname);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.originalname}:`, uploadError.message);
          // Continue with other files
        }
      } else {
        console.log(`Skipping file ${i + 1} - no buffer:`, file?.originalname);
      }
    }

    if (uploadResults.length === 0) {
      return res.status(400).json({ error: "No files could be uploaded" });
    }

    // FIXED: Correct SQL placeholder generation
    const values = [];
    const placeholders = [];
    
    uploadResults.forEach((upload, index) => {
      const title = upload.originalname.split(".")[0] || `file_${index + 1}`;
      const startIndex = index * 3;
      
      // Add values in order: title, description, image_url
      values.push(title, description, upload.result.secure_url);
      
      // Create proper PostgreSQL placeholders: $1, $2, $3, $4, $5, $6, etc.
      placeholders.push(`($${startIndex + 1}, $${startIndex + 2}, $${startIndex + 3})`);
    });

    const sql = `INSERT INTO home (title, description, image) VALUES ${placeholders.join(", ")}`;
    
    console.log("SQL:", sql);
    console.log("Values count:", values.length);
    
    const result = await queryDB(sql, values);

    res.status(201).json({ 
      message: "Files uploaded successfully", 
      insertedRows: result.rowCount,
      totalFiles: files.length,
      successfulUploads: uploadResults.length
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

    // Update image if ANY file provided (no restrictions)
    if (files && files.length > 0 && files[0] && files[0].buffer) {
      try {
        // Delete old image
        await deleteFromCloudinary(currentRecord.image);
        
        // Upload new file
        const uploadResult = await uploadToCloudinary(files[0].buffer, files[0].originalname);
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Failed to update image:", uploadError.message);
        // Keep old image URL if upload fails
      }
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
