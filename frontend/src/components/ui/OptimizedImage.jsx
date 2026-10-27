import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function OptimizedImage({
  alt,
  fallbackSrc,
  sources = [],
  placeholderSrc = "",
  sizes,
  width,
  height,
  priority = false,
  wrapperClassName,
  imgClassName,
  style,
}) {
  const wrapperRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (priority || shouldLoad) return undefined;

    const node = wrapperRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [priority, shouldLoad]);

  return (
    <div
      ref={wrapperRef}
      className={clsx(
        "image-shell",
        isLoaded ? "is-loaded" : "is-loading",
        wrapperClassName,
      )}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : undefined }}
    >
      <div
        className="image-loading-overlay"
        aria-hidden={isLoaded}
        style={
          placeholderSrc
            ? { backgroundImage: `url(${placeholderSrc})` }
            : undefined
        }
      />

      {shouldLoad && (
        <picture>
          {sources.map(({ srcSet, type, media }) => (
            <source
              key={`${type}-${media || "default"}`}
              srcSet={srcSet}
              type={type}
              media={media}
              sizes={sizes}
            />
          ))}
          <img
            src={fallbackSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            draggable="false"
            onLoad={() => {
              setIsLoaded(true);
              setHasError(false);
            }}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
            className={clsx("image-reveal", isLoaded && "is-loaded", imgClassName)}
            style={style}
          />
        </picture>
      )}

      {hasError && (
        <div className="image-error-state" role="status">
          Image unavailable
        </div>
      )}
    </div>
  );
}
