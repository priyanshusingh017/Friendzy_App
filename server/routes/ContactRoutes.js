/**
 * Contact-related API routes
 */
import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import { getAllContacts, getContactsForDMList, SearchContacts } from "../controllers/ContactsController.js";

const contactRoutes = Router();

// Search contacts (protected)
contactRoutes.post("/search", verifyToken, SearchContacts);

// Get recent DM contacts (protected)
contactRoutes.post("/get-contacts-for-dm", verifyToken, getContactsForDMList);

// Get all contacts except current user (protected)
contactRoutes.get("/all", verifyToken, getAllContacts);

export default contactRoutes; 

