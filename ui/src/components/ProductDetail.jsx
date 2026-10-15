import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product_api";

/* ------------------------- Helpers ------------------------- */
const NOISE = new Set(["not found", "not available", "na", "n/a", "none", "-", ""]);
const isNoise = (v) => v == null || NOISE.has(String(v).trim().toLowerCase());

const getPrices = (obj) => {
  const p1 = Number(obj?.product_price) || 0;
  const p2 = Number(obj?.discount_price) || 0;
  if (!p1 && !p2) return { current: 0, mrp: 0 };
  const current = Math.min(p1 || Infinity, p2 || Infinity);
  const mrp = Math.max(p1, p2);
  return {
    current: Number.isFinite(current) ? current : mrp,
    mrp: mrp || current,
  };
};

const splitHighlight = (str, knownKeys) => {
  const s = String(str).trim();
  for (const key of knownKeys) {
    if (s.toLowerCase().startsWith(key.toLowerCase()) && s.length > key.length) {
      return { label: key, value: s.slice(key.length).trim() };
    }
  }
  return { label: null, value: s };
};

const FREQUENCY_OPTIONS = [
  { value: "15m", label: "Every 15 minutes" },
  { value: "30m", label: "Every 30 minutes" },
  { value: "1h", label: "Every hour" },
  { value: "6h", label: "Every 6 hours" },
  { value: "12h", label: "Every 12 hours" },
  { value: "24h", label: "Once a day" },
];

/* ------------------------- Modal Shell ------------------------- */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#0b0f1a] p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="modal-title" className="text-sm font-semibold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* --------------------- Edit Target Modal --------------------- */
function EditTargetModal({
  open,
  onClose,
  currentTarget,
  currentPrice,
  lowestEver,
  onSave,
  saving,
  error,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(currentTarget != null ? String(currentTarget) : "");
  }, [open, currentTarget]);

  const num = Number(value);
  const valid = Number.isFinite(num) && num > 0;

  const quickTargets = [
    lowestEver != null && { label: "Lowest ever", value: Math.round(lowestEver) },
    currentPrice && {
      label: "−5% from now",
      value: Math.round(currentPrice * 0.95),
    },
    currentPrice && {
      label: "−10% from now",
      value: Math.round(currentPrice * 0.9),
    },
    currentPrice && {
      label: "−20% from now",
      value: Math.round(currentPrice * 0.8),
    },
  ].filter(Boolean);

  const submit = () => {
    if (!valid) return;
    onSave(Math.round(num));
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit target price">
      <div className="space-y-3">
        <label className="block">
          <span className="text-[11px] text-gray-500">
            Alert me when price drops to
          </span>
          <div className="mt-1.5 flex items-center rounded-lg border border-white/10 bg-white/[0.03] focus-within:border-purple-400/50">
            <span className="pl-3 text-xs text-gray-500">₹</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
              className="w-full bg-transparent px-2 py-2.5 text-sm text-white outline-none"
            />
          </div>
        </label>

        {quickTargets.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] text-gray-500">Quick picks</p>
            <div className="flex flex-wrap gap-1.5">
              {quickTargets.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setValue(String(q.value))}
                  className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-gray-300 transition hover:border-purple-400/40 hover:text-white"
                >
                  {q.label} · ₹{q.value.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentPrice && valid && (
          <p className="text-[11px] text-gray-500">
            Current ₹{currentPrice.toLocaleString("en-IN")} ·{" "}
            {num <= currentPrice ? (
              <span className="text-green-400">
                ₹{(currentPrice - num).toLocaleString("en-IN")} below current
              </span>
            ) : (
              <span className="text-amber-400/90">
                ₹{(num - currentPrice).toLocaleString("en-IN")} above current
              </span>
            )}
          </p>
        )}

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || saving}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save target"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------- Edit Schedule Modal ------------------- */
function EditScheduleModal({
  open,
  onClose,
  currentFrequency,
  onSave,
  saving,
  error,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(currentFrequency || "1h");
  }, [open, currentFrequency]);

  const submit = () => {
    if (!value) return;
    onSave(value);
  };

  return (
    <Modal open={open} onClose={onClose} title="Change tracking schedule">
      <div className="space-y-2">
        <p className="text-[11px] text-gray-500">
          How often should we check this product's price?
        </p>

        <div className="space-y-1.5">
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue(opt.value)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${
                  active
                    ? "border-purple-400/50 bg-purple-500/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06]"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    active
                      ? "border-purple-400 bg-purple-500"
                      : "border-white/20"
                  }`}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!value || saving}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------ Stop Tracking Modal ------------------ */
function StopTrackingModal({
  open,
  onClose,
  productTitle,
  onConfirm,
  saving,
  error,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Stop tracking this product?">
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/[0.05] p-3">
          <span className="text-lg leading-none">⚠️</span>
          <div>
            <p className="text-[11px] font-medium text-red-300">
              This will remove the product from your dashboard.
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              You'll stop receiving price alerts, and the history for this
              product won't be checked anymore.
            </p>
          </div>
        </div>

        {productTitle && (
          <p className="line-clamp-2 text-[11px] text-gray-400">
            <span className="text-gray-500">Product:</span> {productTitle}
          </p>
        )}

        {error && <p className="text-[11px] text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            Keep tracking
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Stopping…" : "Yes, stop tracking"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------- Chart ------------------------- */
function PriceChart({ history, target, lowest, highest, average }) {
  const [hover, setHover] = useState(null);

  if (!history?.length) {
    return (
      <div className="flex h-56 items-center justify-center text-xs text-gray-500">
        No price history available yet
      </div>
    );
  }

  const W = 900;
  const H = 260;
  const PAD = { top: 24, right: 72, bottom: 32, left: 16 };

  const prices = history.map((d) => d.price);
  const candidates = [Math.min(...prices), Math.max(...prices)];
  if (target != null && target > 0) candidates.push(target);
  if (lowest != null) candidates.push(lowest);
  if (highest != null) candidates.push(highest);
  if (average != null) candidates.push(average);

  const rawMin = Math.min(...candidates);
  const rawMax = Math.max(...candidates);

  const niceStep = (range) => {
    const rough = range / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough || 1)));
    const norm = rough / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  };

  const step = niceStep(rawMax - rawMin || 10);
  const min = Math.floor((rawMin - step * 0.5) / step) * step;
  const max = Math.ceil((rawMax + step * 0.5) / step) * step;
  const range = max - min || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xAt = (i) =>
    history.length === 1
      ? PAD.left + innerW / 2
      : PAD.left + (i / (history.length - 1)) * innerW;
  const yAt = (v) => PAD.top + innerH - ((v - min) / range) * innerH;

  const ticks = [];
  for (let v = min; v <= max + 0.001; v += step) ticks.push(Math.round(v));

  const linePts = history.map((d, i) => `${xAt(i)},${yAt(d.price)}`).join(" ");
  const areaPts = `${PAD.left},${PAD.top + innerH} ${linePts} ${
    PAD.left + innerW
  },${PAD.top + innerH}`;

  const allSameDay =
    history.length > 1 && history.every((h) => h.date === history[0].date);

  const xLabel = (h) => {
    if (!h.fullDate) return h.date?.slice(5) ?? "";
    if (allSameDay) {
      return new Date(h.fullDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(h.fullDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const handleMove = (e) => {
    const svg = e.currentTarget.ownerSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    let best = 0;
    let bestDist = Infinity;
    history.forEach((_, i) => {
      const d = Math.abs(xAt(i) - cursor.x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  const refs = [
    target != null && { label: "Target", value: target, color: "#34d399", dash: "6 4" },
    average != null && { label: "Avg", value: average, color: "#60a5fa", dash: "2 4" },
    lowest != null && { label: "Low", value: lowest, color: "#22c55e", dash: "1 3" },
    highest != null && { label: "High", value: highest, color: "#f87171", dash: "1 3" },
  ].filter(Boolean);

  const hoverPoint = hover != null ? history[hover] : null;
  const hoverX = hover != null ? xAt(hover) : 0;
  const hoverY = hover != null ? yAt(hoverPoint.price) : 0;
  const prevPrice = hover > 0 ? history[hover - 1].price : null;
  const delta =
    prevPrice != null && hoverPoint ? hoverPoint.price - prevPrice : 0;

  const tipW = 150;
  const tipH = 52;
  const tipX =
    hover == null
      ? 0
      : hoverX + 12 + tipW > W - PAD.right
      ? hoverX - tipW - 12
      : hoverX + 12;
  const tipY =
    hover == null
      ? 0
      : Math.max(PAD.top, Math.min(hoverY - tipH - 10, PAD.top + innerH - tipH));

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full min-w-[560px]">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="rgba(255,255,255,0.05)"
            />
            <text
              x={W - PAD.right + 8}
              y={yAt(v) + 3}
              className="fill-gray-600"
              style={{ fontSize: 10 }}
            >
              ₹{v.toLocaleString("en-IN")}
            </text>
          </g>
        ))}

        {refs.map((r) => {
          const y = yAt(r.value);
          if (y < PAD.top - 2 || y > PAD.top + innerH + 2) return null;
          return (
            <g key={r.label}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke={r.color}
                strokeWidth="1"
                strokeDasharray={r.dash}
                opacity="0.7"
              />
              <text
                x={W - PAD.right + 8}
                y={y + 3}
                fill={r.color}
                style={{ fontSize: 9, fontWeight: 600 }}
              >
                {r.label}
              </text>
            </g>
          );
        })}

        <polygon points={areaPts} fill="url(#areaGrad)" />
        <polyline
          points={linePts}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {history.map((d, i) => (
          <circle
            key={i}
            cx={xAt(i)}
            cy={yAt(d.price)}
            r={hover === i ? 5 : 3}
            fill="#0b0f1a"
            stroke="#a78bfa"
            strokeWidth="2"
          />
        ))}

        {hover != null && (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
            <g transform={`translate(${tipX}, ${tipY})`}>
              <rect
                width={tipW}
                height={tipH}
                rx="6"
                fill="rgba(15,18,30,0.95)"
                stroke="rgba(255,255,255,0.12)"
              />
              <text x="10" y="16" className="fill-gray-400" style={{ fontSize: 9 }}>
                {xLabel(hoverPoint)}
              </text>
              <text
                x="10"
                y="32"
                className="fill-white"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                ₹{hoverPoint.price.toLocaleString("en-IN")}
              </text>
              {prevPrice != null && (
                <text
                  x={tipW - 10}
                  y="32"
                  textAnchor="end"
                  fill={delta < 0 ? "#34d399" : delta > 0 ? "#f87171" : "#9ca3af"}
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {delta === 0 ? "—" : `${delta > 0 ? "+" : ""}₹${delta}`}
                </text>
              )}
            </g>
          </>
        )}

        {history.map((d, i) => {
          const showAll = history.length <= 6;
          const skip = Math.ceil(history.length / 6);
          if (!showAll && i % skip !== 0 && i !== history.length - 1) return null;
          return (
            <text
              key={i}
              x={xAt(i)}
              y={H - 10}
              textAnchor="middle"
              className="fill-gray-600"
              style={{ fontSize: 10 }}
            >
              {xLabel(d)}
            </text>
          );
        })}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: "crosshair" }}
        />
      </svg>
    </div>
  );
}

/* ---------------------------- Info Row ---------------------------- */
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2 last:border-0">
      <span className="w-32 shrink-0 text-[11px] text-gray-500">{label}</span>
      <span className="break-words text-right text-[11px] text-gray-300">
        {String(value)}
      </span>
    </div>
  );
}

/* --------------------------- Stat Pill --------------------------- */
function StatPill({ label, value, tone = "gray" }) {
  const tones = {
    white: "text-white",
    purple: "text-purple-400",
    green: "text-green-400",
    red: "text-red-400",
    gray: "text-gray-300",
  };
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${tones[tone]}`}>
        {value != null ? `₹${Number(value).toLocaleString("en-IN")}` : "—"}
      </span>
    </div>
  );
}

/* ----------------------- Product Image Box ----------------------- */
function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-3xl">
        📦
      </div>
    );
  }

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <img
        src={src}
        alt={alt || "Product"}
        onError={() => setFailed(true)}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
      />
    </div>
  );
}

/* ------------------------- Data Normalizer ------------------------- */
const normalizeDetail = (raw) => {
  if (!raw) return null;

  const product =
    raw.product && typeof raw.product === "object" ? raw.product : raw;

  const rawHistory = Array.isArray(raw.price_history)
    ? raw.price_history
    : Array.isArray(product.price_history)
    ? product.price_history
    : [];

  const { current, mrp } = getPrices(product);
  const target = Number(product.targetPrice ?? product.target_price) || null;

  const additional =
    product.additional_details && typeof product.additional_details === "object"
      ? product.additional_details
      : {};

  const cleanedSpecs = Object.fromEntries(
    Object.entries(additional).filter(([k, v]) => {
      if (isNoise(k) || isNoise(v)) return false;
      if (k.toLowerCase() === "category") return false;
      return true;
    })
  );

  const knownKeys = Object.keys(additional);
  const detailsList = (
    Array.isArray(product.product_details) ? product.product_details : []
  )
    .map((d) => splitHighlight(d, knownKeys))
    .filter((h) => h.value && !isNoise(h.value));

  const rating =
    product.rating != null && Number(product.rating) > 0
      ? Number(product.rating)
      : null;

  const rank = isNoise(product.best_sellers_rank)
    ? null
    : product.best_sellers_rank;

  const reviews = isNoise(product.reviews) ? null : product.reviews;

  const category =
    product.category ||
    additional["category"] ||
    additional["Generic Name"] ||
    null;

  const priceHistory = rawHistory
    .map((h) => {
      const { current: histPrice } = getPrices(h);
      const fullDate = h.created_at || h.date || null;
      return {
        date: fullDate ? String(fullDate).slice(0, 10) : null,
        fullDate,
        price: Number(histPrice) || 0,
      };
    })
    .filter((h) => h.price > 0 && h.date)
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  const prices = priceHistory.map((h) => h.price);
  const lowest = prices.length ? Math.min(...prices) : null;
  const highest = prices.length ? Math.max(...prices) : null;
  const average = prices.length
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;

  return {
    id: product.id,
    product_title: product.product_title || "Untitled product",
    platform: product.platform || "—",
    category,
    brand_or_manufacturer:
      product.brand_or_manufacturer ||
      additional["Brand Name"] ||
      additional["Brand"] ||
      null,

    current_price: current,
    mrp,
    target_price: target,

    lowest_price: lowest,
    highest_price: highest,
    average_price: average,

    check_frequency: product.check_frequency || null,
    last_checked:
      priceHistory.length > 0
        ? priceHistory[priceHistory.length - 1].fullDate
        : null,
    next_check: null,

    rating,
    reviews,
    created_at: product.created_at,
    product_url: product.product_link || null,
    best_sellers_rank: rank,
    image: product.product_image_link || null,

    email_alert: product.email_alert ?? false,
    push_notifications: product.push_notifications ?? false,

    product_details: detailsList,
    additional_details: cleanedSpecs,
    price_history: priceHistory,
  };
};

/* ----------------------- Collapsible Section ----------------------- */
function CollapsibleSection({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {count != null && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400">
              {count}
            </span>
          )}
        </div>
        <span
          className={`text-xs text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && <div className="border-t border-white/5 px-5 py-3">{children}</div>}
    </div>
  );
}

/* -------------------------------- Page -------------------------------- */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllDetails, setShowAllDetails] = useState(false);

  /* Modal + save state */
  const [targetOpen, setTargetOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchOne = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = await getProductById(id);
        const normalized = normalizeDetail(raw);
        if (mounted) setProduct(normalized);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load product details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (id) fetchOne();
    return () => {
      mounted = false;
    };
  }, [id]);

  /* Toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* --------- Save handlers --------- */
  const saveTarget = async (newTarget) => {
    if (!product) return;
    setSaving(true);
    setSaveError(null);
    const prev = product.target_price;
    setProduct((p) => ({ ...p, target_price: newTarget }));

    try {
      await updateProduct(product.id, { targetPrice: newTarget });
      setTargetOpen(false);
      setToast(`Target updated to ₹${newTarget.toLocaleString("en-IN")}`);
    } catch (e) {
      console.error(e);
      setProduct((p) => ({ ...p, target_price: prev }));
      setSaveError("Couldn't save target. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async (newFrequency) => {
    if (!product) return;
    setSaving(true);
    setSaveError(null);
    const prev = product.check_frequency;
    setProduct((p) => ({ ...p, check_frequency: newFrequency }));

    try {
      await updateProduct(product.id, { check_frequency: newFrequency });
      setScheduleOpen(false);
      const label =
        FREQUENCY_OPTIONS.find((o) => o.value === newFrequency)?.label ??
        newFrequency;
      setToast(`Schedule set to "${label}"`);
    } catch (e) {
      console.error(e);
      setProduct((p) => ({ ...p, check_frequency: prev }));
      setSaveError("Couldn't save schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stopTracking = async () => {
    if (!product) return;
    setSaving(true);
    setSaveError(null);
    try {
      await deleteProduct(product.id);
      setStopOpen(false);
      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setSaveError("Couldn't stop tracking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const closeTarget = () => {
    if (saving) return;
    setTargetOpen(false);
    setSaveError(null);
  };

  const closeSchedule = () => {
    if (saving) return;
    setScheduleOpen(false);
    setSaveError(null);
  };

  const closeStop = () => {
    if (saving) return;
    setStopOpen(false);
    setSaveError(null);
  };

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-purple-400" />
          <p className="text-xs text-gray-500">Loading product details…</p>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-8 text-center">
          <p className="text-sm font-medium text-red-400">
            {error || "Product not found"}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
          >
            ← Back to dashboard
          </button>
        </div>
      </section>
    );
  }

  /* ---------------- Derived ---------------- */
  const current = product.current_price;
  const mrp = product.mrp;
  const target = product.target_price;
  const lowest = product.lowest_price;
  const highest = product.highest_price;
  const avg = product.average_price;
  const history = product.price_history;

  const discount =
    mrp && current ? Math.round(((mrp - current) / mrp) * 100) : 0;
  const hitTarget = target != null && current <= target;
  const gapToTarget = target != null ? current - target : null;

  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const formatDateTime = (iso) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const historyTable = [...history]
    .map((d, i, arr) => {
      const prev = i > 0 ? arr[i - 1].price : null;
      const change = prev !== null ? d.price - prev : 0;
      const changePct = prev ? ((change / prev) * 100).toFixed(1) : "0.0";
      return {
        ...d,
        change,
        changePct,
        isLowest: lowest !== null && d.price === lowest,
        isHighest: highest !== null && d.price === highest,
      };
    })
    .reverse();

  const specEntries = Object.entries(product.additional_details);
  const visibleSpecs = showAllDetails ? specEntries : specEntries.slice(0, 6);

  const freqLabel =
    FREQUENCY_OPTIONS.find((o) => o.value === product.check_frequency)?.label ||
    product.check_frequency ||
    "—";

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white"
      >
        ← Back to dashboard
      </Link>

      {/* ==================== Header ==================== */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-4">
          <ProductImage src={product.image} alt={product.product_title} />

          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold text-white sm:text-base">
              {product.product_title}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                {product.platform}
              </span>
              {product.category && (
                <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
                  {product.category}
                </span>
              )}
              {product.rating ? <span>⭐ {product.rating}</span> : null}
              {product.reviews ? <span>{product.reviews} reviews</span> : null}
              {product.brand_or_manufacturer ? (
                <span>{product.brand_or_manufacturer}</span>
              ) : null}
              <span>Added {formatDate(product.created_at)}</span>
            </div>

            {product.best_sellers_rank && (
              <p className="mt-1 text-[11px] text-gray-500">
                🏆 {product.best_sellers_rank}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <p className="text-xl font-semibold text-white">
                ₹{current.toLocaleString("en-IN")}
              </p>
              {mrp > current && (
                <>
                  <p className="text-xs text-gray-500 line-through">
                    ₹{mrp.toLocaleString("en-IN")}
                  </p>
                  <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            {target != null && (
              <p
                className={`mt-1 text-[11px] ${
                  hitTarget ? "text-green-400" : "text-amber-400/90"
                }`}
              >
                {hitTarget
                  ? `Below your target of ₹${target.toLocaleString("en-IN")} 🎉`
                  : `₹${gapToTarget.toLocaleString(
                      "en-IN"
                    )} above your target of ₹${target.toLocaleString("en-IN")}`}
              </p>
            )}
          </div>

          {hitTarget && (
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium text-green-400 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Target hit
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {product.product_url && (
            <a
              href={product.product_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
            >
              Buy on {product.platform} →
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setTargetOpen(true);
            }}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
          >
            Edit target
          </button>
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setScheduleOpen(true);
            }}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
          >
            Change schedule
          </button>
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setStopOpen(true);
            }}
            className="rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3.5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            Stop tracking
          </button>
        </div>
      </div>

      {/* ==================== Chart + Schedule ==================== */}
      <div className="mt-3 grid items-start gap-3 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-white">Price History</h2>
            <span className="text-[10px] text-gray-500">
              {history.length} data point{history.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/5 py-2.5 text-[11px]">
            <StatPill label="Current" value={current} tone="white" />
            <StatPill label="Target" value={target} tone="purple" />
            <StatPill label="Lowest" value={lowest} tone="green" />
            <StatPill label="Highest" value={highest} tone="red" />
            <StatPill label="Avg" value={avg} tone="gray" />
          </div>

          {history.length > 0 ? (
            <PriceChart
              history={history}
              target={target}
              lowest={lowest}
              highest={highest}
              average={avg}
            />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-white/10 text-center">
              <div>
                <p className="text-xs font-medium text-white">
                  No price history yet
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  We'll start recording prices after the first scheduled check.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white">
              Tracking Schedule
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Frequency</span>
              <span className="font-medium text-white">{freqLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last checked</span>
              <span className="font-medium text-white">
                {formatDateTime(product.last_checked)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Next check</span>
              <span className="font-medium text-white">
                {formatDateTime(product.next_check)}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-gray-500">Email alerts</span>
              <span
                className={
                  product.email_alert ? "text-green-400" : "text-gray-400"
                }
              >
                {product.email_alert ? "On" : "Off"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Push</span>
              <span
                className={
                  product.push_notifications
                    ? "text-green-400"
                    : "text-gray-400"
                }
              >
                {product.push_notifications ? "On" : "Off"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setScheduleOpen(true);
            }}
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-white transition hover:bg-white/[0.06]"
          >
            Change schedule
          </button>
        </div>
      </div>

      {/* ==================== History Table ==================== */}
      {historyTable.length > 0 && (
        <div className="mt-3">
          <CollapsibleSection
            title="Price History Details"
            count={historyTable.length}
            defaultOpen={true}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-[11px]">
                <thead>
                  <tr className="text-[10px] text-gray-500">
                    <th className="py-2 font-medium">When</th>
                    <th className="py-2 text-right font-medium">Price</th>
                    <th className="py-2 text-right font-medium">Change</th>
                    <th className="py-2 text-right font-medium">%</th>
                    <th className="py-2 text-right font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTable.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="py-2 text-gray-300">
                        {formatDateTime(row.fullDate)}
                      </td>
                      <td className="py-2 text-right font-medium text-white">
                        ₹{row.price.toLocaleString("en-IN")}
                      </td>
                      <td
                        className={`py-2 text-right font-medium ${
                          row.change < 0
                            ? "text-green-400"
                            : row.change > 0
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        {row.change === 0
                          ? "—"
                          : `${row.change > 0 ? "+" : ""}₹${row.change.toLocaleString(
                              "en-IN"
                            )}`}
                      </td>
                      <td
                        className={`py-2 text-right ${
                          row.change < 0
                            ? "text-green-400"
                            : row.change > 0
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        {row.change === 0 ? "—" : `${row.changePct}%`}
                      </td>
                      <td className="py-2 text-right">
                        {row.isLowest ? (
                          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] font-medium text-green-400">
                            Lowest
                          </span>
                        ) : row.isHighest ? (
                          <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-400">
                            Highest
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ==================== Highlights + Specs ==================== */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {product.product_details.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-xs font-semibold text-white">
              Key Highlights
            </h2>
            <ul className="space-y-2">
              {product.product_details.map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-gray-300"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
                  <span className="break-words">
                    {d.label ? (
                      <>
                        <span className="text-gray-500">{d.label}:</span>{" "}
                        <span className="text-white">{d.value}</span>
                      </>
                    ) : (
                      d.value
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {specEntries.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white">
                Specifications
              </h2>
              {specEntries.length > 6 && (
                <button
                  onClick={() => setShowAllDetails((s) => !s)}
                  className="text-[10px] font-medium text-purple-400 transition hover:text-purple-300"
                >
                  {showAllDetails
                    ? "Show less"
                    : `Show all (${specEntries.length})`}
                </button>
              )}
            </div>

            <div>
              {visibleSpecs.map(([k, v]) => (
                <InfoRow key={k} label={k} value={v} />
              ))}
            </div>

            {!showAllDetails && specEntries.length > 6 && (
              <p className="mt-2 text-center text-[10px] text-gray-500">
                +{specEntries.length - 6} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* ==================== Modals ==================== */}
      <EditTargetModal
        open={targetOpen}
        onClose={closeTarget}
        currentTarget={target}
        currentPrice={current}
        lowestEver={lowest}
        onSave={saveTarget}
        saving={saving}
        error={saveError}
      />

      <EditScheduleModal
        open={scheduleOpen}
        onClose={closeSchedule}
        currentFrequency={product.check_frequency}
        onSave={saveSchedule}
        saving={saving}
        error={saveError}
      />

      <StopTrackingModal
        open={stopOpen}
        onClose={closeStop}
        productTitle={product.product_title}
        onConfirm={stopTracking}
        saving={saving}
        error={saveError}
      />

      {/* ==================== Toast ==================== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs font-medium text-green-300 shadow-2xl backdrop-blur">
          ✓ {toast}
        </div>
      )}
    </section>
  );
}