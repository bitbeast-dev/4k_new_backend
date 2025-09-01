import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";

// Get all mission items
const getMission = (req, res) => {
    const sql = "SELECT * FROM mission ORDER BY created_at DESC";
    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result.rows);
        }
    });
};

// Create new mission item
const createMission = async (req, res) => {
  const { title, description } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "Image is required" });
  }

  try {
    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "4k_vision",
        use_filename: true,
        unique_filename: false,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const fileTitle =
        originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

      return [fileTitle, description || "", result.secure_url];
    });

    const placeholders = values.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const sql = `INSERT INTO mission (title_of_section, description, image) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    db.query(sql, flatValues, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Mission created successfully", count: result.rowCount });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};

// Update mission item
const updateMission = (req, res) => {
    const { id } = req.params;
    const { image, description } = req.body;
    const sql = "UPDATE mission SET image = $1, description = $2 WHERE id = $3";
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

// Delete mission item
const deleteMission = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM mission WHERE id = $1";
    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.rowCount === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({message:"data successfully deleted"});
        }
    });
};

export { getMission, createMission, updateMission, deleteMission };
