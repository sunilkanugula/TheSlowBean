import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../services/api";

const ORDER_API = "/orders";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  product: {
    title: string;
    images: string[];
  };
};

type Address = {
  name: string;
  phone: string;
  altPhone?: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
};

type TrackingEvent = {
  id: number;
  status: string;
  title: string;
  description?: string;
  location?: string;
  source?: string;
  eventTime: string;
};

type Shipment = {
  id: number;
  shiprocketOrderId?: string;
  awbCode?: string;
  status: string;
  trackingUrl?: string;
  lastSyncedAt?: string;
};

type Order = {
  id: number;
  totalAmount: number;
  paymentStatus?: string;
  deliveryStatus?: string;
  createdAt: string;
  address?: Address;
  items: OrderItem[];
};

const STATUS_STEPS = [
  "CREATED",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const fetchOrderAndTracking = async () => {
      try {
        const [orderRes, trackingRes] = await Promise.allSettled([
          api.get(`${ORDER_API}/my`),
          api.get(`${ORDER_API}/${id}/tracking`),
        ]);

        if (!mounted) return;

        if (orderRes.status === "fulfilled") {
          const found = orderRes.value.data.find((o: Order) => o.id === Number(id));
          setOrder(found || null);
        }

        if (trackingRes.status === "fulfilled") {
          setShipment(trackingRes.value.data.shipment || null);
          setEvents(trackingRes.value.data.events || []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrderAndTracking();
    const interval = setInterval(fetchOrderAndTracking, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id, navigate]);

  const currentStepIndex = useMemo(() => {
    const status = shipment?.status || order?.deliveryStatus || "CREATED";
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  }, [order?.deliveryStatus, shipment?.status]);

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-green-700">Loading order details...</div>;
  }

  if (!order) {
    return <div className="mx-auto max-w-5xl p-6">Order not found</div>;
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const gstAmount = Number((subtotal * 0.05).toFixed(2));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-green-800">Order #{order.id}</h1>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm text-green-600">Placed on</p>
          <p className="font-medium text-green-900">{new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-sm text-green-600">Current status</p>
          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            {shipment?.status || order.deliveryStatus}
          </span>
        </div>

        <div>
          <p className="text-sm text-green-600">Delivery partner</p>
          <p className="font-medium text-green-900">Shiprocket</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-green-600">Order Total (Incl. GST)</p>
          <p className="text-xl font-bold text-green-800">Rs {order.totalAmount.toFixed(2)}</p>
          <p className="text-xs text-green-700">Subtotal: Rs {subtotal.toFixed(2)}</p>
          <p className="text-xs text-green-700">GST (5%): Rs {gstAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-green-800">Live Tracking</h2>
          {shipment?.trackingUrl ? (
            <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-green-700 underline">
              Open carrier tracking
            </a>
          ) : null}
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-5">
          {STATUS_STEPS.map((step, index) => {
            const done = index <= currentStepIndex;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${done ? "bg-green-700" : "bg-green-200"}`} />
                <p className={`text-xs font-medium ${done ? "text-green-800" : "text-green-500"}`}>
                  {step.replaceAll("_", " ")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-green-700">Tracking events will appear once shipment updates begin.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-xl border border-green-100 bg-green-50/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-green-900">{event.title}</p>
                  <p className="text-xs text-green-700">{new Date(event.eventTime).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs text-green-700">
                  {event.status}
                  {event.location ? ` | ${event.location}` : ""}
                  {event.source ? ` | ${event.source}` : ""}
                </p>
                {event.description ? <p className="mt-1 text-sm text-green-800">{event.description}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>

      {order.address ? (
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-green-800">Delivery Address</h3>
          <p className="font-semibold text-green-900">{order.address.name}</p>
          <p className="text-sm text-green-800">{order.address.line1}</p>
          <p className="text-sm text-green-800">
            {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
          <p className="mt-2 text-sm text-green-700">Phone: {order.address.phone}</p>
          {order.address.altPhone ? <p className="text-sm text-green-700">Alternate: {order.address.altPhone}</p> : null}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-green-800">Items in this order</h3>

        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 border-b border-green-100 pb-4 last:border-none last:pb-0">
            <img src={item.product.images[0]} className="h-20 w-20 rounded-lg border border-green-200 object-cover" alt={item.product.title} />

            <div className="flex-1">
              <p className="font-medium text-green-900">{item.product.title}</p>
              <p className="text-sm text-green-600">
                Qty: {item.quantity} x Rs {item.price}
              </p>
            </div>

            <div className="font-semibold text-green-800">Rs {item.quantity * item.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
