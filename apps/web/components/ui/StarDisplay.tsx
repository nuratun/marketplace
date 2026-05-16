export function StarDisplay({ score, size = 16 }: { score: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${score} من 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = score >= i
        const half = !filled && score >= i - 0.5
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none">
            {half ? (
              <>
                <defs>
                  <linearGradient id={`h${i}`}>
                    <stop offset="50%" stopColor="var(--color-brand)" />
                    <stop offset="50%" stopColor="#d1d5db" />
                  </linearGradient>
                </defs>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#h${i})`} />
              </>
            ) : (
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? "var(--color-brand)" : "#d1d5db"} />
            )}
          </svg>
        )
      })}
    </span>
  )
}