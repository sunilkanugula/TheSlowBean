import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

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
  const { id: routeOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = routeOrderId || searchParams.get("orderId") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<TrackingResponse | null>(null);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const scope = searchParams.get("scope") || "";

  const resolveEndpoint = () => {
    if (orderId.trim() && token && role === "ADMIN" && scope === "admin") {
      return `/admin/orders/${orderId.trim()}/tracking`;
    }
    if (orderId.trim() && token) {
      return `/orders/${orderId.trim()}/tracking`;
    }
    return null;
  };

  const currentStepIndex = useMemo(() => {
    const status = data?.deliveryStatus || "CREATED";
    const index = TIMELINE_STEPS.indexOf(status);
    return index < 0 ? 0 : index;
  }, [data?.deliveryStatus]);

  const searchTracking = async (silent = false) => {
    try {
      if (!silent) {
        setError("");
        setLoading(true);
      }

      if (!orderId.trim()) {
        setError("Open tracking from your order card.");
        return;
      }

      const endpoint = resolveEndpoint();
      if (!endpoint) {
        setError("Open tracking from your order card.");
        return;
      }

      const res = await api.get(endpoint);

      setData(res.data);

    } catch (err: any) {
      setData(null);
      setError(err?.response?.data?.message || "Unable to fetch tracking right now.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    searchTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, role, scope]);

  useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      searchTracking(true);
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, orderId, role, scope, token]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-green-900">Track My Order</h1>
      <p className="mt-2 text-sm text-green-700">Live shipment timeline for your selected order.</p>

      {!orderId ? (
        <div className="mt-5 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-green-800">Open this page from the `Track Order` button under an order.</p>
          <button
            onClick={() => navigate("/orders")}
            className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Go To My Orders
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-2xl border border-green-100 bg-white p-5 shadow-sm text-sm text-green-700">
          Loading live status...
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : null}

      {data ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-green-600">Order</p>
              <p className="font-semibold text-green-900">#{data.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-green-600">Status</p>
              <p className="font-semibold text-green-900">{data.deliveryStatus.replaceAll("_", " ")}</p>
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
