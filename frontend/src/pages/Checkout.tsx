import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, MapPin, Tag, X } from "lucide-react";

import { api } from "../services/api";

const PHONE_REGEX = /^[6-9]\d{9}$/;

declare global {
  interface Window { Razorpay: unknown; }
}

type SavedAddress = {
  id: number;
  label: string;
  name: string;
  phone: string;
  altPhone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export default function Checkout() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const buyNowProductId = Number(searchParams.get("productId"));
    const buyNowQty = Number(searchParams.get("qty")) || 1;

    const bootstrap = async () => {
      try {
        if (buyNowProductId) {
          await api.post("/cart", { productId: buyNowProductId, quantity: Math.max(1, buyNowQty) });
        }
        const [cartRes, addrRes] = await Promise.allSettled([
          api.get("/cart"),
          api.get("/addresses"),
        ]);
        if (cartRes.status === "fulfilled") setItems(cartRes.value.data?.items || []);
        if (addrRes.status === "fulfilled") {
          const addrs: SavedAddress[] = addrRes.value.data || [];
          setSavedAddresses(addrs);
          const def = addrs.find((a) => a.isDefault) || addrs[0];
          if (def) applyAddress(def);
        }
      } catch {
        setItems([]);
      }
    };
    bootstrap();
  }, [navigate, searchParams]);

  const applyAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.name);
    setPhone(addr.phone);
    setAltPhone(addr.altPhone || "");
    setAddressLine1(addr.line1);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const gstAmount = Number((subtotal * 0.05).toFixed(2));
  const baseTotal = Number((subtotal + gstAmount).toFixed(2));
  const discount = couponApplied?.discount || 0;
  const grandTotal = Number((baseTotal - discount).toFixed(2));

  const fetchCityState = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      setPinLoading(true); setPinError("");
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const json = await res.json();
      const data = json?.[0];
      if (data?.Status === "Success") {
        const po = data.PostOffice[0];
        setCity(po.District); setState(po.State);
      } else { setPinError("Invalid pincode"); setCity(""); setState(""); }
    } catch { setPinError("Failed to fetch city/state"); }
    finally { setPinLoading(false); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponLoading(true);
      const res = await api.post("/coupons/validate", { code: couponCode.trim(), orderTotal: baseTotal });
      setCouponApplied({ code: res.data.code, discount: res.data.discount });
      toast.success(`Coupon applied! You save Rs ${res.data.discount}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid coupon");
      setCouponApplied(null);
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => { setCouponApplied(null); setCouponCode(""); };

  const getAddress = () => ({
    name, phone, altPhone, line1: addressLine1, city, state, pincode,
  });

  const validateForm = () => {
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      toast.error("Please fill all required fields"); return false;
    }
    if (!PHONE_REGEX.test(phone)) { toast.error("Enter valid primary phone number"); return false; }
    if (altPhone && !PHONE_REGEX.test(altPhone)) { toast.error("Enter valid alternate phone number"); return false; }
    if (!items.length) { toast.error("Your cart is empty"); return false; }
    return true;
  };

  const payNow = async () => {
    if (!validateForm()) return;
    if (!window.Razorpay) { toast.error("Razorpay SDK not loaded. Please refresh."); return; }
    try {
      setLoading(true);
      const createRes = await api.post("/orders/razorpay/create", {});
      const { orderId, key, amount } = createRes.data;
      const idempotencyKey = `${orderId}:${Date.now()}`;
      const RazorpayConstructor = window.Razorpay as new (opts: Record<string, unknown>) => { open(): void };
      const razorpay = new RazorpayConstructor({
        key, amount, currency: "INR", order_id: orderId,
        name: "TheSlowBean", description: "Order Payment",
        prefill: { name, contact: phone },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/orders/razorpay/verify", {
              ...response, idempotencyKey, address: getAddress(),
            });
            navigate(`/order-success/${verifyRes.data.orderId}`);
          } catch {
            toast.warning("Payment captured, but order verification failed. Please check My Orders.");
            navigate("/orders");
          }
        },
        theme: { color: "#287a55" },
      });
      razorpay.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally { setLoading(false); }
  };

  const placeCodOrder = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const res = await api.post("/orders/cod", {
        address: getAddress(),
        couponCode: couponApplied?.code || undefined,
      });
      navigate(`/order-success/${res.data.orderId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally { setLoading(false); }
  };

  return (
    <div className="premium-page">
      <div className="premium-shell max-w-5xl space-y-6">
        <div>
          <p className="premium-kicker">Secure Checkout</p>
          <h1 className="mt-2 text-4xl font-semibold text-[#202326]">Checkout</h1>
        </div>

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#202326]">
              <MapPin size={15} /> Saved Addresses
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => applyAddress(addr)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    selectedAddressId === addr.id
                      ? "border-[#287a55] bg-[#edf2ee] ring-1 ring-[#287a55]/30"
                      : "border-[#d9dfd8] bg-white hover:border-[#287a55]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#f6f7f4] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#5f6568]">{addr.label}</span>
                    {selectedAddressId === addr.id && <Check size={13} className="text-[#287a55]" />}
                  </div>
                  <p className="mt-1.5 font-medium text-[#202326]">{addr.name}</p>
                  <p className="text-[#5f6568]">{addr.line1}</p>
                  <p className="text-[#5f6568]">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-[#8b9290]">{addr.phone}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#8b9290]">Or fill in a new address below</p>
          </div>
        )}

        {/* Address Form */}
        <div className="premium-card grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <input placeholder="Full Name *" value={name} onChange={(e) => setName(e.target.value)} className="premium-input" />
          <input placeholder="Primary Phone *" value={phone} maxLength={10} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} className="premium-input" />
          <input placeholder="Alternate Phone (optional)" value={altPhone} maxLength={10} onChange={(e) => setAltPhone(e.target.value.replace(/\D/g, ""))} className="premium-input" />
        </div>

        <textarea
          placeholder="House / Street / Area *"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          className="premium-input min-h-28"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            placeholder="Pincode *"
            value={pincode}
            maxLength={6}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setPincode(val);
              setSelectedAddressId(null);
              if (val.length === 6) fetchCityState(val);
            }}
            className="premium-input"
          />
          <input placeholder="City" value={city} disabled className="premium-input bg-[#edf2ee]" />
          <input placeholder="State" value={state} disabled className="premium-input bg-[#edf2ee]" />
        </div>

        {pinLoading && <p className="text-xs text-[#8b9290]">Fetching city and state...</p>}
        {pinError && <p className="text-xs text-[#5f6568]">{pinError}</p>}

        {/* Coupon */}
        <div className="premium-card p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#202326]">
            <Tag size={15} /> Coupon Code
          </p>
          {couponApplied ? (
            <div className="flex items-center justify-between rounded-lg border border-[#287a55]/40 bg-[#edf2ee] px-4 py-3">
              <div>
                <span className="text-sm font-semibold text-[#287a55]">{couponApplied.code}</span>
                <span className="ml-2 text-sm text-[#5f6568]">— Rs {couponApplied.discount} off</span>
              </div>
              <button type="button" aria-label="Remove coupon" onClick={removeCoupon} className="rounded-full p-1 transition hover:bg-white">
                <X size={15} className="text-[#5f6568]" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 rounded-lg border border-[#d9dfd8] bg-white px-4 py-2.5 text-sm uppercase tracking-wider text-[#202326] outline-none ring-[#287a55] transition focus:ring"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="rounded-lg bg-[#287a55] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#319164] disabled:opacity-50"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="premium-card p-5 text-sm">
          <div className="flex justify-between py-1"><span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-1"><span>GST (5%)</span><span>Rs {gstAmount.toFixed(2)}</span></div>
          {discount > 0 && (
            <div className="flex justify-between py-1 text-[#287a55]">
              <span>Coupon Discount ({couponApplied?.code})</span>
              <span>− Rs {discount.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-black/10 pt-2 text-lg font-semibold text-[#202326]">
            <span>Grand Total</span>
            <span>Rs {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={payNow}
            disabled={loading}
            className="premium-button w-full disabled:opacity-50"
          >
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
          <button
            type="button"
            onClick={placeCodOrder}
            disabled={loading}
            className="w-full rounded-lg border-2 border-[#202326] bg-white py-3 text-sm font-semibold text-[#202326] transition hover:bg-[#202326] hover:text-white disabled:opacity-50"
          >
            {loading ? "Processing..." : "Cash on Delivery (COD)"}
          </button>
        </div>

        <p className="text-center text-xs text-[#8b9290]">
          COD orders are subject to availability in your area.
        </p>
      </div>
    </div>
  );
}
