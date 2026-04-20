import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { addReview, getProductReviews, deleteReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/:productId", getProductReviews);
router.post("/:productId", protect, addReview);
router.delete("/:reviewId/delete", protect, deleteReview);

export default router;
