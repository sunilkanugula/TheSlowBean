import HeroCarousel from "../components/home/HeroCarousel";
import BestSellingProducts from "../components/home/BestSellingProducts";
import OurProducts from "../components/home/OurProducts";
import WhyChooseUs from "../components/home/WhyChooseUs";
import BeanToBarProcess from "../components/home/BeanToBarProcess";
import MahavanamFoodForest from "../components/home/MahavanamFoodForest";
import { FinalCTA } from "../components/home/FinalCTA";
import { Testimonials } from "../components/home/Testimonials";
import { CraftDeepDive } from "../components/home/CraftDeepDive";
export default function Home() {
  return (
    <div className="bg-[linear-gradient(180deg,#fbfcf9_0%,#f1f5f1_42%,#e7eeeb_100%)]">
      <HeroCarousel />
      <WhyChooseUs />
      <BestSellingProducts />
      <OurProducts />
      <BeanToBarProcess />
      <MahavanamFoodForest />
      <CraftDeepDive />
      <Testimonials />
      <FinalCTA />
    </div>
  );
}

