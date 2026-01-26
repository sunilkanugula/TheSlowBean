import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useWishlist } from "../hooks/useWishlist";

const PRODUCT_API = "http://localhost:5000/api/products";
const CART_API = "http://localhost:5000/api/cart";

type Product = {
  id: number;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { add, remove, isInWishlist } = useWishlist();
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${PRODUCT_API}/${id}`)
      .then((res) => {
        setProduct(res.data);
        setActiveImage(res.data.images[0]);
      })
      .catch(() => setProduct(null));
  }, [id]);

  if (!product) {
    return <p className="p-6">Product not found.</p>;
  }

  const wished = isInWishlist(product.id);

  // ✅ ADD TO CART HANDLER
  const addToCart = async () => {
    if (!token) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      setAdding(true);

      await axios.post(
        CART_API,
        {
          productId: product.id,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Added to cart");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
      
      {/* Images */}
      <div>
        <img
          src={activeImage!}
          className="w-full h-96 object-cover rounded"
        />

        <div className="flex gap-3 mt-4">
          {product.images.map((img) => (
            <img
              key={img}
              src={img}
              onClick={() => setActiveImage(img)}
              className={`w-20 h-20 object-cover rounded cursor-pointer border ${
                activeImage === img ? "border-blue-600" : "border-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Details */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.title}</h1>

        <p className="text-gray-500 mb-2">
          {product.category}
          {product.subCategory && ` / ${product.subCategory}`}
        </p>

        <p className="text-2xl font-bold text-green-600 mb-4">
          ₹{product.discountPrice ?? product.price}
        </p>

        {product.description && (
          <p className="text-gray-700 mb-6">
            {product.description}
          </p>
        )}

        <p className="mb-6">
          <span className="font-semibold">Stock:</span>{" "}
          {product.stock > 0 ? product.stock : "Out of stock"}
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={addToCart}
            disabled={adding || product.stock === 0}
            className="w-full py-3 bg-blue-600 text-white rounded font-semibold disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          <button
            onClick={() =>
              wished ? remove(product.id) : add(product.id)
            }
            className={`w-full py-3 rounded font-semibold ${
              wished
                ? "bg-red-100 text-red-600"
                : "bg-black text-white"
            }`}
          >
            {wished ? "Remove Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
