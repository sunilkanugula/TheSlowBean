import { useNavigate } from "react-router-dom";

// Import images from assets
import darkImg from "../../assets/collections/dark.jpg";
import jaggeryImg from "../../assets/collections/jaggery.jpg";
import giftingImg from "../../assets/collections/gifting.jpg";
import festiveImg from "../../assets/collections/festive.jpg";
import customImg from "../../assets/collections/custom.jpg";
import workshopImg from "../../assets/collections/workshop.jpg";
import factoryImg from "../../assets/collections/factory.jpg";

export default function CollectionsSection() {
  const navigate = useNavigate();

  const collections = [
    { title: "Dark Chocolates", img: darkImg, link: "/products?category=dark" },
    { title: "Jaggery Chocolates", img: jaggeryImg, link: "/products?category=jaggery" },
    { title: "Corporate Gifting", img: giftingImg, link: "/corporate-gifting" },
    { title: "Festive Collection", img: festiveImg, link: "/products?category=festive" },
    { title: "Customized Chocolates", img: customImg, link: "/customized" },
    { title: "Workshops & Events", img: workshopImg, link: "/workshops" },
    { title: "Factory Visits", img: factoryImg, link: "/factory-visits" },
  ];

  return (
    <section className="py-24 bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight">
            ALL COLLECTIONS
          </h2>
          <div className="mt-4 h-[2px] w-16 bg-orange-400 mx-auto" />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {collections.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.link)}
              className="relative group cursor-pointer overflow-hidden"
            >
              {/* IMAGE */}
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-[320px] object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* DARK OVERLAY */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition duration-300" />

              {/* TEXT */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-2xl md:text-3xl font-bold tracking-wide text-center px-4">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
