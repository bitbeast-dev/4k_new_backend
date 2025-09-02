import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";
import streamifier from "streamifier";

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "4k_vision/team",
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

// Get all team members
const getTeam = (req, res) => {
  const sql = "SELECT * FROM team ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result.rows);
  });
};

// Create new team member(s)
const createTeam = async (req, res) => {
  try {
    const { role } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    // Upload using buffer
    const uploadResults = await Promise.all(
      files.map((file) => uploadToCloudinary(file))
    );

    // Prepare values for DB insert
    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const team_member =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;
      return [result.secure_url, team_member, role || ""];
    });

    const placeholders = values
      .map(
        (_, index) =>
          `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
      )
      .join(", ");
    const sql = `INSERT INTO team (image, team_member, role) VALUES ${placeholders}`;
    const flatValues = values.flat();

    db.query(sql, flatValues, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "Team member(s) created successfully",
        count: result.rowCount,
      });
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ error: "Failed to upload team images" });
  }
};

// Update team member role
const updateTeam = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const sql = "UPDATE team SET role = $1 WHERE id = $2";
  db.query(sql, [role, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Team member updated successfully", id, role });
  });
};

// Delete team member
const deleteTeam = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM team WHERE id = $1";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Team member deleted successfully" });
  });
};

// Truncate team table (delete all members)
const truncateTeam = (req, res) => {
  const sql = "TRUNCATE TABLE team";
  db.query(sql, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All team members deleted successfully" });
  });
};

export { getTeam, createTeam, updateTeam, deleteTeam, truncateTeam };
