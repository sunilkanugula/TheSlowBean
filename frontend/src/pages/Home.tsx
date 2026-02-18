import HeroCarousel from "../components/home/HeroCarousel";
import BestSellingProducts from "../components/home/BestSellingProducts";
import WhyChooseUs from "../components/home/WhyChooseUs";
import BeanToBarProcess from "../components/home/BeanToBarProcess";
import MahavanamFoodForest from "../components/home/MahavanamFoodForest";
import { FinalCTA } from "../components/home/FinalCTA";
import { Testimonials } from "../components/home/Testimonials";
import { CraftDeepDive } from "../components/home/CraftDeepDive";

export default function Home() {
  return (
    <div className="bg-gray-100">
      <HeroCarousel />
      <WhyChooseUs />
      <BestSellingProducts/>
      <BeanToBarProcess/>
      <MahavanamFoodForest/>
      <CraftDeepDive/>
      <Testimonials/>
      <FinalCTA/>
      {/* Other sections below */}
      <div className="max-w-7xl mx-auto p-6">
        {/* content */}
      </div>
    </div>
  );
}
