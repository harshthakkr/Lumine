"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

// Unsplash serves resized, re-encoded variants from its own CDN (imgix), so
// those photos skip our optimizer entirely: faster first loads and no
// image-optimization quota spent on 6000px originals.
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}?w=${width}&q=${quality ?? 75}&auto=format&fit=max`;

const isUnsplash = (src: ImageProps["src"]) =>
  typeof src === "string" && src.startsWith("https://images.unsplash.com/");

/** next/image with the right loader for where the file lives. */
export function SmartImage(props: ImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is forwarded via props
  return <Image {...props} loader={isUnsplash(props.src) ? unsplashLoader : undefined} />;
}
