import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
import { homeCard, showcaseCard, productCard, missionCard, internshipCard, valuesCard, categoryCard, teamCard, customerCard, userAdmin } from './routes/auth.js';

// Use Routes
app.use('/home', homeCard);
app.use('/product', productCard);
app.use("/cat",categoryCard);
app.use('/show', showcaseCard);
app.use('/mission', missionCard);
app.use('/internship', internshipCard);
app.use('/values', valuesCard);
app.use("/team",teamCard)
app.use("/customer",customerCard)
app.use("/admin",userAdmin)

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running !");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
