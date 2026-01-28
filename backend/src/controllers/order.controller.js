import prisma from "../utils/prisma.js";
import razorpay from "../utils/razorpay.js";
import crypto from "crypto";

/* ================= CREATE RAZORPAY ORDER ================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.userId;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("RAZORPAY CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/* ================= VERIFY PAYMENT & CREATE ORDER ================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
    } = req.body;

    /* ===== VERIFY SIGNATURE ===== */
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    /* ===== CREATE ORDER ===== */
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED",
        paidAt: new Date(),
        address,
      },
    });

    /* ===== CREATE ORDER ITEMS ===== */
    for (const item of cart.items) {
      const price = item.product.discountPrice ?? item.product.price;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price,
        },
      });
    }

    /* ===== CLEAR CART ===== */
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      message: "Payment successful, order placed",
      orderId: order.id,
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Payment failed" });
  }
};

/* ================= GET MY ORDERS ================= */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};
