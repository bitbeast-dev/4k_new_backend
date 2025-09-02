import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { 
  getHome, deleteHome, updateHome, createHome, truncateHome 
} from "../controllerrs/homeController.js";
import { 
  createProducts, deleteProducts, getProducts, truncateProducts, updateProducts 
} from "../controllerrs/productControllers.js";
import { 
  createShowcase, deleteShowcase, getShowcase,  truncateShowcase, updateShowcase 
} from "../controllerrs/showController.js";
import { 
  createMission, deleteMission, getMission, updateMission 
} from "../controllerrs/missionController.js";
import { 
  createInternship, deleteInternship, getInternship, updateInternship 
} from "../controllerrs/InternshipController.js";
import { 
  createValues, deleteValues, getValues, updateValues 
} from "../controllerrs/valuesController.js";
import { 
  createCategory, deleteCategory, getCategory, updateCategory 
} from "../controllerrs/category.js";
import { 
  createTeam, deleTeteam, getTeam, updateTeam 
} from "../controllerrs/teamController.js";
import { 
  createcustomer, deletecustomer, getcustomer, updatecustomer 
} from "../controllerrs/customerController.js";
import { 
  checkAdmin, createAccount, loginAccount, unlockAdmin 
} from "../controllerrs/adminController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Multer memory storage for Cloudinary uploads ----------
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ 
  storage: memoryStorage, 
  limits: { fileSize: 50 * 1024 * 1024, files: 20 } 
});

// ---------- Routers ----------

// Home
const homeCard = express.Router();
homeCard.post("/add", uploadMemory.array("images"), createHome);
homeCard.put("/update/:id", uploadMemory.array("images"), updateHome);
homeCard.get("/read", getHome);
homeCard.delete("/delete/:id", deleteHome);
homeCard.delete("/truncate", truncateHome);

// Products
const productCard = express.Router();
productCard.post("/add", uploadMemory.array("images"), createProducts);
productCard.put("/update/:id", uploadMemory.array("images"), updateProducts);
productCard.get("/read", getProducts);
productCard.delete("/delete/:id", deleteProducts);
productCard.delete("/truncate", truncateProducts);

// Showcase
const showcaseCard = express.Router();
showcaseCard.post("/add", uploadMemory.array("images"), createShowcase);
showcaseCard.put("/update/:id", uploadMemory.array("images"), updateShowcase);
showcaseCard.get("/read", getShowcase);
showcaseCard.delete("/delete/:id", deleteShowcase);
showcaseCard.delete("/truncate",  truncateShowcase);

// Mission
const missionCard = express.Router();
missionCard.post("/add", uploadMemory.array("images"), createMission);
missionCard.put("/update/:id", uploadMemory.array("images"), updateMission);
missionCard.get("/read", getMission);
missionCard.delete("/delete/:id", deleteMission);

// Internship (icon field)
const internshipCard = express.Router();
internshipCard.post("/add", uploadMemory.array("icon"), createInternship);
internshipCard.put("/update/:id", uploadMemory.array("icon"), updateInternship);
internshipCard.get("/read", getInternship);
internshipCard.delete("/delete/:id", deleteInternship);

// Values
const valuesCard = express.Router();
valuesCard.post("/add", uploadMemory.array("images"), createValues);
valuesCard.put("/update/:id", uploadMemory.array("images"), updateValues);
valuesCard.get("/read", getValues);
valuesCard.delete("/delete/:id", deleteValues);

// Category (no file upload)
const categoryCard = express.Router();
categoryCard.post("/add", createCategory);
categoryCard.put("/update/:cat_id", updateCategory);
categoryCard.get("/read", getCategory);
categoryCard.delete("/delete/:id", deleteCategory);

// Team
const teamCard = express.Router();
teamCard.post("/add", uploadMemory.array("images"), createteam);
teamCard.put("/update/:id", uploadMemory.array("images"), updateteam);
teamCard.get("/read", getteam);
teamCard.delete("/delete/:id", deleteteam);

// Customer
const customerCard = express.Router();
customerCard.post("/add", uploadMemory.array("images"), createcustomer);
customerCard.put("/update/:id", uploadMemory.array("images"), updatecustomer);
customerCard.get("/read", getcustomer);
customerCard.delete("/delete/:id", deletecustomer);

// Admin / Users
const userAdmin = express.Router();
userAdmin.post("/signup", createAccount);
userAdmin.post("/login", loginAccount);
userAdmin.post("/check", checkAdmin);
userAdmin.put("/unlock", unlockAdmin);

// ---------- Export all routers ----------
export {
  homeCard,
  productCard,
  showcaseCard,
  missionCard,
  internshipCard,
  valuesCard,
  categoryCard,
  teamCard,
  customerCard,
  userAdmin
};
