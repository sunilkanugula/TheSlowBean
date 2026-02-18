import { useEffect, useState } from "react";
import axios from "axios";
import { Heart, Repeat, Eye, ShoppingCart, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useWishlist } from "../hooks/useWishlist";
import ProductsHero from "../components/products/ProductsHero";


const PRODUCTS_API = "http://localhost:5000/api/products";
const CART_API = "http://localhost:5000/api/cart";
const TOKEN_KEY = "token";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const { add, remove, isInWishlist } = useWishlist();
  const location = useLocation();

  /* =======================
     FETCH PRODUCTS
  ======================= */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");

    const url = search
      ? `${PRODUCTS_API}?search=${encodeURIComponent(search)}`
      : PRODUCTS_API;

    axios
      .get(url)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("PRODUCT FETCH ERROR:", err));
  }, [location.search]);

  /* =======================
        ADD TO CART
  ======================= */
  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        alert("Please login to add items to cart");
        return;
      }

      await axios.post(
        CART_API,
        { productId, quantity: 1 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 1200);
    } catch (err: any) {
      console.error("ADD TO CART FAILED:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to add to cart");
    }
  };

  /* =======================
          BUY NOW
  ======================= */
  const handleQuickBuy = (productId: number) => {
    window.location.href = `/checkout?productId=${productId}&qty=1`;
  };

  if (!products.length) return null;

  return (
     <>
    <ProductsHero />
    <section className="py-20 bg-[#EAF2E8]">
      <div className="w-full px-4 md:px-6">
        

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product) => {
            const liked = isInWishlist(product.id);
            const isAdded = addedToCart === product.id;

            const discountPercent =
              product.discountPrice
                ? Math.round(
                    ((product.price - product.discountPrice) /
                      product.price) *
                      100
                  )
                : null;

            return (
              <div
                key={product.id}
                className="group flex flex-col rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* IMAGE */}
                <div className="relative overflow-hidden h-[300px]">
                  <Link to={`/products/${product.id}`}>
                    <img
                      src={product.images?.[0] || "/placeholder.png"}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* DISCOUNT BADGE (Exact Style) */}
                  {discountPercent && (
                    <div className="absolute top-0 left-0 bg-[#C8B5A4] text-white text-[13px] font-semibold px-5 py-2 rounded-br-[28px]">
                      -{discountPercent}%
                    </div>
                  )}

                  {/* Slight dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-300" />

                  {/* CENTER ICON OVERLAY */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <div className="flex items-center gap-8 bg-white px-7 py-3 rounded-2xl shadow-xl">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          liked ? remove(product.id) : add(product.id);
                        }}
                        className="text-[#2E5E3E] hover:scale-110 transition"
                      >
                        <Heart
                          size={20}
                          className={
                            liked ? "fill-[#2E5E3E] text-[#2E5E3E]" : ""
                          }
                        />
                      </button>

                      <button className="text-[#2E5E3E] hover:scale-110 transition">
                        <Repeat size={20} />
                      </button>

                      <button className="text-[#2E5E3E] hover:scale-110 transition">
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="px-5 py-5">
                  {/* <p className="text-sm text-green-700 font-medium mb-1">
                    Brand Name
                  </p> */}

                  <h3 className="text-[15px] font-semibold line-clamp-2 text-gray-800">
                    {product.title}
                  </h3>

                  <div className="mt-4 flex items-center gap-3">
                    {product.discountPrice ? (
                      <>
                        <span className="text-green-700 font-bold text-lg">
                          ₹{product.discountPrice}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{product.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-green-700 font-bold text-lg">
                       Rs ₹{product.price}
                      </span>
                    )}
                  </div>

                  {/* ADD TO CART BUTTON */}
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="mt-5 w-full bg-green-700 text-white py-3 rounded-xl font-medium hover:bg-green-800 transition"
                  >
                    {isAdded ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check size={18} /> Added
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ShoppingCart size={18} /> Add To Cart
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
     </>
  );
}
