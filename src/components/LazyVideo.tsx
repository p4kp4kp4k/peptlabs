import { useRef, useEffect, useState } from "react";

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export function LazyVideo({ src, poster, className }: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      autoPlay={isVisible}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      className={className}
      src={isVisible ? src : undefined}
    />
  );
}
