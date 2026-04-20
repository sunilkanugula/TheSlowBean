import { useState } from "react";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    // In a real setup this would POST to a newsletter endpoint
    setSubmitted(true);
    toast.success("You're subscribed! Thank you.");
  };

  return (
    <section className="bg-[#202326] py-14 md:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center md:px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#287a55]/20">
          <Mail size={22} className="text-[#287a55]" />
        </div>
        <h2 className="text-3xl font-serif font-medium tracking-tight text-white md:text-4xl">
          Stay in the Loop
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#8b9290]">
          Be the first to know about new single-origin releases, seasonal drops, and exclusive offers from The Slow Bean.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-lg border border-[#287a55]/40 bg-[#287a55]/10 px-6 py-4 text-[#287a55]">
            Thank you for subscribing! We'll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="h-12 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-[#8b9290] outline-none ring-[#287a55] transition focus:ring"
            />
            <button
              type="submit"
              className="h-12 rounded-lg bg-[#287a55] px-6 text-sm font-semibold text-white transition hover:bg-[#319164]"
            >
              Subscribe
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-[#5f6568]">No spam, ever. Unsubscribe at any time.</p>
      </div>
    </section>
  );
}
