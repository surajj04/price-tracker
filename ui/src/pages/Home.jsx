import { useState } from "react";
import { Icon } from "@iconify/react";


const SUPPORTED_STORES = [
  { name: "Amazon",   icon: "simple-icons:amazon",   color: "from-orange-400 to-yellow-500" },
  { name: "Flipkart", icon: "simple-icons:flipkart", color: "from-blue-500 to-yellow-400" },
  { name: "Myntra",   icon: "simple-icons:myntra",   color: "from-pink-500 to-purple-500" },
  { name: "Ajio",     icon: "simple-icons:ajio",     color: "from-indigo-500 to-purple-600" },
];

const STEPS = [
  {
    icon: "🔗",
    title: "Paste the link",
    desc: "Drop a product URL from Amazon, Flipkart, or any supported store.",
  },
  {
    icon: "⚙️",
    title: "We scrape it",
    desc: "Our backend automatically pulls the product name, current price, and image.",
  },
  {
    icon: "🔔",
    title: "Set your schedule",
    desc: "Choose daily or hourly tracking and get alerted the moment the price drops.",
  },
];



export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    // TODO: backend API call -> POST /api/track  { url }
    console.log("Tracking URL:", url);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-300 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          Live price tracking across 6+ stores
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Track any product's price.
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Buy at the right time.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-gray-400 sm:text-lg">
          Paste an Amazon or Flipkart link, schedule tracking, and get notified the
          moment the price drops. No more refreshing tabs.
        </p>


        {/* Supported stores */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
          <span>Supported:</span>
          {SUPPORTED_STORES.map((s) => (
            <span
              key={s.name}
              className={`rounded-md bg-gradient-to-r ${s.color} bg-clip-text font-semibold text-transparent`}
            >
              {s.name}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-3 text-center text-2xl font-semibold sm:text-3xl">
          How it works
        </h2>
        <p className="mb-12 text-center text-sm text-gray-400">
          Three simple steps. That's it.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xl">
                {step.icon}
              </div>
              <div className="mb-1 text-xs font-medium text-purple-400">
                STEP {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features strip */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:grid-cols-2 md:grid-cols-4">
          {[
            { k: "⚡", t: "Fast scraping", d: "Real-time price fetch" },
            { k: "📅", t: "Smart schedule", d: "Hourly / daily tracking" },
            { k: "📬", t: "Email alerts", d: "Instant drop notifications" },
            { k: "📊", t: "Price history", d: "See full trend graph" },
          ].map((f) => (
            <div key={f.t} className="text-center sm:text-left">
              <div className="mb-2 text-2xl">{f.k}</div>
              <div className="font-semibold">{f.t}</div>
              <div className="text-xs text-gray-400">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} PriceNazar — Built with ❤️ for smart shoppers.
      </footer>
    </>
  );
}