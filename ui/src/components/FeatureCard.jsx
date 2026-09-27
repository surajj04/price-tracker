export default function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
      {/* Glow on hover */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${accent} opacity-0 blur-2xl transition duration-500 group-hover:opacity-20`}
      />

      <div className="relative">
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-xl shadow-lg`}
        >
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
      </div>
    </div>
  );
}