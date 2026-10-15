import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    getLatestNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../services/product_api";
import { AuthProvider, useAuth } from "../context/AuthContext";

/* ------------------- Time formatting ------------------- */
const timeAgo = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then) / 1000; // seconds

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

/* ------------------- Type metadata ------------------- */
const TYPE_META = {
    target_hit: { icon: "🎯", color: "text-green-400", bg: "bg-green-500/10" },
    price_drop: { icon: "📉", color: "text-blue-400", bg: "bg-blue-500/10" },
    price_up: { icon: "📈", color: "text-red-400", bg: "bg-red-500/10" },
    back_in_stock: { icon: "📦", color: "text-purple-400", bg: "bg-purple-500/10" },
    default: { icon: "🔔", color: "text-gray-400", bg: "bg-white/5" },
};

/* ------------------- Bell icon (inline SVG) ------------------- */
function BellIcon({ className = "h-5 w-5" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

/* ------------------- Single notification item ------------------- */
function NotificationItem({ n, onClick }) {
    const meta = TYPE_META[n.type] || TYPE_META.default;

    return (
        <button
            type="button"
            onClick={() => onClick(n)}
            className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.04] ${n.is_read ? "opacity-70" : ""
                }`}
        >
            <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${meta.bg}`}
            >
                {meta.icon}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                    <span
                        className={`line-clamp-2 text-[11px] leading-snug ${n.is_read ? "text-gray-400" : "font-medium text-white"
                            }`}
                    >
                        {n.message || n.product_title || "Notification"}
                    </span>
                    {!n.is_read && (
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                    )}
                </span>

                {n.message && n.product_title && (
                    <span className="mt-0.5 line-clamp-1 block text-[10px] text-gray-500">
                        {n.product_title}
                    </span>
                )}

                <span className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{timeAgo(n.created_at)}</span>
                    {n.old_price != null && n.new_price != null && (
                        <>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-500">
                                ₹{Number(n.old_price).toLocaleString("en-IN")} →{" "}
                                <span
                                    className={
                                        Number(n.new_price) < Number(n.old_price)
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }
                                >
                                    ₹{Number(n.new_price).toLocaleString("en-IN")}
                                </span>
                            </span>
                        </>
                    )}
                </span>
            </span>
        </button>
    );
}

/* =================================================================== */
/*  NotificationBell                                                   */
/* =================================================================== */
export default function NotificationBell({ mobileMode = false }) {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const wrapRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");

    const unread = items.filter((n) => !n.is_read).length;

    /* ------------------- Fetch ------------------- */
    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getLatestNotifications(user?.id);
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.notifications)
                    ? data.notifications
                    : [];
            setItems(list);
        } catch (e) {
            console.error("Failed to load notifications:", e);
            setError("Couldn't load notifications");
        } finally {
            setLoading(false);
        }
    }, []);

    /* Initial load + poll every 60s */
    useEffect(() => {
        load();
        const id = setInterval(load, 60000);
        return () => clearInterval(id);
    }, [load]);

    /* Refresh when the panel opens, so the badge is always fresh */
    useEffect(() => {
        if (open) load();
    }, [open, load]);

    /* Close on outside click */
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    /* Close on Escape */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    /* ------------------- Actions ------------------- */
    const handleItemClick = async (n) => {
        setOpen(false);

        /* Optimistic mark read */
        if (!n.is_read) {
            setItems((prev) =>
                prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
            );
            try {
                await markNotificationRead(n.id);
            } catch (e) {
                console.error("Failed to mark read:", e);
                /* Roll back on failure */
                setItems((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x))
                );
            }
        }

        if (n.product_id) navigate(`/product/${n.product_id}`);
    };

    const handleMarkAllRead = async () => {
        const prev = items;
        setItems((p) => p.map((x) => ({ ...x, is_read: true })));
        try {
            await markAllNotificationsRead(user?.id);
        } catch (e) {
            console.error("Failed to mark all read:", e);
            setItems(prev);
        }
    };

    /* ------------------- Panel ------------------- */
    const panel = (
        <div
            className={
                mobileMode
                    ? "mt-3 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur"
                    : "absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0b0f1a]/95 shadow-2xl backdrop-blur"
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white">Notifications</h3>
                    {unread > 0 && (
                        <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-medium text-purple-300">
                            {unread} new
                        </span>
                    )}
                </div>

                {unread > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-medium text-purple-400 transition hover:text-purple-300"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="max-h-96 overflow-y-auto p-1.5">
                {loading && items.length === 0 ? (
                    <div className="py-8 text-center">
                        <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
                    </div>
                ) : error ? (
                    <div className="px-3 py-6 text-center">
                        <p className="text-[11px] text-red-400">{error}</p>
                        <button
                            type="button"
                            onClick={load}
                            className="mt-2 text-[10px] font-medium text-purple-400 transition hover:text-purple-300"
                        >
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-2xl">🔔</p>
                        <p className="mt-2 text-xs font-medium text-white">
                            No notifications yet
                        </p>
                        <p className="mt-1 text-[10px] text-gray-500">
                            We'll notify you when a tracked price drops.
                        </p>
                    </div>
                ) : (
                    items.map((n) => (
                        <NotificationItem key={n.id} n={n} onClick={handleItemClick} />
                    ))
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="border-t border-white/5">
                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            navigate("/notifications");
                        }}
                        className="w-full px-4 py-2.5 text-center text-[11px] font-medium text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );

    /* ------------------- Mobile variant ------------------- */
    if (mobileMode) {
        return (
            <div ref={wrapRef}>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                    <span className="flex items-center gap-2">
                        <BellIcon className="h-4 w-4" />
                        Notifications
                    </span>
                    {unread > 0 && (
                        <span className="rounded-full bg-purple-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </button>
                {open && panel}
            </div>
        );
    }

    /* ------------------- Desktop variant ------------------- */
    return (
        <div ref={wrapRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
                aria-expanded={open}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
                <BellIcon className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-500 px-1 text-[9px] font-semibold text-white ring-2 ring-[#0b0f1a]">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            {open && panel}
        </div>
    );
}