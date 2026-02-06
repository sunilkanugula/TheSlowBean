import BestSellingProducts from "../components/home/BestSellingProducts";
import Hero from "../components/home/Hero";

export default function Home() {
  return (
    <div className="bg-gray-100">
      <Hero />
      <BestSellingProducts/>
      {/* Other sections below */}
      <div className="max-w-7xl mx-auto p-6">
        {/* content */}
      </div>
    </div>
  );
}
