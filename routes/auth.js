import express from "express"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"


import  { getHome, deleteHome, updateHome, createHome, truncateHome} from "../controllerrs/homeController.js"
import { createProducts, deleteProducts, getProducts, truncateProducts, updateProducts } from "../controllerrs/productControllers.js"
import { createShowcase, deleteShowcase, getShowcase, truncateshowCase, updateShowcase } from "../controllerrs/showController.js"
import { createMission, deleteMission, getMission, updateMission } from "../controllerrs/missionController.js"
import { createInternship, deleteInternship, getInternship, updateInternship } from "../controllerrs/InternshipController.js"
import { createValues, deleteValues, getValues, updateValues } from "../controllerrs/valuesController.js"
import { createCategory, deleteCategory, getCategory, updateCategory } from "../controllerrs/category.js"
import { createteam, deleteteam, getteam, updateteam } from "../controllerrs/teamController.js"
import { createcustomer, deletecustomer, getcustomer, updatecustomer } from "../controllerrs/customerController.js"
import { checkAdmin, createAccount, loginAccount, unlockAdmin } from "../controllerrs/adminController.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup multer storage



const homeCard=express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // store in 'uploads/' folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

homeCard.post("/add",upload.array("images"),createHome)
homeCard.get("/read",getHome)
homeCard.delete("/delete/:id",deleteHome)
homeCard.put("/update/:id",updateHome)
homeCard.delete("/truncate",truncateHome)

const productCard=express.Router()
productCard.post("/add",upload.array("images"),createProducts)
productCard.get("/read",getProducts)
productCard.delete("/delete/:id",deleteProducts)
productCard.delete("/truncate",truncateProducts)
productCard.put("/update/:id",updateProducts)


const showcaseCard=express.Router()
showcaseCard.post("/add",upload.array("images"),createShowcase)
showcaseCard.get("/read",getShowcase)
showcaseCard.delete("/delete/:id",deleteShowcase)
showcaseCard.put("/update/:id",updateShowcase)
showcaseCard.delete("/truncate",truncateshowCase)

const missionCard=express.Router()
missionCard.post("/add",upload.array("images"),createMission)
missionCard.get("/read",getMission)
missionCard.delete("/delete/:id",deleteMission)
missionCard.put("/update/:id",updateMission)

const internshipCard=express.Router()
internshipCard.post("/add",upload.array("icon"),createInternship)
internshipCard.get("/read",getInternship)
internshipCard.delete("/delete/:id",deleteInternship)
internshipCard.put("/update/:id",updateInternship)

const valuesCard=express.Router()
valuesCard.post("/add",upload.array("images"),createValues)
valuesCard.get("/read",getValues)
valuesCard.delete("/delete/:id",deleteValues)
valuesCard.put("/update/:id",updateValues)

const categoryCard=express.Router()
categoryCard.post("/add",createCategory)
categoryCard.get("/read",getCategory)
categoryCard.delete("/delete/:id",deleteCategory)
categoryCard.put("/update/:cat_id",updateCategory)

const teamCard=express.Router()
teamCard.post("/add",upload.array("images"),createteam)
teamCard.get("/read",getteam)
teamCard.delete("/delete/:id",deleteteam)
teamCard.put("/update/:id",updateteam)

const customerCard=express.Router()
customerCard.post("/add",upload.array("images"),createcustomer)
customerCard.get("/read",getcustomer)
customerCard.delete("/delete/:id",deletecustomer)
customerCard.put("/update/:id",updatecustomer)

const userAdmin=express.Router()
userAdmin.post("/signup",createAccount)
userAdmin.post("/login",loginAccount)
userAdmin.post("/check",checkAdmin)
userAdmin.put("/unlock",unlockAdmin)
export {homeCard,productCard,showcaseCard,missionCard,internshipCard,valuesCard,categoryCard,teamCard,customerCard,userAdmin}


