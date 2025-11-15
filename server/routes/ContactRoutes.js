/**
 * Contact-related API routes
 */
import { Router } from "express";
import { verifyToken } from "../middlewares/AuthMiddle.js";
import {
  SearchContacts,
  getContactsForDMList,
  getAllContacts,
} from "../controllers/ContactsController.js";

/**
 * Contact-related API routes
 */

const contactsRoutes = Router();

// Search contacts (protected)
contactsRoutes.post("/search", verifyToken, SearchContacts);

// Get recent DM contacts (protected) - ✅ Changed from POST to GET
contactsRoutes.get("/get-contacts-for-dm", verifyToken, getContactsForDMList);

// Get all contacts (protected)
contactsRoutes.get("/all", verifyToken, getAllContacts);

export default contactsRoutes;

