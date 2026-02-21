import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Heart, ShoppingCart, Check, Loader2 } from "lucide-react";

import { useWishlist } from "../hooks/useWishlist";
import ProductFeatures from "../components/ProductFeatures";
import RelatedProducts from "../components/RelatedProducts";
import { api } from "../services/api";

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
  const [added, setAdded] = useState(false);
  const [wishAnimating, setWishAnimating] = useState(false);

  const { add, remove, isInWishlist } = useWishlist();

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setActiveImage(res.data.images[0]);
      })
      .catch(() => toast.error("Product not found"));
  }, [id]);

  if (!product) return <p className="p-6">Loading...</p>;

  const wished = isInWishlist(product.id);

  const addToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Please login to add items to cart");
      return;
    }

    try {
      setAdding(true);
      await api.post("/cart", { productId: product.id, quantity: 1 });
      setAdded(true);
      toast.success("Added to cart");
      setTimeout(() => setAdded(false), 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please login to use wishlist");
      return;
    }

    setWishAnimating(true);

    try {
      if (wished) {
        await remove(product.id);
        toast("Removed from wishlist");
      } else {
        await add(product.id);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Wishlist action failed");
    }

    setTimeout(() => setWishAnimating(false), 400);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
        <div>
          <img src={activeImage!} className="w-full h-[420px] object-cover rounded" alt={product.title} />

          <div className="flex gap-3 mt-5">
            {product.images.map((img) => (
              <img
                key={img}
                src={img}
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 object-cover rounded cursor-pointer border ${
                  activeImage === img ? "border-black" : "border-gray-200"
                }`}
                alt={product.title}
              />
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-[28px] leading-snug font-serif font-medium">{product.title}</h1>

          <p className="mt-2 text-sm tracking-wide text-gray-500">
            {product.category}
            {product.subCategory && ` / ${product.subCategory}`}
          </p>

          <p className="mt-6 text-2xl font-semibold">Rs {product.discountPrice ?? product.price}</p>

          {product.description && <p className="mt-6 text-[15px] leading-relaxed text-gray-700">{product.description}</p>}

          <div className="mt-10 flex gap-4">
            <button
              onClick={addToCart}
              disabled={adding}
              className={`group relative flex-1 py-3 rounded text-sm tracking-wide font-medium transition-all duration-300 active:scale-95 ${
                added ? "bg-green-600 text-white" : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Adding...
                </span>
              ) : added ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} />
                  Added
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  Add to cart
                </span>
              )}
            </button>

            <button
              onClick={toggleWishlist}
              className={`group flex-1 py-3 rounded border text-sm tracking-wide font-medium transition-all duration-300 active:scale-95 ${
                wished ? "border-red-500 text-red-600" : "border-black text-black"
              }`}
            >
              <span className={`flex items-center justify-center gap-2 ${wishAnimating ? "animate-pulse" : ""}`}>
                <Heart size={16} className={wished ? "fill-red-500" : ""} />
                {wished ? "Wishlisted" : "Add to wishlist"}
              </span>
            </button>
          </div>

          <ProductFeatures />
        </div>
      </div>

      <RelatedProducts subCategory={product.subCategory} currentProductId={product.id} />
    </div>
  );
}