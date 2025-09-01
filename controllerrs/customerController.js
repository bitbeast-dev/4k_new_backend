import db from "../config/db.js";
import cloudinary from "../cloudinary/cloud.js";

// Get all home items
const getcustomer = (req, res) => {
    const sql = "SELECT * FROM partner";
    db.query(sql, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result.rows);
        }
    });
};

// Create new home item
const createcustomer =async (req, res) => {
    const {description} = req.body;
    const files=req.files
    if(!files){
        console.log("No data found")
    }



    // const values=files.map((file)=>{
    //     const images=file.filename;
    //     const originalName=file.originalname;
    //     const title_name=originalName.substring(0,originalName.lastIndexOf(".")) || originalName;
    //     return [images,title_name,description];
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
    const sql = `INSERT INTO partner (title_name, description, image) VALUES ${placeholders}`;
    const flatValues = values.flat();
    
    db.query(sql, flatValues, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ message: "Partners created successfully", count: result.rowCount });
        }
    });
};

// Update home item
const updatecustomer = (req, res) => {
    const { id } = req.params;
    const { description} = req.body;
    const sql = "UPDATE partner SET description = $1 WHERE id = $2";
    db.query(sql, [description, id], (err, result) => {
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
const deletecustomer = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM partner WHERE id = $1";
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

export { getcustomer, createcustomer, updatecustomer, deletecustomer };
