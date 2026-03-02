import HeroCarousel from "../components/home/HeroCarousel";
import BestSellingProducts from "../components/home/BestSellingProducts";
import CollectionsSection from "../components/home/CollectionsSection";
import WhyChooseUs from "../components/home/WhyChooseUs";
import BeanToBarProcess from "../components/home/BeanToBarProcess";
import MahavanamFoodForest from "../components/home/MahavanamFoodForest";
import { FinalCTA } from "../components/home/FinalCTA";
import { Testimonials } from "../components/home/Testimonials";
import { CraftDeepDive } from "../components/home/CraftDeepDive";

export default function Home() {
  return (
    <div className="bg-[linear-gradient(180deg,#f5f6f5_0%,#eff1f0_38%,#e8ebea_100%)]">
      <HeroCarousel />
      <WhyChooseUs />
      <CollectionsSection />
      <BestSellingProducts />
      <BeanToBarProcess />
      <MahavanamFoodForest />
      <CraftDeepDive />
      <Testimonials />
      <FinalCTA />
    </div>
  );
}

