'use client';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, accent = false }) {
  const isPositive = trend > 0;
  const isNeutral  = trend === 0 || trend === undefined;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 shadow-luxury border transition-all duration-300 hover:shadow-luxury-hover hover:-translate-y-0.5
        ${accent
          ? 'bg-brown-500 border-brown-400 text-cream-50'
          : 'bg-cream-50 border-cream-200 text-brown-600'
        }`}
    >
      {/* Decorative circle */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10
          ${accent ? 'bg-cream-100' : 'bg-brown-200'}`}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
              ${accent ? 'bg-brown-400' : 'bg-cream-200'}`}
          >
            <Icon
              size={20}
              className={accent ? 'text-cream-100' : 'text-brown-300'}
            />
          </div>
        )}

        {/* Trend badge */}
        {!isNeutral && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full
              ${accent
                ? isPositive ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                : isPositive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="mt-4 space-y-1">
        <p className={`text-sm font-medium ${accent ? 'text-cream-200' : 'text-brown-200'}`}>
          {title}
        </p>
        <p className={`font-display text-3xl font-semibold tracking-tight
          ${accent ? 'text-cream-50' : 'text-brown-600'}`}>
          {value}
        </p>
        {(subtitle || trendLabel) && (
          <p className={`text-xs ${accent ? 'text-cream-200' : 'text-brown-100'}`}>
            {trendLabel || subtitle}
          </p>
        )}
      </div>
    </div>
  );
}