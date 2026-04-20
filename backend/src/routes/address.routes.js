import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "../controllers/address.controller.js";

const router = express.Router();

router.get("/", protect, getAddresses);
router.post("/", protect, createAddress);
router.put("/:id", protect, updateAddress);
router.delete("/:id", protect, deleteAddress);
router.patch("/:id/default", protect, setDefaultAddress);

export default router;
