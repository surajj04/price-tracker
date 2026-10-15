import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trackProduct, addProductToTrack } from "../services/product_api";

/* ------------------------- Scrape steps ------------------------- */
const SCRAPE_STEPS = [
  { id: "url", label: "Validating URL" },
  { id: "fetch", label: "Fetching product page" },
  { id: "parse", label: "Extracting details" },
  { id: "save", label: "Preparing preview" },
  { id: "done", label: "Ready" },
];

const SCHEDULE_OPTIONS = [
  { id: "15m", label: "Every 15 minutes" },
  { id: "30m", label: "Every 30 minutes" },
  { id: "1h", label: "Every hour" },
  { id: "2h", label: "Every 2 hours" },
  { id: "6h", label: "Every 6 hours" },
  { id: "12h", label: "Every 12 hours" },
  { id: "24h", label: "Every day" },
];

const CATEGORY_ICONS = {
  Mobiles: "📱",
  Audio: "🎧",
  Footwear: "👟",
  Slippers: "🩴",
  "Slipper Flip Flop": "🩴",
  Wearables: "⌚",
  Clothing: "👖",
  Computers: "💻",
  default: "📦",
};

/* ---------------- Price helper: min = current, max = MRP ---------------- */
const getPrices = (obj) => {
  const p1 = Number(obj?.product_price) || 0;
  const p2 = Number(obj?.discount_price) || 0;
  const current = Math.min(p1, p2) || p1 || p2 || 0;
  const mrp = Math.max(p1, p2) || current;
  return { current, mrp };
};

/* ----------------------- Product Image Preview ----------------------- */
function PreviewImage({ src, alt, fallbackIcon }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
        {fallbackIcon}
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
        className="h-full w-full object-contain p-0.5"
      />
    </div>
  );
}

export default function AddProduct() {
  const navigate = useNavigate();

  /* --------------------------- State --------------------------- */
  const [step, setStep] = useState("input");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [scrapeStep, setScrapeStep] = useState(0);
  const [scrapeError, setScrapeError] = useState("");
  const [duplicate, setDuplicate] = useState(null);

  const [preview, setPreview] = useState(null);
  const [target_price, settarget_price] = useState("");
  const [targetError, setTargetError] = useState("");
  const [schedule, setSchedule] = useState("24h");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [stopTrackingOnHit, setStopTrackingOnHit] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* ------------------------ URL validation ------------------------ */
  const validateUrl = (value) => {
    if (!value.trim()) return "Please paste a product link";
    try {
      const u = new URL(value);
      const allowed = ["amazon.", "flipkart.", "myntra.", "ajio.", "meesho.","amzn."];
      const ok = allowed.some((d) => u.hostname.includes(d));
      if (!ok)
        return "Only Amazon, Flipkart, Myntra, Ajio & Meesho links are supported";
      return "";
    } catch {
      return "Enter a valid URL";
    }
  };

  /* ------------------- Target price validation ------------------- */
  const validateTarget = (value, currentPrice) => {
    if (value === "" || value == null) return "Target price is required";

    const num = Number(value);

    if (!Number.isFinite(num)) return "Enter a valid number";
    if (num <= 0) return "Target price must be greater than ₹0";

    if (currentPrice && num >= currentPrice) {
      return `Target must be less than the current price of ₹${currentPrice.toLocaleString(
        "en-IN"
      )}`;
    }

    return "";
  };

  /* ------------------------ Error parser ------------------------ */
  const parseError = (error, fallback = "Something went wrong.") => {
    if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
      return "Backend server is not reachable. Please check if it's running.";
    }

    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e) => {
          const loc = (e.loc || []).join(".");
          return loc ? `${loc}: ${e.msg}` : e.msg;
        })
        .join(" • ");
    }
    if (detail && typeof detail === "object") {
      return detail.message || JSON.stringify(detail);
    }
    if (error?.message) return error.message;
    return fallback;
  };

  /* =================================================================== */
  /*  CORE SCRAPE LOGIC                                                  */
  /* =================================================================== */
  const runScrape = async () => {
    setUrlError("");
    setSubmitError("");
    setScrapeError("");
    setDuplicate(null);
    setPreview(null);
    setTargetError("");
    setStep("scraping");
    setScrapeStep(0);

    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

    try {
      /* ---- STEP 1: Validating URL ---- */
      await sleep(400);
      setScrapeStep(1);

      /* ---- STEP 2: Fetching product page ---- */
      const apiPromise = trackProduct(url);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Request timed out. The store might be slow — please try again."
              )
            ),
          25000
        )
      );

      const response = await Promise.race([apiPromise, timeoutPromise]);
      console.log("📦 TRACK RESPONSE:", response);

      if (!response?.status || !response?.data) {
        throw new Error("Could not fetch product details from this link.");
      }

      const data = response.data;

      /* ---- STEP 3: Extracting details ---- */
      await sleep(300);
      setScrapeStep(2);
      await sleep(500);
      setScrapeStep(3);

      /* ---- STEP 4: Preparing preview ---- */
      const { current: currentPrice, mrp } = getPrices(data);

      setPreview({
        ...data,
        current_price: currentPrice,
        mrp,
      });

      /* Default target = 10% below current, guaranteed below current */
      const suggested = Math.max(1, Math.round(currentPrice * 0.9));
      settarget_price(String(suggested));

      await sleep(400);
      setScrapeStep(4);

      /* ---- STEP 5: Ready ---- */
      await sleep(300);
      setScrapeStep(5);
      await sleep(400);

      setStep("preview");
    } catch (error) {
      console.error("Track failed:", error);

      /* -------- Duplicate product (409) -------- */
      if (error?.response?.status === 409) {
        const d = error.response.data?.detail;
        setDuplicate(
          typeof d === "object" && d !== null
            ? d
            : { message: String(d || "You're already tracking this product.") }
        );
        return;
      }

      /* -------- Any other error -------- */
      setScrapeError(
        parseError(error, "Could not fetch product. Try again.")
      );
    }
  };

  /* ------------------------ Form submit ------------------------ */
  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) return setUrlError(err);
    runScrape();
  };

  const handleRetry = () => {
    setScrapeError("");
    setDuplicate(null);
    setScrapeStep(0);
    runScrape();
  };

  const backToInput = () => {
    setStep("input");
    setScrapeError("");
    setDuplicate(null);
    setScrapeStep(0);
    setPreview(null);
    setTargetError("");
  };

  /* ------------------------ Confirm ------------------------ */
  const handleConfirm = async () => {
    if (!preview) return;

    /* Re-validate target before submitting */
    const tErr = validateTarget(target_price, preview.current_price);
    if (tErr) {
      setTargetError(tErr);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const userId = Number(localStorage.getItem("userId") || 1);

      const rawProductPrice = Number(preview.product_price) || 0;
      const rawDiscountPrice = Number(preview.discount_price) || 0;

      const payload = {
        user_id: userId,
        product_link: preview.link || url,
        product_image_link: preview.image || null,
        product_title: preview.title,

        target_price: Number(target_price),

        product_price: rawProductPrice,
        discount_price: rawDiscountPrice,

        rating: Number(preview.rating) || 0,
        reviews: String(preview.reviews ?? ""),
        category: preview.category ?? "Other",
        brand_or_manufacturer: preview.additional_details?.Brand ?? "",

        best_sellers_rank: null,
        product_details: preview.details ?? [],
        additional_details: preview.additional_details ?? {},
        check_frequency: schedule,

        email_alert: notifyEmail,
        platform: preview.platform ?? "",

        stop_tracking: stopTrackingOnHit,
      };

      console.log("Payload → /add-product/:", payload);

      await addProductToTrack(payload);

      navigate("/dashboard");
    } catch (error) {
      console.error("Add product failed:", error);

      if (error?.response?.status === 409) {
        const d = error.response.data?.detail;
        setDuplicate(
          typeof d === "object" && d !== null
            ? d
            : { message: String(d || "You're already tracking this product.") }
        );
        setStep("scraping");
        setSubmitting(false);
        return;
      }

      setSubmitError(
        parseError(error, "Failed to start tracking. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToInput = () => {
    setStep("input");
    setPreview(null);
    setScrapeStep(0);
    setScrapeError("");
    setDuplicate(null);
    setSubmitError("");
    setTargetError("");
  };

  /* ------------------------- Derived ------------------------- */
  const discountPct =
    preview && preview.mrp > preview.current_price
      ? Math.round(((preview.mrp - preview.current_price) / preview.mrp) * 100)
      : 0;

  const categoryIcon =
    CATEGORY_ICONS[preview?.category] || CATEGORY_ICONS.default;

  /* Live target validation for the preview step */
  const liveTargetError =
    preview && target_price !== ""
      ? validateTarget(target_price, preview.current_price)
      : "";

  const targetIsValid =
    preview &&
    target_price !== "" &&
    !validateTarget(target_price, preview.current_price);

  return (
    <section className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white"
      >
        ← Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-white">
          Track a new product
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Paste a product link and we'll handle the rest
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {["Paste link", "Fetching", "Confirm"].map((label, i) => {
          const stepIndex =
            step === "input" ? 0 : step === "scraping" ? 1 : 2;
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition ${
                    isDone
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : isActive
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                      : "border-white/10 bg-white/[0.02] text-gray-600"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    isActive ? "font-medium text-white" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 2 && <div className="h-px flex-1 bg-white/10" />}
            </div>
          );
        })}
      </div>

      {/* ==================== STEP 1: INPUT ==================== */}
      {step === "input" && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
        >
          <label className="mb-2 block text-xs font-medium text-gray-300">
            Product link
          </label>

          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError("");
            }}
            placeholder="https://www.flipkart.com/..."
            autoFocus
            className={`w-full rounded-lg border bg-white/[0.03] px-3.5 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:bg-white/[0.05] ${
              urlError
                ? "border-red-500/50 focus:border-red-500"
                : "border-white/10 focus:border-purple-500/60"
            }`}
          />

          {urlError && (
            <p className="mt-1.5 text-[11px] text-red-400">{urlError}</p>
          )}

          <p className="mt-3 text-[11px] text-gray-500">
            Supported:{" "}
            <span className="text-orange-400">Amazon</span>,{" "}
            <span className="text-blue-400">Flipkart</span>,{" "}
            <span className="text-pink-400">Myntra</span>,{" "}
            <span className="text-indigo-400">Ajio</span>,{" "}
            <span className="text-purple-400">Meesho</span>
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.06]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
            >
              Start scraping →
            </button>
          </div>
        </form>
      )}

      {/* ==================== STEP 2: SCRAPING ==================== */}
      {step === "scraping" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 truncate rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-gray-400">
            {url}
          </div>

          {duplicate ? (
            /* ---------- Duplicate: already tracked ---------- */
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-4 text-center">
              <p className="text-2xl">📌</p>
              <p className="mt-2 text-sm font-medium text-amber-300">
                Already tracking this
              </p>
              <p className="mt-1 break-words text-xs text-amber-200/70">
                {duplicate.message ||
                  "You're already tracking this product."}
              </p>

              {duplicate.product_title && (
                <p className="mt-2 line-clamp-2 text-[11px] text-gray-400">
                  {duplicate.product_title}
                </p>
              )}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {duplicate.product_id ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/product/${duplicate.product_id}`)
                    }
                    className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
                  >
                    View product →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
                  >
                    Go to dashboard →
                  </button>
                )}
                <button
                  type="button"
                  onClick={backToInput}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.06]"
                >
                  Try a different link
                </button>
              </div>
            </div>
          ) : scrapeError ? (
            /* ---------- Generic error ---------- */
            <div className="rounded-lg border border-red-500/20 bg-red-500/[0.05] p-4 text-center">
              <p className="text-2xl">⚠️</p>
              <p className="mt-2 text-sm font-medium text-red-400">
                Something went wrong
              </p>
              <p className="mt-1 break-words text-xs text-red-300/80">
                {scrapeError}
              </p>

              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.06]"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={backToInput}
                  className="rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-gray-200"
                >
                  ← Back to link
                </button>
              </div>
            </div>
          ) : (
            /* ---------- Progress ---------- */
            <>
              <ul className="space-y-3.5">
                {SCRAPE_STEPS.map((s, i) => {
                  const done = i < scrapeStep;
                  const active = i === scrapeStep;
                  return (
                    <li key={s.id} className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          done
                            ? "border-green-500/40 bg-green-500/10 text-green-400"
                            : active
                            ? "border-purple-500/50 bg-purple-500/10"
                            : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        {done ? (
                          <span className="text-[10px]">✓</span>
                        ) : active ? (
                          <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-purple-400/40 border-t-purple-400" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                        )}
                      </div>

                      <span
                        className={`text-xs transition ${
                          done
                            ? "text-gray-400 line-through"
                            : active
                            ? "font-medium text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{
                    width: `${(scrapeStep / SCRAPE_STEPS.length) * 100}%`,
                  }}
                />
              </div>

              <p className="mt-4 text-center text-[11px] text-gray-500">
                {scrapeStep < 2
                  ? "Fetching product details…"
                  : scrapeStep < 5
                  ? "Almost there…"
                  : "Ready!"}
              </p>
            </>
          )}
        </div>
      )}

      {/* ==================== STEP 3: PREVIEW ==================== */}
      {step === "preview" && preview && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          {/* Product card with image */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start gap-3">
              <PreviewImage
                src={preview.image}
                alt={preview.title}
                fallbackIcon={categoryIcon}
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium leading-snug text-white">
                  {preview.title}
                </h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-500">
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 font-medium text-blue-400">
                    {preview.platform}
                  </span>
                  {preview.rating && preview.rating !== "0" && (
                    <span>⭐ {preview.rating}</span>
                  )}
                  {preview.reviews && preview.reviews !== "Not found" && (
                    <span>{preview.reviews} reviews</span>
                  )}
                  {preview.category && preview.category !== "Not Found" && (
                    <span>{preview.category}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <span className="text-lg font-semibold text-white">
                ₹{preview.current_price.toLocaleString("en-IN")}
              </span>
              {preview.mrp > preview.current_price && (
                <>
                  <span className="text-xs text-gray-500 line-through">
                    ₹{preview.mrp.toLocaleString("en-IN")}
                  </span>
                  <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                    {discountPct}% off
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Target price */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Target price
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={Math.max(1, preview.current_price - 1)}
                step="1"
                value={target_price}
                onChange={(e) => {
                  settarget_price(e.target.value);
                  if (targetError) setTargetError("");
                }}
                className={`w-full rounded-lg border bg-white/[0.03] py-2.5 pl-7 pr-3 text-sm text-white outline-none transition ${
                  liveTargetError || targetError
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-purple-500/60"
                }`}
              />
            </div>

            {(liveTargetError || targetError) ? (
              <p className="mt-1.5 text-[11px] text-red-400">
                {targetError || liveTargetError}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] text-gray-500">
                Must be less than the current price of{" "}
                <span className="text-gray-300">
                  ₹{preview.current_price.toLocaleString("en-IN")}
                </span>
              </p>
            )}
          </div>

          {/* Schedule */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Check frequency
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSchedule(opt.id)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-medium transition ${
                    schedule === opt.id
                      ? "border-purple-500/50 bg-purple-500/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-gray-300">
              Notifications
            </label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                <span className="text-xs text-gray-300">Email alerts</span>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="h-3.5 w-3.5 accent-purple-500"
                />
              </label>
            </div>
          </div>

          {/* Stop tracking after target hit */}
          <div className="mt-5">
            <label className="mb-2 block text-xs font-medium text-gray-300">
              After hitting your target
            </label>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStopTrackingOnHit(false)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
                  !stopTrackingOnHit
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    !stopTrackingOnHit
                      ? "border-purple-400 bg-purple-500"
                      : "border-white/20"
                  }`}
                >
                  {!stopTrackingOnHit && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-white">
                    Keep tracking
                  </span>
                  <span className="mt-0.5 block text-[10px] text-gray-500">
                    Continue watching the price and alert me on further drops.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStopTrackingOnHit(true)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${
                  stopTrackingOnHit
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    stopTrackingOnHit
                      ? "border-purple-400 bg-purple-500"
                      : "border-white/20"
                  }`}
                >
                  {stopTrackingOnHit && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-white">
                    Stop tracking after target is hit
                  </span>
                  <span className="mt-0.5 block text-[10px] text-gray-500">
                    Send one final alert and automatically pause this tracker.
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="mt-4 break-words rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3 py-2.5 text-[11px] text-red-400">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={goBackToInput}
              disabled={submitting}
              className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting || !targetIsValid}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-200 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Starting…
                </>
              ) : (
                "Start tracking"
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}