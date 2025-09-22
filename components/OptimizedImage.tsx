interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
}: OptimizedImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};
