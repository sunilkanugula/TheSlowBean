import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import ProductsHero from "../components/products/ProductsHero";
import { useWishlist } from "../hooks/useWishlist";
import { api } from "../services/api";

type Product = {
  id: number;
  title: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  isBestSelling?: boolean;
};

type CatalogResponse = {
  items: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: Record<string, never>;
};

const TOKEN_KEY = "token";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "title_asc", label: "Name: A to Z" },
  { value: "stock_desc", label: "Most In Stock" },
];

function numberParam(value: string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const { add, remove, isInWishlist } = useWishlist();
  const syncingFromUrlRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState<CatalogResponse["meta"]>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    syncingFromUrlRef.current = true;

    const params = new URLSearchParams(location.search);

    const urlSearch = params.get("search") || "";
    const urlSort = params.get("sort") || "newest";
    const urlMinPrice = params.get("minPrice") || "";
    const urlMaxPrice = params.get("maxPrice") || "";
    const urlInStock = params.get("inStock") === "true";
    const urlPage = Math.max(numberParam(params.get("page")) || 1, 1);

    setSearchDraft(urlSearch);
    setSearchTerm(urlSearch);
    setSort(urlSort);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setInStock(urlInStock);
    setPage(urlPage);
  }, [location.search]);

  useEffect(() => {
    if (syncingFromUrlRef.current) {
      syncingFromUrlRef.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    if (page > 1) params.set("page", String(page));

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith("?")
      ? location.search.slice(1)
      : location.search;

    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true }
      );
    }
  }, [
    inStock,
    location.pathname,
    location.search,
    maxPrice,
    minPrice,
    navigate,
    page,
    searchTerm,
    sort,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchCatalog() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<CatalogResponse>("/products/catalog", {
          params: {
            search: searchTerm || undefined,
            sort,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            inStock: inStock ? true : undefined,
            page,
            limit: 10,
          },
          signal: controller.signal,
        });

        setProducts(response.data.items);
        setMeta(response.data.meta);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return;
        }
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();

    return () => controller.abort();
  }, [inStock, maxPrice, minPrice, page, searchTerm, sort]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchDraft.trim());
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setSearchTerm("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setPage(1);
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        toast.info("Please login to add items to cart");
        return;
      }

      await api.post("/cart", { productId, quantity: 1 });

      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 1200);
      toast.success("Added to cart");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const pageNumbers = useMemo(() => {
    const totalPages = meta.totalPages || 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = Math.max(safePage - 2, 1);
    const end = Math.min(start + 4, totalPages);

    const numbers: number[] = [];
    for (let i = start; i <= end; i += 1) numbers.push(i);
    return numbers;
  }, [meta.totalPages, page]);

  return (
    <>
      <ProductsHero />

      <section className="bg-[radial-gradient(circle_at_20%_10%,#f6f7f4_0%,#eceeed_45%,#e7eeeb_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 overflow-hidden rounded-2xl border border-[#d9dfd8] bg-white shadow-[0_8px_40px_-12px_rgba(26,38,31,0.18)]">
            {/* Header strip */}
            <div className="flex items-center gap-2 border-b border-[#d9dfd8] bg-[#f6f7f4] px-5 py-3">
              <SlidersHorizontal size={15} className="text-[#287a55]" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6568]">Filter & Sort</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1 basis-52">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9290]"
                  size={15}
                />
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-xl border border-[#d9dfd8] bg-[#f6f7f4] pl-9 pr-3 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:bg-white focus:ring-2 focus:ring-[#287a55]/15"
                />
              </form>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="h-10 rounded-xl border border-[#d9dfd8] bg-[#f6f7f4] px-3 pr-8 text-sm text-[#202326] outline-none transition focus:border-[#287a55] focus:ring-2 focus:ring-[#287a55]/15"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>

              {/* In stock toggle */}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#d9dfd8] bg-[#f6f7f4] px-4 h-10 text-sm font-medium text-[#202326] transition hover:border-[#287a55]/40 hover:bg-[#edf2ee]">
                <div className={`relative h-4.5 flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${inStock ? "bg-[#287a55]" : "bg-[#d9dfd8]"}`}>
                  <span className={`absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${inStock ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                  className="sr-only"
                />
                In stock
              </label>

              {/* Reset */}
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex h-10 items-center gap-1.5 rounded-xl border border-[#d9dfd8] bg-[#f6f7f4] px-4 text-sm font-medium text-[#5f6568] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <X size={14} />
                Reset
              </button>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-[#202326]">
            <p>
              Showing {products.length} of {meta.total} products
            </p>
            <p>Page {meta.page} of {meta.totalPages}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[290px] animate-pulse rounded-lg bg-white/80 shadow-sm md:h-[360px]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[#d9dfd8] bg-[#edf2ee] p-6 text-[#5f6568]">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-[#d9dfd8] bg-white p-8 text-center text-[#202326]">
              No products matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const liked = isInWishlist(product.id);
                const isAdded = addedToCart === product.id;

                const salePrice = product.discountPrice ?? product.price;
                const hasDiscount =
                  product.discountPrice !== undefined &&
                  product.discountPrice !== null &&
                  product.discountPrice < product.price;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.price - (product.discountPrice as number)) /
                        product.price) *
                        100
                    )
                  : null;

                return (
                  <article
                    key={product.id}
                    className="group min-w-0 transition duration-300 hover:-translate-y-1.5"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="relative block overflow-hidden rounded-lg border border-white/80 bg-white/70 shadow-[0_14px_32px_rgba(16,56,38,0.14)]"
                    >
                      <div className="relative aspect-[1/1] w-full overflow-hidden bg-[#f6f7f4] md:aspect-[4/5]">
                        <img
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.title}
                          className={`h-full w-full object-cover transition-all duration-500 ${
                            product.images?.[1]
                              ? "opacity-100 group-hover:opacity-0"
                              : "group-hover:scale-105"
                          }`}
                        />
                        {product.images?.[1] ? (
                          <img
                            src={product.images[1]}
                            alt={`${product.title} alternate view`}
                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#202326]/40 via-[#202326]/5 to-transparent" />

                      {product.isBestSelling ? (
                        <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#202326] backdrop-blur">
                          Best Seller
                        </span>
                      ) : null}

                      {discountPercent ? (
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#287a55] px-2 py-1 text-[9px] font-semibold text-white">
                          Save {discountPercent}%
                        </span>
                      ) : null}

                      <button
                        onClick={async (event) => {
                          event.preventDefault();
                          try {
                            if (liked) {
                              await remove(product.id);
                              toast.info("Removed from wishlist");
                            } else {
                              await add(product.id);
                              toast.success("Added to wishlist");
                            }
                          } catch {
                            toast.error("Wishlist action failed");
                          }
                        }}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#202326]/35 text-white backdrop-blur transition hover:bg-[#202326]/50"
                      >
                        <Heart
                          size={14}
                          strokeWidth={2}
                          className={liked ? "fill-[#287a55] text-[#287a55]" : "text-white"}
                        />
                      </button>
                    </Link>

                    <div className="min-w-0 px-1 pb-1 pt-3 text-center md:px-0 md:pt-3">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-[#287a55] md:text-[10px]">
                        Signature Craft
                      </p>

                      <Link to={`/products/${product.id}`} className="block">
                        <h3
                          className="mt-1 h-[2.6em] overflow-hidden text-[13px] font-semibold leading-[1.3] text-[#202326] md:text-[15px]"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {product.title}
                        </h3>
                      </Link>

                      <div className="mt-2.5 flex items-end justify-center gap-1">
                        <span className="text-[20px] font-extrabold leading-none text-[#202326] md:text-[24px]">
                          Rs {salePrice}
                        </span>
                        {hasDiscount ? (
                          <span className="mb-0.5 text-[11px] text-[#8b9290] line-through">
                            Rs {product.price}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className={`inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap px-3 text-[11px] font-semibold transition sm:w-[75%] md:h-9 md:w-[60%] md:text-[12px] ${
                            isAdded
                              ? "bg-[#7abf36] text-white"
                              : "bg-[#287a55] text-white hover:bg-[#319164]"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={13} />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={13} />
                              Add to Cart
                            </>
                          )}
                        </button>
                      </div>

                      <Link
                        to={`/products/${product.id}`}
                        className="mt-2 hidden text-[10px] uppercase tracking-[0.14em] text-[#8b9290] transition hover:text-[#202326] md:block"
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {meta.totalPages > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!meta.hasPrev}
                className="rounded-lg border border-[#d9dfd8] bg-white px-3 py-2 text-sm text-[#202326] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    page === pageNumber
                      ? "bg-[#287a55] text-white"
                      : "border border-[#d9dfd8] bg-white text-[#202326]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={!meta.hasNext}
                className="rounded-lg border border-[#d9dfd8] bg-white px-3 py-2 text-sm text-[#202326] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

