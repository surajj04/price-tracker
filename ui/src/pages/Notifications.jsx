import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/product_api";

/* =================================================================== */
/*  Helpers                                                            */
/* =================================================================== */
const timeAgo = (iso) => {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const absoluteTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

/* ------------------------------------------------------------------ */
/*  Price extraction & comparison                                      */
/* ------------------------------------------------------------------ */

/* Pull every ₹ number out of a message string.
   "... ₹249.00 ... target price was ₹299.00." → [249, 299]              */
const parsePrices = (message) => {
  if (!message) return [];
  const matches = [...String(message).matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)];
  return matches.map((m) => Number(m[1].replace(/,/g, "")));
};

/* Build a normalized price summary for a notification.
   Returns:
     current    → current selling price (₹249)
     mrp        → original / list price (₹1,999) — from product_price
     target     → user's target (₹299) — from target_price
     belowTarget→ current <= target
     savings    → target - current (₹50) when below
     discount   → % off vs MRP (87%) when mrp > current
     overTarget → current - target (₹X) when above                             */
const buildPriceSummary = (n) => {
  const prices = parsePrices(n.message);

  /* Current price priority:
     1. explicit current_price / new_price field
     2. first ₹ amount in message (backend always puts "now available for ₹X" first)
     3. fallback null                                                    */
  const current =
    n.current_price != null
      ? Number(n.current_price)
      : n.new_price != null
      ? Number(n.new_price)
      : prices[0] ?? null;

  /* MRP — backend sends product_price as the original list price */
  const mrp = n.product_price != null ? Number(n.product_price) : null;

  /* Target — either explicit field, or second ₹ amount in message */
  const target =
    n.target_price != null
      ? Number(n.target_price)
      : prices.length > 1
      ? prices[1]
      : null;

  const belowTarget = current != null && target != null && current <= target;
  const savings = belowTarget ? target - current : 0;
  const overTarget = !belowTarget && current != null && target != null
    ? current - target
    : 0;

  const discount =
    mrp != null && current != null && mrp > current && mrp > 0
      ? Math.round(((mrp - current) / mrp) * 100)
      : 0;

  return { current, mrp, target, belowTarget, savings, overTarget, discount };
};

/* ------------------------------------------------------------------ */
/*  Notification type helpers                                          */
/* ------------------------------------------------------------------ */

/* A notification is a "target hit" when type says so OR the title
   contains "target". The backend currently sends type="price_drop"
   for these, so we fall back to the title.                           */
const isTargetHit = (n) =>
  n.type === "target_hit" ||
  (typeof n.title === "string" && n.title.toLowerCase().includes("target"));

/* Plain price drop = a drop that is NOT a target hit */
const isPriceDrop = (n) => n.type === "price_drop" && !isTargetHit(n);

const isPriceUp = (n) => n.type === "price_up";

/* Extract product ID from product_id or action_url ("/products/8" → 8) */
const getProductId = (n) => {
  if (n.product_id != null) return Number(n.product_id);
  if (n.action_url) {
    const m = String(n.action_url).match(/\/(\d+)\/?$/);
    if (m) return Number(m[1]);
  }
  return null;
};

/* ------------------------------------------------------------------ */
/*  Type metadata                                                      */
/* ------------------------------------------------------------------ */
const TYPE_META = {
  target_hit: {
    icon: "🎯",
    label: "Target hit",
    color: "text-green-400",
    bg: "bg-green-500/10",
    ring: "ring-green-500/20",
  },
  price_drop: {
    icon: "📉",
    label: "Price drop",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  price_up: {
    icon: "📈",
    label: "Price up",
    color: "text-red-400",
    bg: "bg-red-500/10",
    ring: "ring-red-500/20",
  },
  back_in_stock: {
    icon: "📦",
    label: "Back in stock",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    ring: "ring-purple-500/20",
  },
  default: {
    icon: "🔔",
    label: "Update",
    color: "text-gray-400",
    bg: "bg-white/5",
    ring: "ring-white/10",
  },
};

const getMeta = (n) => {
  if (isTargetHit(n)) return TYPE_META.target_hit;
  return TYPE_META[n.type] || TYPE_META.default;
};

/* ------------------------------------------------------------------ */
/*  Date grouping                                                      */
/* ------------------------------------------------------------------ */
const getDateGroup = (iso) => {
  if (!iso) return "Older";
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dDay.getTime() === today.getTime()) return "Today";
  if (dDay.getTime() === yesterday.getTime()) return "Yesterday";
  if (dDay >= weekAgo) return "Earlier this week";
  return "Older";
};

const GROUP_ORDER = ["Today", "Yesterday", "Earlier this week", "Older"];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "target_hit", label: "Target hits" },
  { id: "price_drop", label: "Price drops" },
  { id: "price_up", label: "Price rises" },
];

/* =================================================================== */
/*  Notification Card                                                  */
/* =================================================================== */
function NotificationCard({ n, onClick, onMarkRead }) {
  const meta = getMeta(n);
  const price = buildPriceSummary(n);

  const hasProduct = getProductId(n) !== null;
  const actionLabel = hasProduct ? "View product" : "Go to dashboard";

  return (
    <div
      className={`group relative rounded-xl border p-4 transition ${
        n.is_read
          ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
          : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {!n.is_read && (
        <span className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-purple-500" />
      )}

      <div className="flex items-start gap-3.5">
        {/* Icon tile */}
        <button
          type="button"
          onClick={() => onClick(n)}
          className="shrink-0"
          aria-label={actionLabel}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ring-1 ${meta.bg} ${meta.ring}`}
          >
            {meta.icon}
          </div>
        </button>

        <div className="min-w-0 flex-1">
          {/* Row 1: badge + time + mark-read */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${meta.bg} ${meta.color}`}
            >
              {n.title || meta.label}
            </span>
            <span className="text-[10px] text-gray-500">
              {timeAgo(n.created_at)}
            </span>

            {!n.is_read && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(n);
                }}
                aria-label="Mark as read"
                className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-500 opacity-0 transition group-hover:opacity-100 hover:border-purple-400/40 hover:text-purple-400"
              >
                <span className="text-[9px]">✓</span>
              </button>
            )}
          </div>

          {/* Row 2: message body */}
          <p
            className={`mt-1.5 line-clamp-3 text-[12px] leading-snug ${
              n.is_read ? "text-gray-400" : "text-gray-200"
            }`}
          >
            {n.message}
          </p>

          {/* Row 3: price comparison strip */}
          <PriceComparison price={price} />

          {/* Row 4: absolute time + action link */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-gray-600">
              {absoluteTime(n.created_at)}
            </span>

            <button
              type="button"
              onClick={() => onClick(n)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition ${
                hasProduct
                  ? "text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {actionLabel}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================================================================== */
/*  Price Comparison strip                                             */
/* =================================================================== */
function PriceComparison({ price }) {
  const { current, mrp, target, belowTarget, savings, overTarget, discount } =
    price;

  if (current == null && target == null && mrp == null) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {/* Current price — primary */}
      {current != null && (
        <span className="inline-flex items-baseline gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-500">
            Now
          </span>
          <span className="text-[13px] font-semibold text-white">
            ₹{current.toLocaleString("en-IN")}
          </span>
          {mrp != null && mrp > current && (
            <>
              <span className="text-[11px] text-gray-500 line-through">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-medium text-green-400">
                {discount}% off
              </span>
            </>
          )}
        </span>
      )}

      {/* Target comparison */}
      {target != null && (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] ${
            belowTarget
              ? "border border-green-500/20 bg-green-500/10 text-green-300"
              : "border border-purple-500/20 bg-purple-500/10 text-purple-300"
          }`}
        >
          <span className="text-[10px] uppercase tracking-wide opacity-70">
            Target
          </span>
          <span className="font-semibold">
            ₹{target.toLocaleString("en-IN")}
          </span>
        </span>
      )}

      {/* Outcome chip */}
      {current != null && target != null && (
        <>
          {belowTarget && savings > 0 ? (
            <span className="rounded-md bg-green-500/15 px-2.5 py-1.5 text-[11px] font-medium text-green-400">
              ↓ ₹{savings.toLocaleString("en-IN")} below target
            </span>
          ) : (
            <span className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-400">
              ₹{overTarget.toLocaleString("en-IN")} above target
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* =================================================================== */
/*  Skeleton + Empty                                                   */
/* =================================================================== */
function SkeletonCard() {
  return (
    <div className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-white/5" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

function EmptyState({ filter }) {
  const messages = {
    all: {
      icon: "🔔",
      title: "No notifications yet",
      body: "We'll alert you the moment a tracked price changes.",
    },
    unread: {
      icon: "✅",
      title: "You're all caught up",
      body: "No unread notifications. Nice work.",
    },
    target_hit: {
      icon: "🎯",
      title: "No target hits yet",
      body: "We'll let you know the moment a price reaches your target.",
    },
    price_drop: {
      icon: "📉",
      title: "No price drops yet",
      body: "Nothing has dropped recently — we're watching.",
    },
    price_up: {
      icon: "📈",
      title: "No price rises yet",
      body: "Good news — nothing has gone up lately.",
    },
  };
  const m = messages[filter] || messages.all;

  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
      <p className="text-3xl">{m.icon}</p>
      <p className="mt-3 text-sm font-medium text-white">{m.title}</p>
      <p className="mt-1 text-[11px] text-gray-500">{m.body}</p>
    </div>
  );
}

/* =================================================================== */
/*  Page                                                               */
/* =================================================================== */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  /* ------------------- Load ------------------- */
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications(userId);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : [];
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(list);
    } catch (e) {
      console.error("Failed to load notifications:", e);
      setError("Couldn't load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------- Actions ------------------- */
  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
      try {
        await markNotificationRead(n.id);
      } catch (e) {
        console.error(e);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x))
        );
      }
    }

    const pid = getProductId(n);
    if (pid) navigate(`/product/${pid}`);
    else navigate("/dashboard");
  };

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );
    try {
      await markNotificationRead(n.id);
    } catch (e) {
      console.error(e);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x))
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    const prev = items;
    setItems((p) => p.map((x) => ({ ...x, is_read: true })));
    try {
      await markAllNotificationsRead(userId);
    } catch (e) {
      console.error(e);
      setItems(prev);
    }
  };

  /* ------------------- Derived ------------------- */
  const totalUnread = useMemo(
    () => items.filter((n) => !n.is_read).length,
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.is_read);
    if (filter === "target_hit") return items.filter(isTargetHit);
    if (filter === "price_drop") return items.filter(isPriceDrop);
    if (filter === "price_up") return items.filter(isPriceUp);
    return items;
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((n) => {
      const g = getDateGroup(n.created_at);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(n);
    });
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      label: g,
      items: map.get(g),
    }));
  }, [filtered]);

  /* ------------------- Render ------------------- */
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white"
      >
        ← Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            Notifications
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            {totalUnread > 0
              ? `${totalUnread} unread · ${items.length} total`
              : `${items.length} total`}
          </p>
        </div>

        {totalUnread > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f.id;

          const count =
            f.id === "all"
              ? items.length
              : f.id === "unread"
              ? totalUnread
              : f.id === "target_hit"
              ? items.filter(isTargetHit).length
              : f.id === "price_drop"
              ? items.filter(isPriceDrop).length
              : f.id === "price_up"
              ? items.filter(isPriceUp).length
              : 0;

          /* Auto-hide filters with no matches, except All/Unread */
          if (f.id !== "all" && f.id !== "unread" && count === 0) {
            return null;
          }

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] ${
                    active
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-8 text-center">
          <p className="text-2xl">⚠️</p>
          <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 flex items-center gap-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] text-gray-600">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    n={n}
                    onClick={handleItemClick}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}