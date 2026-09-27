import FeatureCard from "../components/FeatureCard";

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time scraping",
    desc: "We fetch the latest price the moment you paste a link — no stale data, no delays.",
    accent: "from-yellow-400/30 to-orange-500/30",
  },
  {
    icon: "📅",
    title: "Flexible scheduling",
    desc: "Track hourly, every 6 hours, or daily. You decide how often we check the price.",
    accent: "from-blue-400/30 to-cyan-500/30",
  },
  {
    icon: "📬",
    title: "Instant alerts",
    desc: "Get an email the second your target price drops — never miss a deal again.",
    accent: "from-purple-400/30 to-pink-500/30",
  },
  {
    icon: "📊",
    title: "Price history",
    desc: "See full price trends over time with beautiful charts. Know if it's actually a deal.",
    accent: "from-green-400/30 to-emerald-500/30",
  },
  {
    icon: "🎯",
    title: "Target price",
    desc: "Set your desired price and we'll only ping you when it's actually worth buying.",
    accent: "from-red-400/30 to-rose-500/30",
  },
  {
    icon: "🛒",
    title: "Multi-store support",
    desc: "Track products across Amazon, Flipkart, Myntra, Ajio and more — all in one place.",
    accent: "from-indigo-400/30 to-violet-500/30",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
      {/* Heading */}
      <div className="mb-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-300 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Features
        </div>
        <h2 className="text-2xl font-semibold sm:text-3xl">
          Everything you need to{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            never overpay
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-400">
          Built for smart shoppers who want the best price — without refreshing tabs all day.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}