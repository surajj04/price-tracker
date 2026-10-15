import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getProductByUserID, normalizeProduct } from "../services/product_api";

/* ------------------------------ Constants ------------------------------ */
const CATEGORY_ICONS = {
  Mobiles: "📱",
  Audio: "🎧",
  Footwear: "👟",
  Wearables: "⌚",
  Clothing: "👖",
  Computers: "💻",
  default: "📦",
};

const PLATFORM_COLORS = {
  Amazon: "text-orange-400 bg-orange-500/10",
  Flipkart: "text-blue-400 bg-blue-500/10",
  Myntra: "text-pink-400 bg-pink-500/10",
  Ajio: "text-indigo-400 bg-indigo-500/10",
  Meesho: "text-purple-400 bg-purple-500/10",
};

/* --------------------------- Time helper --------------------------- */
const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} d ago`;
};

/* ---------------------------- Stat Card ---------------------------- */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-600">{sub}</p>}
    </div>
  );
}

/* --------------------------- Product Image --------------------------- */
function ProductImage({ src, alt, category }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
        {CATEGORY_ICONS[category] || CATEGORY_ICONS.default}
      </div>
    );
  }

  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
      <img
        src={src}
        alt={alt || "Product"}
        onError={() => setFailed(true)}
        loading="lazy"
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

/* ---------------------------- Product Row ---------------------------- */
function ProductRow({ product, onClick }) {
  const current = product.current_price;
  const mrp = product.mrp;
  const target = product.target_price;
  const lowest = product.lowest_price;
  const highest = product.highest_price;

  const hasValidCurrent = current != null && current > 0;
  const hitTarget =
    target != null && hasValidCurrent && current <= target;
  const isLowest =
    lowest != null && hasValidCurrent && current <= lowest;
  const discount = product.discount_pct || 0;

  const storeClass =
    PLATFORM_COLORS[product.platform] || "text-gray-400 bg-white/5";

  return (
    <button
      onClick={onClick}
      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/5 px-5 py-4 text-left transition last:border-0 hover:bg-white/[0.03]"
    >
      <ProductImage
        src={product.image}
        alt={product.product_title}
        category={product.category}
      />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-white">
            {product.product_title}
          </h3>
          {isLowest && (
            <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
              All-time low
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {product.platform && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${storeClass}`}
            >
              {product.platform}
            </span>
          )}
          {product.rating ? <span>⭐ {product.rating}</span> : null}
          {product.reviews ? <span>{product.reviews} reviews</span> : null}
          {product.last_checked && (
            <span className="hidden sm:inline">
              Checked {timeAgo(product.last_checked)}
            </span>
          )}
        </div>

        {(lowest || highest || product.schedule) && (
          <div className="mt-1.5 hidden items-center gap-x-3 text-[10px] text-gray-600 sm:flex">
            {lowest && <span>Low ₹{lowest.toLocaleString("en-IN")}</span>}
            {highest && (
              <>
                <span className="text-gray-700">·</span>
                <span>High ₹{highest.toLocaleString("en-IN")}</span>
              </>
            )}
            {product.schedule && (
              <>
                <span className="text-gray-700">·</span>
                <span className="text-gray-500">{product.schedule}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {target && (
          <div className="hidden text-right sm:block">
            <p className="text-[10px] text-gray-500">Target</p>
            <p
              className={`text-xs font-medium ${
                hitTarget ? "text-green-400" : "text-gray-300"
              }`}
            >
              ₹{target.toLocaleString("en-IN")}
            </p>
          </div>
        )}

        <div className="text-right">
          <p className="text-[10px] text-gray-500">Current</p>
          <p className="text-sm font-semibold text-white">
            {hasValidCurrent
              ? `₹${current.toLocaleString("en-IN")}`
              : "—"}
          </p>
          {discount > 0 && (
            <p className="text-[10px] text-green-400">{discount}% off</p>
          )}
        </div>

        <span
          className={`hidden h-2 w-2 shrink-0 rounded-full sm:block ${
            hitTarget ? "bg-green-400 animate-pulse" : "bg-yellow-400"
          }`}
        />
      </div>
    </button>
  );
}

/* ------------------------------ Dashboard ------------------------------ */
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  /* ---------------------- Fetch products ---------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = localStorage.getItem("userId") || 1;
        const data = await getProductByUserID(userId);
        console.log("📦 DASHBOARD DATA:", data);

        if (mounted) {
          const normalized = (data || []).map(normalizeProduct);
          setProducts(normalized);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (mounted) {
          setError("Failed to load products. Please try again.");
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [location.key]); // ← refetch on every navigation

  /* ------------------------------ Stats ------------------------------ */
  const stats = useMemo(() => {
    const total = products.length;
    const hits = products.filter(
      (p) =>
        p.target_price &&
        p.current_price > 0 &&
        p.current_price <= p.target_price
    ).length;
    const saved = products.reduce(
      (acc, p) => acc + ((p.mrp || 0) - (p.current_price || 0)),
      0
    );
    return { total, hits, saved };
  }, [products]);

  const atLowCount = useMemo(
    () =>
      products.filter(
        (p) =>
          p.lowest_price && p.current_price > 0 && p.current_price <= p.lowest_price
      ).length,
    [products]
  );

  /* ----------------------------- Filter ----------------------------- */
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = query.toLowerCase();
      const matchQuery =
        p.product_title?.toLowerCase().includes(q) ||
        p.brand_or_manufacturer?.toLowerCase().includes(q);

      const matchFilter =
        filter === "all"
          ? true
          : filter === "hits"
          ? p.target_price &&
            p.current_price > 0 &&
            p.current_price <= p.target_price
          : !p.target_price ||
            p.current_price <= 0 ||
            p.current_price > p.target_price;

      return matchQuery && matchFilter;
    });
  }, [products, filter, query]);

  return (
    <div className="relative z-10 mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-white">Dashboard</h1>
              <p className="text-xs text-gray-500">
                Track prices across multiple stores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition focus:border-white/20 sm:w-48"
            />
            <button
              onClick={() => navigate("/add-product")}
              className="shrink-0 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Tracked" value={stats.total} />
          <StatCard
            label="Targets hit"
            value={stats.hits}
            accent="text-green-400"
          />
          <StatCard
            label="At all-time low"
            value={atLowCount}
            accent="text-purple-400"
          />
          <StatCard
            label="Total savings"
            value={`₹${stats.saved.toLocaleString("en-IN")}`}
          />
        </div>

        {/* Filters */}
        <div className="mb-3 flex items-center gap-1 border-b border-white/5 pb-2">
          {[
            { id: "all", label: "All" },
            { id: "watching", label: "Watching" },
            { id: "hits", label: "Target hit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filter === tab.id
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-gray-500">
            {filtered.length} items
          </span>
        </div>

        {/* Product list */}
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-purple-400" />
            <p className="text-xs text-gray-500">Loading your products…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-8 text-center">
            <p className="text-sm font-medium text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06]"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-sm font-medium text-white">
              {products.length === 0
                ? "No products yet"
                : "No products match your filter"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {products.length === 0
                ? "Add a product link to start tracking its price."
                : "Try a different search or filter."}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => navigate("/add-product")}
                className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
              >
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="hidden grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/5 px-5 py-2.5 text-[10px] font-medium text-gray-500 sm:grid">
              <span className="w-12" />
              <span>Product</span>
              <span className="text-right">Prices</span>
            </div>

            {filtered.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                onClick={() => navigate(`/product/${p.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}