import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

type CollectionItem = {
  id: number;
  name: string;
  imageUrl: string;
};

const COLLECTIONS_API_URL = "http://localhost:5000/api/products/collections";

export default function CollectionsSection() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  useEffect(() => {
    axios
      .get<CollectionItem[]>(COLLECTIONS_API_URL)
      .then((res) => setCollections(res.data || []))
      .catch(() => setCollections([]));
  }, []);

  if (!collections.length) return null;

  return (
    <section className="bg-[#f9f4ea] py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center md:mb-14">
          <h2 className="text-4xl font-serif font-medium tracking-tight md:text-5xl">
            All Collections
          </h2>
          <div className="mx-auto mt-5 h-[2px] w-16 bg-gray-300" />
          <p className="mx-auto mt-5 max-w-2xl text-[15px] text-gray-600">
            Explore every collection curated by our team and jump straight into products.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/products?collection=${encodeURIComponent(collection.name)}`}
              className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/70 shadow-[0_14px_32px_rgba(16,56,38,0.14)]"
            >
              <img
                src={collection.imageUrl}
                alt={collection.name}
                className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-48"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                <span className="inline-flex rounded-full border border-white/40 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#173f33] backdrop-blur">
                  {collection.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

