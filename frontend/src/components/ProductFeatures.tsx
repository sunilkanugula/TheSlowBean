// src/components/ProductFeatures.tsx

// FEATURE ICONS
import Organic from "../assets/OrganicChocolate.avif";
import NoPalmOil from "../assets/NOPALMOIL.avif";
import SmallBatch from "../assets/SmallBatch.avif";
import Sustainable from "../assets/SustainablySourced.avif";
import Insulated from "../assets/InsulatedShipping.avif";

type FeatureKey =
  | "100_natural"
  | "no_palm_oil"
  | "small_batch"
  | "sustainably_sourced"
  | "insulated_shipping";

const FEATURE_MAP: Record<
  FeatureKey,
  { label: string; icon: string }
> = {
  "100_natural": { label: "100% Natural", icon: Organic },
  no_palm_oil: { label: "Palm Oil Free", icon: NoPalmOil },
  small_batch: { label: "Small Batch", icon: SmallBatch },
  sustainably_sourced: {
    label: "Sustainably Sourced",
    icon: Sustainable,
  },
  insulated_shipping: {
    label: "Insulated Shipping",
    icon: Insulated,
  },
};

// ✅ FRONTEND-ONLY DEFAULT FEATURES
const DEFAULT_FEATURES: FeatureKey[] = [
  "100_natural",
  "no_palm_oil",
  "small_batch",
  "sustainably_sourced",
  "insulated_shipping",
];

export default function ProductFeatures() {
  return (
    <div className="mt-14">
      <div className="grid grid-cols-4 md:grid-cols-5 gap-y-10 gap-x-6">
        {DEFAULT_FEATURES.map((key) => {
          const feature = FEATURE_MAP[key];

          return (
            <div
              key={key}
              className="group flex flex-col items-center text-center"
            >
              <div
                className="
                  w-16 h-16 rounded-full border border-[#d7dad7]
                  flex items-center justify-center
                  transition-all duration-300
                  group-hover:border-[#57595d]
                  group-hover:shadow-md
                "
              >
                <img
                  src={feature.icon}
                  alt={feature.label}
                  className="
                    w-9 h-9 object-contain
                    transition-transform duration-300
                    group-hover:scale-110
                  "
                />
              </div>

              <p className="mt-3 text-[11px] tracking-wide font-medium text-[#6f7277]">
                {feature.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

