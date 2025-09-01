import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";

// Get all showcase items
const getShowcase = (req, res) => {
    const sql = "SELECT * FROM showcase ORDER BY created_at DESC";
    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result.rows);
        }
    });
};

// Create new showcase item
const createShowcase = async (req, res) => {
    const {description } = req.body;
    const files=req.files;

     if(!files || files.length === 0){
        return res.status(400).json({ error: "No files provided" });
    }

    // const values=files.map((file)=>{
    //     const image=file.filename
    //     const originalName=file.origilname
    //      const title=originalName.substring(0,originalName.lastIndexOf(".")) || originalName;
    //      return [image,title,description]
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
         const title =
           originalName.substring(0, originalName.lastIndexOf(".")) ||
           originalName;
   
         return [title, description || "", result.secure_url];
       });
   
    
    
    const placeholders = values.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const sql = `INSERT INTO showcase (title, description, image) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    db.query(sql, flatValues, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: "Showcase created successfully", count: result.rowCount });
        }
    });
};

// Update showcase item
const updateShowcase = (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const sql = "UPDATE showcase SET title = $1, description = $2 WHERE id = $3";
    db.query(sql, [title, description, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.rowCount === 0) {
            res.status(404).json({ error: "Record not found" });
        } else {
            res.json({ id: id, ...req.body });
        }
    });
};

// Delete showcase item
const deleteShowcase = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM showcase WHERE id = $1";
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


const truncateshowCase = (req, res) => {
  const sql = "TRUNCATE TABLE showcase";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "All showcase items successfully deleted" });
  });
};
export { getShowcase, createShowcase, updateShowcase, deleteShowcase ,truncateshowCase};
