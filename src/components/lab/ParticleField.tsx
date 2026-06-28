import { useEffect, useState } from "react";

export function ParticleField({ count = 14 }: { count?: number }) {
  const [particles, setParticles] = useState<
    { left: number; delay: number; duration: number; size: number; key: number }[]
  >([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: count }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 14,
        duration: 14 + Math.random() * 16,
        size: 3 + Math.random() * 5,
        key: i,
      })),
    );
  }, [count]);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {particles.map((p) => (
        <span
          key={p.key}
          className="crystal-particle"
          style={{
            left: `${p.left}%`,
            bottom: "-20px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
