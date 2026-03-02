import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Heart,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";

import ProductsHero from "../components/products/ProductsHero";
import { useWishlist } from "../hooks/useWishlist";
import { api } from "../services/api";

type Product = {
  id: number;
  title: string;
  collection: string;
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
  filters: {
    collections: string[];
  };
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

  const [collections, setCollections] = useState<string[]>([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [collection, setCollection] = useState("");
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
    const urlCollection = params.get("collection") || "";
    const urlSort = params.get("sort") || "newest";
    const urlMinPrice = params.get("minPrice") || "";
    const urlMaxPrice = params.get("maxPrice") || "";
    const urlInStock = params.get("inStock") === "true";
    const urlPage = Math.max(numberParam(params.get("page")) || 1, 1);

    setSearchDraft(urlSearch);
    setSearchTerm(urlSearch);
    setCollection(urlCollection);
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
    if (collection) params.set("collection", collection);
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
    collection,
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
            collection: collection || undefined,
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
        setCollections(response.data.filters.collections);
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
  }, [collection, inStock, maxPrice, minPrice, page, searchTerm, sort]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchDraft.trim());
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setSearchTerm("");
    setCollection("");
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

      <section className="bg-[radial-gradient(circle_at_20%_10%,#f3f4f3_0%,#eceeed_45%,#e5e7e6_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 rounded-3xl border border-[#d7dad7]/90 bg-white/90 p-4 shadow-[0_12px_32px_rgba(87,89,93,0.1)] backdrop-blur md:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr_auto]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7277]"
                  size={16}
                />
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search chocolates, collections..."
                  className="h-12 w-full rounded-xl border border-[#d7dad7] bg-white pl-10 pr-3 text-sm text-[#57595d] outline-none ring-[#69b317] transition focus:ring"
                />
              </form>

              <select
                value={collection}
                onChange={(e) => {
                  setCollection(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-xl border border-[#d7dad7] bg-white px-3 text-sm text-[#57595d] outline-none ring-[#69b317] transition focus:ring"
              >
                <option value="">All collections</option>
                {collections.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="h-12 rounded-xl border border-[#d7dad7] bg-white px-3 text-sm text-[#57595d] outline-none ring-[#69b317] transition focus:ring"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Min"
                  className="h-12 rounded-xl border border-[#d7dad7] bg-white px-3 text-sm text-[#57595d] outline-none ring-[#69b317] transition focus:ring"
                />
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Max"
                  className="h-12 rounded-xl border border-[#d7dad7] bg-white px-3 text-sm text-[#57595d] outline-none ring-[#69b317] transition focus:ring"
                />
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d7dad7] bg-white px-4 text-sm font-medium text-[#57595d] transition hover:bg-[#f3f5f3]"
              >
                <SlidersHorizontal size={16} /> Reset
              </button>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#57595d]">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-[#b5bab6] text-[#69b317]"
              />
              In stock only
            </label>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-[#57595d]">
            <p>
              Showing {products.length} of {meta.total} products
            </p>
            <p>Page {meta.page} of {meta.totalPages}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[290px] animate-pulse rounded-2xl bg-white/80 shadow-sm md:h-[360px]"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#d7dad7] bg-[#f3f5f3] p-6 text-[#6f7277]">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-[#d7dad7] bg-white p-8 text-center text-[#57595d]">
              No products matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      className="relative block overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_32px_rgba(16,56,38,0.14)]"
                    >
                      <div className="relative aspect-[1/1] w-full overflow-hidden bg-[#f1f3f2] md:aspect-[4/5]">
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
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#57595d]/40 via-[#57595d]/5 to-transparent" />

                      <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-[#57595d] backdrop-blur">
                        Best Seller
                      </span>

                      {discountPercent ? (
                        <span className="absolute bottom-3 left-3 rounded-full bg-[#69b317] px-2 py-1 text-[9px] font-semibold text-white">
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
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#57595d]/35 text-white backdrop-blur transition hover:bg-[#57595d]/50"
                      >
                        <Heart
                          size={14}
                          strokeWidth={2}
                          className={liked ? "fill-[#69b317] text-[#69b317]" : "text-white"}
                        />
                      </button>
                    </Link>

                    <div className="min-w-0 px-1 pb-1 pt-3 text-center md:px-0 md:pt-3">
                      <p className="text-[9px] uppercase tracking-[0.15em] text-[#69b317] md:text-[10px]">
                        Signature Craft
                      </p>

                      <Link to={`/products/${product.id}`} className="block">
                        <h3
                          className="mt-1 h-[2.6em] overflow-hidden text-[13px] font-semibold leading-[1.3] text-[#57595d] md:text-[15px]"
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
                        <span className="text-[20px] font-extrabold leading-none text-[#57595d] md:text-[24px]">
                          Rs {salePrice}
                        </span>
                        {hasDiscount ? (
                          <span className="mb-0.5 text-[11px] text-[#9fa3a8] line-through">
                            Rs {product.price}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className={`inline-flex h-10 w-[75%] items-center justify-center gap-1.5 whitespace-nowrap  px-3 text-[11px] font-semibold transition md:h-9 md:w-[60%] md:text-[12px] ${
                            isAdded
                              ? "bg-[#84c83a] text-white"
                              : "bg-[#69b317] text-white hover:bg-[#5aa10f]"
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
                        className="mt-2 hidden text-[10px] uppercase tracking-[0.14em] text-[#8d9197] transition hover:text-[#57595d] md:block"
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
                className="rounded-xl border border-[#d7dad7] bg-white px-3 py-2 text-sm text-[#57595d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    page === pageNumber
                      ? "bg-[#69b317] text-white"
                      : "border border-[#d7dad7] bg-white text-[#57595d]"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={!meta.hasNext}
                className="rounded-xl border border-[#d7dad7] bg-white px-3 py-2 text-sm text-[#57595d] disabled:cursor-not-allowed disabled:opacity-50"
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

