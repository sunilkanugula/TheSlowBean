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
    return <div className="premium-page"><div className="premium-shell max-w-5xl text-[#5f6568]">Loading order details...</div></div>;
  }

  if (!order) {
    return <div className="premium-page"><div className="premium-shell max-w-5xl">Order not found</div></div>;
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="premium-page">
      <div className="premium-shell max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold text-[#202326]">Order #{order.id}</h1>

      <div className="grid gap-4 rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-[#5f6568]">Placed on</p>
          <p className="font-medium text-[#202326]">{new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-sm text-[#5f6568]">Current status</p>
          <span className="inline-block rounded-full bg-[#edf2ee] px-3 py-1 text-xs font-semibold text-[#202326]">
            {shipment?.status || order.deliveryStatus}
          </span>
        </div>

        <div>
          <p className="text-sm text-[#5f6568]">Delivery partner</p>
          <p className="font-medium text-[#202326]">Shiprocket</p>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 lg:text-right">
          <p className="text-sm text-[#5f6568]">Order Total</p>
          <p className="text-xl font-bold text-[#202326]">Rs {order.totalAmount.toFixed(2)}</p>
          <p className="text-xs text-[#5f6568]">Subtotal: Rs {subtotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[#202326]">Live Tracking</h2>
          {shipment?.trackingUrl ? (
            <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#5f6568] underline">
              Open carrier tracking
            </a>
          ) : null}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {STATUS_STEPS.map((step, index) => {
            const done = index <= currentStepIndex;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${done ? "bg-[#287a55]" : "bg-[#edf2ee]"}`} />
                <p className={`text-xs font-medium ${done ? "text-[#202326]" : "text-[#8b9290]"}`}>
                  {step.replaceAll("_", " ")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-[#5f6568]">Tracking events will appear once shipment updates begin.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-lg border border-[#d9dfd8] bg-[#edf2ee]/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#202326]">{event.title}</p>
                  <p className="text-xs text-[#5f6568]">{new Date(event.eventTime).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs text-[#5f6568]">
                  {event.status}
                  {event.location ? ` | ${event.location}` : ""}
                  {event.source ? ` | ${event.source}` : ""}
                </p>
                {event.description ? <p className="mt-1 text-sm text-[#202326]">{event.description}</p> : null}
              </div>
            ))
          )}
        </div>
      </div>

      {order.address ? (
        <div className="rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-[#202326]">Delivery Address</h3>
          <p className="font-semibold text-[#202326]">{order.address.name}</p>
          <p className="text-sm text-[#202326]">{order.address.line1}</p>
          <p className="text-sm text-[#202326]">
            {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
          <p className="mt-2 text-sm text-[#5f6568]">Phone: {order.address.phone}</p>
          {order.address.altPhone ? <p className="text-sm text-[#5f6568]">Alternate: {order.address.altPhone}</p> : null}
        </div>
      ) : null}

      <div className="space-y-4 rounded-lg border border-[#d9dfd8] bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#202326]">Items in this order</h3>

        {order.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 border-b border-[#d9dfd8] pb-4 last:border-none last:pb-0 sm:flex-row sm:items-center sm:gap-4">
            <img src={item.product.images[0]} className="h-20 w-20 rounded-lg border border-[#d9dfd8] object-cover" alt={item.product.title} />

            <div className="flex-1">
              <p className="font-medium text-[#202326]">{item.product.title}</p>
              <p className="text-sm text-[#5f6568]">
                Qty: {item.quantity} x Rs {item.price}
              </p>
            </div>

            <div className="font-semibold text-[#202326] sm:text-right">Rs {item.quantity * item.price}</div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

