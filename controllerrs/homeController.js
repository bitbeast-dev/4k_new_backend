import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";
import multer from "multer";

// Multer memoryStorage setup for file buffers
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

// Helper: Upload a single file buffer to Cloudinary
const streamUpload = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("File buffer is undefined"));

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

// ====================== GET HOME ======================
export const getHome = (req, res) => {
  const sql = "SELECT * FROM home ORDER BY created_at DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
};

// ====================== CREATE HOME ======================
export const createHome = async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Upload all images to Cloudinary
    const uploadResults = await Promise.all(
      files.map((file) => streamUpload(file.buffer, file.originalname))
    );

    // Prepare values for DB insert
    const values = uploadResults.map((result, i) => {
      const originalName = files[i].originalname;
      const title = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
      return [title, description || "", result.secure_url];
    });

    const placeholders = values
      .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
      .join(", ");
    const flatValues = values.flat();

    const sql = `INSERT INTO home (title, description, image) VALUES ${placeholders}`;
    db.query(sql, flatValues, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Images uploaded successfully", insertedRows: result.rowCount });
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: error.message || "Failed to upload images" });
  }
};

// ====================== UPDATE HOME ======================
export const updateHome = async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;
  const files = req.files;

  try {
    // Fetch current record
    const record = await new Promise((resolve, reject) =>
      db.query("SELECT image FROM home WHERE id=$1", [id], (err, result) => {
        if (err) reject(err);
        else if (result.rowCount === 0) reject({ notFound: true });
        else resolve(result.rows[0]);
      })
    );

    let newImageUrl = record.image;

    // Replace image if new file uploaded
    if (files && files.length > 0 && files[0].buffer) {
      // Delete old Cloudinary image
      const oldPublicId = record.image.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(`4k_vision/${oldPublicId}`);

      // Upload new image
      const uploadResult = await streamUpload(files[0].buffer, files[0].originalname);
      newImageUrl = uploadResult.secure_url;
    }

    // Update DB
    db.query(
      "UPDATE home SET description=$1, image=$2 WHERE id=$3 RETURNING *",
      [description, newImageUrl, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Home record updated successfully", record: result.rows[0] });
      }
    );
  } catch (error) {
    if (error.notFound) return res.status(404).json({ error: "Record not found" });
    console.error(error);
    res.status(500).json({ error: "Failed to update record" });
  }
};

// ====================== DELETE HOME ======================
export const deleteHome = (req, res) => {
  const { id } = req.params;

  db.query("SELECT image FROM home WHERE id=$1", [id], async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });

    const imageUrl = result.rows[0].image;
    const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];

    // Delete from Cloudinary
    cloudinary.uploader.destroy(`4k_vision/${publicId}`, (err) => {
      if (err) console.warn("Cloudinary deletion failed:", err.message);

      // Delete from DB
      db.query("DELETE FROM home WHERE id=$1", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Record deleted successfully" });
      });
    });
  });
};

// ====================== TRUNCATE HOME ======================
export const truncateHome = (req, res) => {
  db.query("SELECT image FROM home", async (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const images = result.rows.map((row) => row.image.split("/").slice(-1)[0].split(".")[0]);

    try {
      await Promise.all(images.map((publicId) => cloudinary.uploader.destroy(`4k_vision/${publicId}`)));

      db.query("TRUNCATE TABLE home", (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "All records and images deleted successfully" });
      });
    } catch (error) {
      console.warn("Some Cloudinary deletions failed:", error);
      res.status(500).json({ error: "Failed to delete all images" });
    }
  });
};

export {
  getHome,
  createHome,
  updateHome,
  deleteHome,
  truncateHome,
};

