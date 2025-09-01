import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";

// Get all home items
const getteam = (req, res) => {
    const sql = "SELECT * FROM team ";
    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result.rows);
        }
    });
};

// Create new home item
const createteam = async(req, res) => {
    const {role} = req.body;
    const files=req.files
    if(!files || files.length === 0){
        return res.status(400).json({ error: "No files provided" });
    }
    // const values=files.map((file)=>{
    //     const images=file.filename;
    //     const originalName=file.originalname;
    //     const team_member=originalName.substring(0,originalName.lastIndexOf(".")) || originalName;
    //     return [images,team_member,role];
    // })

     const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.path, {
        folder: "4k_vision", // Cloudinary folder name
        use_filename: true,
        unique_filename: false,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    // Prepare values for DB insert
    const values = uploadResults.map((result, index) => {
      const originalName = files[index].originalname;
      const team_member =
        originalName.substring(0, originalName.lastIndexOf(".")) ||
        originalName;

      return [result.secure_url, team_member, role || ""];
    });

    const placeholders = values.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const sql = `INSERT INTO team (image, team_member, role) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    db.query(sql, flatValues, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: "Team member created successfully", count: result.rowCount });
        }
    });
};

// Update home item
const updateteam = (req, res) => {
    const { id } = req.params;
    const { role} = req.body;
    const sql = "UPDATE team SET role = $1 WHERE id = $2";
    db.query(sql, [role, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.rowCount === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({ id: id, ...req.body });
        }
    });
};

// Delete home item
const deleteteam = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM team WHERE id = $1";
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

export { getteam, createteam, updateteam, deleteteam };
