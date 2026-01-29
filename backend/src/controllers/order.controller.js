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
      amount: Math.round(totalAmount * 100), // amount in paise
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

    /* ===== PREVENT DUPLICATE PAYMENT ===== */
    const existingOrder = await prisma.order.findFirst({
      where: { razorpayPaymentId: razorpay_payment_id },
    });

    if (existingOrder) {
      return res.json({
        message: "Order already processed",
        orderId: existingOrder.id,
      });
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

    /* ===== STOCK CHECK ===== */
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product.title}`,
        });
      }
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    /* ===== TRANSACTION ===== */
    const order = await prisma.$transaction(async (tx) => {
      /* CREATE ORDER */
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentStatus: "PAID",
          orderStatus: "PENDING",
          paidAt: new Date(),

          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,

          address,
        },
      });

      /* CREATE ORDER ITEMS + DECREASE STOCK */
      for (const item of cart.items) {
        const price = item.product.discountPrice ?? item.product.price;

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price,
          },
        });

        // 🔥 DECREASE STOCK
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      /* CLEAR CART */
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
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
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


/* ================= RETURN REQUESY */
/* ================= REQUEST RETURN (USER) ================= */
export const requestReturn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "DELIVERED") {
      return res
        .status(400)
        .json({ message: "Return allowed only after delivery" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "RETURN_REQUESTED",
      },
    });

    res.json({ message: "Return request submitted" });
  } catch (err) {
    console.error("RETURN REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to request return" });
  }
};