export function Photo({ src, alt, className = '', fallback = '/images/hospital.jpg' }) {
  return (
    <img
      className={className}
      src={src || fallback}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        if (!e.currentTarget.src.endsWith(fallback)) e.currentTarget.src = fallback;
      }}
    />
  );
}
