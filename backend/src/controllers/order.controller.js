import prisma from "../utils/prisma.js";

/* ================= CHECKOUT ================= */
export const checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { paymentType } = req.body; // ✅ COD | ONLINE

    if (!paymentType) {
      return res.status(400).json({ message: "Payment type required" });
    }

    // 1. Get cart
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

    // 2. Calculate total
    const totalAmount = cart.items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    // 3. Create order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: "pending",
        paymentType,
        paymentCompleted: false,
      },
    });

    // 4. Create order items ✅
    for (const item of cart.items) {
      const price = item.product.discountPrice ?? item.product.price;

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price, // UNIT PRICE ONLY
        },
      });
    }

    // 5. Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({
      message: "Order placed successfully",
      orderId: order.id,
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    res.status(500).json({ message: "Checkout failed" });
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
  } catch {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ================= PAYMENT COMPLETION ================= */
export const markPaymentCompleted = async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentCompleted: true,
        paidAt: new Date(),
      },
    });

    res.json({ message: "Payment marked as completed" });
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ message: "Failed to mark payment" });
  }
};
