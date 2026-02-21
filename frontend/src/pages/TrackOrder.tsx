import { useMemo, useState } from "react";
import axios from "axios";

const ORDER_API = "http://localhost:5000/api/orders";

const TIMELINE_STEPS = [
  "CREATED",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

type TrackingEvent = {
  id: number;
  status: string;
  title: string;
  description?: string;
  location?: string;
  eventTime: string;
};

type TrackingResponse = {
  orderId: number;
  deliveryStatus: string;
  shipment?: {
    awbCode?: string;
    trackingUrl?: string;
    lastSyncedAt?: string;
  };
  events: TrackingEvent[];
  lastUpdatedAt?: string;
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TrackingResponse | null>(null);

  const currentStepIndex = useMemo(() => {
    const status = data?.deliveryStatus || "CREATED";
    const index = TIMELINE_STEPS.indexOf(status);
    return index < 0 ? 0 : index;
  }, [data?.deliveryStatus]);

  const searchTracking = async () => {
    try {
      setError("");
      setLoading(true);

      if (!orderId.trim() && !mobile.trim()) {
        setError("Enter Order ID or mobile number.");
        return;
      }

      const res = await axios.get(`${ORDER_API}/track`, {
        params: {
          orderId: orderId.trim() || undefined,
          mobile: mobile.trim() || undefined,
        },
      });

      setData(res.data);
    } catch (err: any) {
      setData(null);
      setError(err?.response?.data?.message || "Unable to fetch tracking right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-green-900">Track Order</h1>
      <p className="mt-2 text-sm text-green-700">
        Search using Order ID or mobile number used at checkout.
      </p>

      <div className="mt-5 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID"
            className="rounded-lg border border-green-200 px-3 py-2 text-sm outline-none focus:border-green-500"
          />
          <input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Mobile Number"
            className="rounded-lg border border-green-200 px-3 py-2 text-sm outline-none focus:border-green-500"
          />
        </div>

        <button
          onClick={searchTracking}
          disabled={loading}
          className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Track Order"}
        </button>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {data ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-green-600">Order</p>
              <p className="font-semibold text-green-900">#{data.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-green-600">Status</p>
              <p className="font-semibold text-green-900">{data.deliveryStatus}</p>
            </div>
            <div>
              <p className="text-sm text-green-600">Last Updated</p>
              <p className="font-semibold text-green-900">
                {new Date(data.lastUpdatedAt || data.shipment?.lastSyncedAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-6">
            {TIMELINE_STEPS.map((step, index) => {
              const done = index <= currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${done ? "bg-green-700" : "bg-green-200"}`} />
                  <span className={`text-xs ${done ? "text-green-800" : "text-green-500"}`}>
                    {step.replaceAll("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {data.events?.map((event) => (
              <div key={event.id} className="rounded-xl border border-green-100 bg-green-50/40 p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-sm font-semibold text-green-900">{event.title}</p>
                  <p className="text-xs text-green-700">{new Date(event.eventTime).toLocaleString()}</p>
                </div>
                <p className="text-xs text-green-700">
                  {event.status}
                  {event.location ? ` | ${event.location}` : ""}
                </p>
                {event.description ? <p className="mt-1 text-sm text-green-800">{event.description}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
