import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProductById } from "../services/api";

/* ------------------------- Price line chart ------------------------- */
function PriceChart({ history, target }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-gray-500">
        No price history available yet
      </div>
    );
  }

  const W = 800;
  const H = 260;
  const PAD = { top: 20, right: 24, bottom: 36, left: 56 };

  const prices = history.map((d) => d.price);
  const min = Math.min(...prices, target ?? Infinity);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xAt = (i) => PAD.left + (i / (history.length - 1)) * innerW;
  const yAt = (v) => PAD.top + innerH - ((v - min) / range) * innerH;

  const linePts = history.map((d, i) => `${xAt(i)},${yAt(d.price)}`).join(" ");
  const areaPts = `${PAD.left},${PAD.top + innerH} ${linePts} ${
    PAD.left + innerW
  },${PAD.top + innerH}`;

  const gridVals = Array.from({ length: 5 }, (_, i) => min + (range / 4) * i);

  const lowestIdx = prices.indexOf(Math.min(...prices));
  const highestIdx = prices.indexOf(Math.max(...prices));
  const targetY = target ? yAt(target) : null;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-60 w-full min-w-[600px]">
        <defs>
          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridVals.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 4"
            />
            <text
              x={PAD.left - 10}
              y={yAt(v) + 4}
              textAnchor="end"
              className="fill-gray-500"
              style={{ fontSize: 10 }}
            >
              ₹{Math.round(v).toLocaleString("en-IN")}
            </text>
          </g>
        ))}

        {targetY !== null && (
          <>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={targetY}
              y2={targetY}
              stroke="#34d399"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <text
              x={W - PAD.right - 4}
              y={targetY - 6}
              textAnchor="end"
              className="fill-green-400"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              Target ₹{target.toLocaleString("en-IN")}
            </text>
          </>
        )}

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
            r="3"
            fill="#0b0f1a"
            stroke="#a78bfa"
            strokeWidth="2"
          />
        ))}

        <circle cx={xAt(lowestIdx)} cy={yAt(prices[lowestIdx])} r="5" fill="#34d399" />
        <circle cx={xAt(highestIdx)} cy={yAt(prices[highestIdx])} r="5" fill="#f87171" />

        {history.map((d, i) => {
          if (i % 2 !== 0 && i !== history.length - 1) return null;
          return (
            <text
              key={i}
              x={xAt(i)}
              y={H - 12}
              textAnchor="middle"
              className="fill-gray-500"
              style={{ fontSize: 10 }}
            >
              {d.date?.slice(5) ?? ""}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------------------- Info Row ---------------------------- */
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-white/5 py-2.5 last:border-0">
      <span className="w-32 shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-right text-xs text-gray-300">{value}</span>
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

  /* ---------------- Fetch single product ---------------- */
  useEffect(() => {
    let mounted = true;

    const fetchOne = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductById(id);
        if (mounted) setProduct(data);
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

  /* ---------------- Loading / Error ---------------- */
  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-purple-400" />
          <p className="text-xs text-gray-500">Loading product details…</p>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
  const current = product.product_price;
  const mrp = product.discount_price;
  const target = product.target_price ?? null;
  const lowest = product.lowest_price ?? null;
  const highest = product.highest_price ?? null;
  const avg = product.average_price ?? null;
  const history = product.price_history ?? [];

  const discount =
    mrp && current ? Math.round(((mrp - current) / mrp) * 100) : 0;
  const hitTarget = target && current <= target;

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

  /* Table rows (newest first) */
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

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white"
      >
        ← Back to dashboard
      </Link>

      {/* ==================== Header ==================== */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-2xl">
            📱
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-white sm:text-lg">
              {product.product_title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                {product.platform}
              </span>
              {product.rating && <span>⭐ {product.rating}</span>}
              {product.reviews && <span>{product.reviews} reviews</span>}
              {product.brand_or_manufacturer && (
                <span>{product.brand_or_manufacturer}</span>
              )}
              <span>Added {formatDate(product.created_at)}</span>
            </div>
          </div>

          {hitTarget && (
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-400 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Target hit
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <p className="text-2xl font-semibold text-white">
            ₹{current?.toLocaleString("en-IN")}
          </p>
          {mrp && (
            <p className="text-sm text-gray-500 line-through">
              ₹{mrp.toLocaleString("en-IN")}
            </p>
          )}
          {discount > 0 && (
            <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              {discount}% off
            </span>
          )}
        </div>
      </div>

      {/* ==================== Price stats ==================== */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Target", value: target, color: "text-purple-400" },
          { label: "Lowest", value: lowest, color: "text-green-400" },
          { label: "Highest", value: highest, color: "text-red-400" },
          { label: "Average", value: avg, color: "text-gray-300" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-[11px] text-gray-500">{s.label}</p>
            <p className={`mt-1 text-sm font-semibold ${s.color}`}>
              {s.value != null ? `₹${s.value.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* ==================== Schedule ==================== */}
      {(product.last_checked || product.next_check || product.schedule) && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Tracking Schedule
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-gray-500">Frequency</p>
              <p className="mt-1 text-xs font-medium text-white">
                {product.schedule || product.check_frequency || "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Last checked</p>
              <p className="mt-1 text-xs font-medium text-white">
                {formatDateTime(product.last_checked)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Next check</p>
              <p className="mt-1 text-xs font-medium text-white">
                {formatDateTime(product.next_check)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Chart ==================== */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Price History</h2>
            <p className="text-xs text-gray-500">
              {history.length} data points recorded
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="h-2 w-2 rounded-full bg-purple-400" /> Price
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Lowest
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Highest
            </span>
          </div>
        </div>

        <PriceChart history={history} target={target} />
      </div>

      {/* ==================== History Table ==================== */}
      {historyTable.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/5 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">
              Price History Details
            </h2>
            <p className="text-xs text-gray-500">
              Every recorded price change, newest first
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[11px] text-gray-500">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-right font-medium">Change</th>
                  <th className="px-5 py-3 text-right font-medium">% Change</th>
                  <th className="px-5 py-3 text-right font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {historyTable.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-gray-300">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-white">
                      ₹{row.price.toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-medium ${
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
                      className={`px-5 py-3 text-right ${
                        row.change < 0
                          ? "text-green-400"
                          : row.change > 0
                          ? "text-red-400"
                          : "text-gray-500"
                      }`}
                    >
                      {row.change === 0 ? "—" : `${row.changePct}%`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.isLowest ? (
                        <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                          Lowest
                        </span>
                      ) : row.isHighest ? (
                        <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
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
        </div>
      )}

      {/* ==================== Highlights ==================== */}
      {product.product_details?.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Key Highlights
          </h2>
          <ul className="space-y-2.5">
            {product.product_details.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-500" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ==================== Specifications ==================== */}
      {product.additional_details &&
        Object.keys(product.additional_details).length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 text-sm font-semibold text-white">
              Specifications
            </h2>
            <div>
              {Object.entries(product.additional_details).map(([k, v]) => (
                <InfoRow key={k} label={k} value={v} />
              ))}
            </div>
          </div>
        )}

      {/* ==================== Actions ==================== */}
      <div className="mt-4 flex flex-wrap gap-3">
        {product.product_url && (
          <a
            href={product.product_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-gray-200"
          >
            Buy on {product.platform} →
          </a>
        )}
        <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]">
          Edit target price
        </button>
        <button className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]">
          Change schedule
        </button>
      </div>
    </section>
  );
}