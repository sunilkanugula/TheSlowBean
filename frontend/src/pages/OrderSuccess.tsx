import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="premium-page flex items-center justify-center">
      <div className="premium-card w-full max-w-md p-8 text-center">
        <CheckCircle size={64} className="mx-auto text-[#287a55]" />

        <h1 className="mt-4 text-3xl font-bold text-[#202326]">
          Order Placed Successfully
        </h1>

        <p className="mt-2 text-[#5f6568]">
          Thank you for shopping with us.
        </p>

        <p className="mt-4 font-semibold text-[#202326]">
          Order ID: <span className="text-[#287a55]">#{id}</span>
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate("/orders")}
            className="premium-button w-full py-2.5"
          >
            View My Orders
          </button>

          <button
            onClick={() => navigate("/products")}
            className="premium-button-secondary w-full py-2.5"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
