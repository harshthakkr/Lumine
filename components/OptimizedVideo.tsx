interface OptimizedVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  preload?: "none" | "metadata" | "auto";
  poster?: string;
  width?: number;
  height?: number;
}

export const OptimizedVideo = ({
  src,
  className,
  autoPlay = false,
  muted = true,
  loop = false,
  playsInline = true,
  preload = "metadata",
  poster,
  width,
  height,
}: OptimizedVideoProps) => {
  return (
    <video
      src={src}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      poster={poster}
      width={width}
      height={height}
      crossOrigin="anonymous"
      disablePictureInPicture
      disableRemotePlayback
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};
