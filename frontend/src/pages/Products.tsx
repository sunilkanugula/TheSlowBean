import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Heart,
  Search,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";

import ProductsHero from "../components/products/ProductsHero";
import { useWishlist } from "../hooks/useWishlist";
import { api } from "../services/api";

type Product = {
  id: number;
  title: string;
  category: string;
  subCategory?: string | null;
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
    categories: string[];
    subCategories: string[];
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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const [categories, setCategories] = useState<string[]>([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
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
    const params = new URLSearchParams(location.search);

    const urlSearch = params.get("search") || "";
    const urlCategory = params.get("category") || "";
    const urlSort = params.get("sort") || "newest";
    const urlMinPrice = params.get("minPrice") || "";
    const urlMaxPrice = params.get("maxPrice") || "";
    const urlInStock = params.get("inStock") === "true";
    const urlPage = Math.max(numberParam(params.get("page")) || 1, 1);

    setSearchDraft(urlSearch);
    setSearchTerm(urlSearch);
    setCategory(urlCategory);
    setSort(urlSort);
    setMinPrice(urlMinPrice);
    setMaxPrice(urlMaxPrice);
    setInStock(urlInStock);
    setPage(urlPage);
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("category", category);
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
    category,
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
            category: category || undefined,
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
        setCategories(response.data.filters.categories);
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
  }, [category, inStock, maxPrice, minPrice, page, searchTerm, sort]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchDraft.trim());
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    setSearchTerm("");
    setCategory("");
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

      <section className="bg-[#F4F7F1] py-12 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 rounded-3xl border border-green-100 bg-white/90 p-4 shadow-[0_10px_30px_rgba(16,88,43,0.08)] backdrop-blur md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-700"
                  size={16}
                />
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search chocolates, categories..."
                  className="h-11 w-full rounded-xl border border-green-200 bg-white pl-10 pr-3 text-sm outline-none ring-green-500 transition focus:ring"
                />
              </form>

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl border border-green-200 bg-white px-3 text-sm outline-none ring-green-500 transition focus:ring"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
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
                className="h-11 rounded-xl border border-green-200 bg-white px-3 text-sm outline-none ring-green-500 transition focus:ring"
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
                  className="h-11 rounded-xl border border-green-200 bg-white px-3 text-sm outline-none ring-green-500 transition focus:ring"
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
                  className="h-11 rounded-xl border border-green-200 bg-white px-3 text-sm outline-none ring-green-500 transition focus:ring"
                />
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-sm font-medium text-green-800 transition hover:bg-green-50"
              >
                <SlidersHorizontal size={16} /> Reset
              </button>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 text-sm text-green-900">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-green-300 text-green-700"
              />
              In stock only
            </label>
          </div>

          <div className="mb-4 flex items-center justify-between text-sm text-green-900">
            <p>
              Showing {products.length} of {meta.total} products
            </p>
            <p>Page {meta.page} of {meta.totalPages}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-3xl bg-white/70"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-white p-8 text-center text-green-900">
              No products matched your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {products.map((product) => {
                const liked = isInWishlist(product.id);
                const isAdded = addedToCart === product.id;

                const salePrice = product.discountPrice ?? product.price;
                const discountPercent =
                  product.discountPrice && product.price > product.discountPrice
                    ? Math.round(
                        ((product.price - product.discountPrice) / product.price) *
                          100
                      )
                    : null;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-green-100 bg-white shadow-[0_8px_24px_rgba(16,88,43,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(16,88,43,0.14)]"
                  >
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="relative h-[260px] overflow-hidden bg-green-50">
                        <img
                          src={product.images?.[0] || "/placeholder.png"}
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {discountPercent ? (
                          <span className="absolute left-3 top-3 rounded-full bg-green-800 px-2.5 py-1 text-xs font-semibold text-white">
                            -{discountPercent}%
                          </span>
                        ) : null}
                      </div>
                    </Link>

                    <div className="p-4">
                      <p className="text-xs uppercase tracking-wide text-green-700">
                        {product.category}
                      </p>
                      <h3 className="mt-1 min-h-[40px] text-[15px] font-semibold leading-snug text-slate-900">
                        {product.title}
                      </h3>

                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-lg font-bold text-green-900">Rs {salePrice}</span>
                        {product.discountPrice ? (
                          <span className="text-sm text-slate-400 line-through">
                            Rs {product.price}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-green-800 px-3 text-xs font-semibold text-white transition hover:bg-green-900"
                        >
                          {isAdded ? <Check size={14} /> : <ShoppingCart size={14} />}
                          {isAdded ? "Added" : "Cart"}
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              if (liked) {
                                await remove(product.id);
                                toast("Removed from wishlist");
                              } else {
                                await add(product.id);
                                toast.success("Added to wishlist");
                              }
                            } catch {
                              toast.error("Wishlist action failed");
                            }
                          }}
                          className={`inline-flex h-10 items-center justify-center gap-1 rounded-xl border px-3 text-xs font-semibold transition ${
                            liked
                              ? "border-green-800 bg-green-50 text-green-800"
                              : "border-green-200 text-green-800 hover:bg-green-50"
                          }`}
                        >
                          <Heart size={14} className={liked ? "fill-green-800" : ""} />
                          {liked ? "Saved" : "Wishlist"}
                        </button>
                      </div>
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
                className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    page === pageNumber
                      ? "bg-green-800 text-white"
                      : "border border-green-200 bg-white text-green-900"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                disabled={!meta.hasNext}
                className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
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
