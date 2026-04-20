import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Heart, ShoppingCart, Check, Loader2, Star, X } from "lucide-react";

import { useWishlist } from "../hooks/useWishlist";
import ProductFeatures from "../components/ProductFeatures";
import { api } from "../services/api";

type Product = {
  id: number;
  title: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
};

type RelatedProduct = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
};

type Review = {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { id: number; name: string };
};

function StarRow({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={`${s <= value ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d9dfd8]"} ${onChange ? "cursor-pointer transition hover:fill-[#f59e0b] hover:text-[#f59e0b]" : ""}`}
          onClick={() => onChange?.(s)}
        />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishAnimating, setWishAnimating] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const { add, remove, isInWishlist } = useWishlist();
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const fetchReviews = async (productId: string) => {
    try {
      const res = await api.get(`/reviews/${productId}`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.averageRating || 0);
    } catch {
      // reviews are non-critical
    }
  };

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setActiveImage(res.data.images[0]);
      })
      .catch(() => toast.error("Product not found"));

    if (id) {
      fetchReviews(id);
      api
        .get(`/products/catalog?limit=4&sort=newest`)
        .then((res) => {
          const all: RelatedProduct[] = res.data.products ?? res.data ?? [];
          setRelated(all.filter((p) => String(p.id) !== id).slice(0, 4));
        })
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!product) return <p className="premium-page text-[#5f6568]">Loading...</p>;

  const wished = isInWishlist(product.id);
  const inStock = product.stock > 0;

  const addToCart = async () => {
    if (!isLoggedIn) { toast.warning("Please login to add items to cart"); return; }
    if (!inStock) return;
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
    if (!isLoggedIn) { toast.info("Please login to use wishlist"); return; }
    setWishAnimating(true);
    try {
      if (wished) { await remove(product.id); toast("Removed from wishlist"); }
      else { await add(product.id); toast.success("Added to wishlist"); }
    } catch { toast.error("Wishlist action failed"); }
    setTimeout(() => setWishAnimating(false), 400);
  };

  const submitReview = async () => {
    if (!myRating) { toast.error("Please select a rating"); return; }
    try {
      setSubmittingReview(true);
      await api.post(`/reviews/${product.id}`, { rating: myRating, comment: myComment.trim() || undefined });
      toast.success("Review submitted!");
      setMyRating(0);
      setMyComment("");
      if (id) fetchReviews(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="premium-page">
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X size={22} />
          </button>
          <img
            src={activeImage!}
            alt={product.title}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="premium-shell">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-14">
          <div>
            <div className="relative">
              <img
                src={activeImage!}
                className="h-[320px] w-full cursor-zoom-in rounded-lg border border-black/10 object-cover shadow-[0_24px_60px_-42px_rgba(26,38,31,0.62)] sm:h-[420px]"
                alt={product.title}
                onClick={() => setLightbox(true)}
              />
              <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                Click to zoom
              </span>
            </div>

            <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <img
                  key={img}
                  src={img}
                  onClick={() => setActiveImage(img)}
                  className={`h-20 w-20 cursor-pointer rounded-lg border object-cover transition ${
                    activeImage === img ? "border-[#287a55] ring-2 ring-[#287a55]/15" : "border-[#d9dfd8]"
                  }`}
                  alt={product.title}
                />
              ))}
            </div>
          </div>

          <div className="premium-card p-6 md:p-8">
            <p className="premium-kicker">Artisan Chocolate</p>
            <h1 className="mt-2 text-[28px] font-serif font-medium leading-tight text-[#202326] md:text-4xl">
              {product.title}
            </h1>

            {reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <StarRow value={Math.round(avgRating)} size={14} />
                <span className="text-sm text-[#5f6568]">{avgRating} ({reviews.length} reviews)</span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <p className="text-3xl font-semibold text-[#202326]">
                Rs {product.discountPrice ?? product.price}
              </p>
              {product.discountPrice && product.discountPrice < product.price && (
                <p className="text-lg text-[#8b9290] line-through">Rs {product.price}</p>
              )}
            </div>

            <div className="mt-2">
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2ee] px-3 py-1 text-[11px] font-semibold text-[#287a55]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#287a55]" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Out of Stock
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-6 text-[15px] leading-relaxed text-[#5f6568]">{product.description}</p>
            )}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={addToCart}
                disabled={adding || !inStock}
                className={`group relative flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                  added ? "bg-[#7abf36] text-white" : "premium-button"
                }`}
              >
                {adding ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} />Adding...</span>
                ) : added ? (
                  <span className="flex items-center justify-center gap-2"><Check size={16} />Added</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><ShoppingCart size={16} />{inStock ? "Add to cart" : "Out of Stock"}</span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleWishlist}
                className={`group flex-1 rounded-lg border py-3 text-sm font-semibold transition-all duration-300 active:scale-95 ${
                  wished ? "border-[#287a55] bg-[#edf2ee] text-[#287a55]" : "border-[#202326] text-[#202326]"
                }`}
              >
                <span className={`flex items-center justify-center gap-2 ${wishAnimating ? "animate-pulse" : ""}`}>
                  <Heart size={16} className={wished ? "fill-[#287a55]" : ""} />
                  {wished ? "Wishlisted" : "Add to wishlist"}
                </span>
              </button>
            </div>

            <ProductFeatures />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-serif font-medium text-[#202326]">Customer Reviews</h2>
          <div className="mx-auto mt-3 h-[2px] w-12 bg-gray-300" />

          {reviews.length === 0 ? (
            <p className="mt-6 text-[#8b9290]">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-[#d9dfd8] bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#202326]">{review.user.name}</p>
                      <StarRow value={review.rating} size={13} />
                    </div>
                    <p className="shrink-0 text-[11px] text-[#8b9290]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm text-[#5f6568] leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {isLoggedIn && (
            <div className="mt-10 rounded-lg border border-[#d9dfd8] bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-[#202326]">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[#202326]">Your Rating *</p>
                  <StarRow value={myRating} onChange={setMyRating} size={28} />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium text-[#202326]">Comment (optional)</p>
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    className="w-full rounded-lg border border-[#d9dfd8] bg-[#f6f7f4] px-4 py-3 text-sm text-[#202326] outline-none ring-[#287a55] transition focus:ring"
                  />
                </div>
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submittingReview || !myRating}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#287a55] px-6 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:opacity-50"
                >
                  {submittingReview ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Review"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-serif font-medium text-[#202326]">You May Also Like</h2>
            <div className="mx-auto mt-3 h-[2px] w-12 bg-gray-300" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="group rounded-xl border border-[#d9dfd8] bg-white text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="overflow-hidden rounded-t-xl">
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-[#202326] line-clamp-2 leading-snug">{p.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-base font-semibold text-[#202326]">
                        Rs {p.discountPrice ?? p.price}
                      </span>
                      {p.discountPrice && p.discountPrice < p.price && (
                        <span className="text-sm text-[#8b9290] line-through">Rs {p.price}</span>
                      )}
                    </div>
                    {p.stock === 0 && (
                      <span className="mt-1 inline-block text-xs text-red-400">Out of stock</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
