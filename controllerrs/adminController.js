import db from "../config/db.js";
import bcrypt from "bcrypt";

// Create Admin Account
const createAccount = async (req, res) => {
    const { firstname, lastname, email, password, accesscode } = req.body;

    // Check if an admin already exists
    const checkSql = "SELECT COUNT(*) AS count FROM admin";
    db.query(checkSql, async (err, result) => {
        if (err) throw err;

        if (result.rows[0].count > 0) {
            return res.status(400).json({ message: "Admin account already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new admin
        const sql = "INSERT INTO admin(fname, lname, email, password, access_code) VALUES ($1,$2,$3,$4,$5)";
        db.query(sql, [firstname, lastname, email, hashedPassword, accesscode], (err, result) => {
            if (err) throw err;
            res.status(200).json({ message: "Admin account successfully created", data: result });
        });
    });
};

// Login Admin Account with lock check
const loginAccount = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM admin WHERE email = $1", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.rows.length === 0) return res.status(404).json({ message: "Admin not found" });

    const admin = results.rows[0];

    // Check if account is locked
    if (admin.is_locked) {
      return res.status(403).json({ message: "Account is locked" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      // Lock account after wrong attempt
      db.query("UPDATE admin SET is_locked = true WHERE email = $1", [email], (err2, result) => {
        if (err2) console.error(err2);
        console.log("Lock result:", result);
      });
      return res.status(401).json({ message: "Incorrect password! Account locked." });
    }

    res.status(200).json({ message: "Login successful", data: admin });
  });
};



// Check if Admin Exists (for disabling register form)
const checkAdmin = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const sql = "SELECT * FROM admin WHERE email = $1";

    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Server error" });
        }

        if (results.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const admin = results.rows[0];

        // Check if account is locked
        if (admin.is_locked) {
            return res.status(403).json({ message: "Account is locked due to failed login attempts" });
        }

        try {
            const match = await bcrypt.compare(password, admin.password);

            if (!match) {
                // Optional: lock the account immediately after 1 wrong attempt
                const lockSql = "UPDATE admin SET is_locked = true WHERE id = $1";
                db.query(lockSql, [admin.id], (lockErr) => {
                    if (lockErr) console.error("Error locking admin:", lockErr);
                });

                return res.status(401).json({ message: "Invalid email or password. Account is now locked." });
            }

            // Success: omit password from response
            const { password: _, ...adminData } = admin; // rename to avoid redeclaration
            res.status(200).json({ message: "Login successful", data: adminData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    });
};



const unlockAdmin = (req, res) => {
  const { email, password } = req.body;

  // Step 1: Find admin by email
  const findSql = "SELECT * FROM admin WHERE email = $1";
  db.query(findSql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.rows.length === 0) return res.status(404).json({ message: "Admin not found" });

    const admin = results.rows[0];

    // Step 2: Compare password
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Incorrect password" });

    // Step 3: Unlock account
    const unlockSql = "UPDATE admin SET is_locked = false WHERE email = $1";
    db.query(unlockSql, [email], (err2, result) => {
      if (err2) return res.status(500).json({ message: "Server error" });
      res.status(200).json({ message: "Account unlocked successfully", data: result });
    });
  });
};



export { createAccount, loginAccount, checkAdmin,unlockAdmin };
