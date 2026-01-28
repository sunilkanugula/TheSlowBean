import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center border rounded-xl p-6 shadow-sm">
        <CheckCircle size={64} className="mx-auto text-green-600" />

        <h1 className="text-2xl font-bold mt-4">
          Order Placed Successfully 🎉
        </h1>

        <p className="text-gray-600 mt-2">
          Thank you for shopping with us
        </p>

        <p className="mt-4 font-semibold">
          Order ID:{" "}
          <span className="text-green-600">#{orderId}</span>
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate("/orders")}
            className="w-full bg-black text-white py-2 rounded-lg font-semibold"
          >
            View My Orders
          </button>

          <button
            onClick={() => navigate("/products")}
            className="w-full border py-2 rounded-lg font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
