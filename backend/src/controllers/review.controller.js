import prisma from "../utils/prisma.js";

// POST /api/reviews/:productId — authenticated user submits a review
export const addReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = Number(req.params.productId);
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if user has ordered and received this product
    const hasOrdered = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, paymentStatus: "PAID" },
      },
    });
    if (!hasOrdered) {
      return res.status(403).json({ message: "You can only review products you have purchased" });
    }

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId, productId } },
      update: { rating: Number(rating), comment: comment?.trim() || null },
      create: { userId, productId, rating: Number(rating), comment: comment?.trim() || null },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("ADD REVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

// GET /api/reviews/:productId — public
export const getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const avg = reviews.length
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    res.json({ reviews, averageRating: avg, total: reviews.length });
  } catch (err) {
    console.error("GET REVIEWS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// DELETE /api/reviews/:reviewId — owner of review or admin
export const deleteReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.userId;
    const isAdmin = req.user.role === "ADMIN";

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!isAdmin && review.userId !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error("DELETE REVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
};
