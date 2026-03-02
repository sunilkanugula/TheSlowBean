import { useNavigate } from "react-router-dom";
import { useState } from "react";
import banner from "../../assets/bannerImg.png";
import heroVideo from "../../assets/bannerVideo.mp4";
import recognitionImg from "../../assets/recognition.jpeg";

export default function Hero() {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);

  return (
    <section className="bg-[#eef2ed] relative min-h-[80vh] overflow-hidden flex items-center">
      
      {/* Background Video */}
     <video
  className="absolute inset-0 w-full h-full object-cover scale-[0.9]"
  src={heroVideo}
  autoPlay
  loop
  muted
  playsInline
/>



      {/* Overlay */}
      <div className="absolute inset-0 bg-[#eef2ed]/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        
        {/* LEFT TEXT */}
        <div className="max-w-xl">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-[#eef2ed] text-[#6f7277] text-sm font-medium">
            Premium • Handcrafted • Natural
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 text-[#57595d]">
            Brewed Slow. <br />
            <span className="text-[#6f7277]">Served Perfect.</span>
          </h1>

          <p className="text-lg text-[#6f7277] mb-8">
            Discover premium coffee blends crafted with care and patience.
            Experience the true taste of slow brewing.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/products")}
              className="bg-[#84c83a] text-white font-semibold px-7 py-3 rounded-xl shadow-lg hover:bg-[#69b317] transition"
            >
              Shop Coffee
            </button>

            <button
              onClick={() => navigate("/about")}
              className="border border-[#d7dad7] text-[#6f7277] font-semibold px-7 py-3 rounded-xl hover:bg-[#f3f5f3] transition"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* RIGHT FLIP CARD */}
        <div className="flex justify-center">
          <div
            className="relative w-[360px] h-[480px] cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              {/* FRONT SIDE */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
                style={{ backfaceVisibility: "hidden" }}
              >
                <img
                  src={banner}
                  alt="TheSlowBean products"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* BACK SIDE */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <img
                  src={recognitionImg}
                  alt="Recognition"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Flip Hint */}
            <div className="absolute bottom-3 right-3 bg-[#57595d]/60 text-white text-xs px-3 py-1 rounded-full">
              Click to flip
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



