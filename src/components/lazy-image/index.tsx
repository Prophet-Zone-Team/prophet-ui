import { getTokenLogo } from "@/utils/logo";
import React, { useEffect, useMemo, useRef, useState } from "react";

export const LazyImage = (props: Props) => {
  const {
    src,
    alt,
    fallbackSrc,
    width,
    height,
    containerStyle,
    containerClassName,
    style,
    className,
    delay = 0,
    ...restProps
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoaded, setLoaded] = useState(false);
  const [isError, setError] = useState(false);

  const renderFallback = useMemo(() => {
    if (typeof fallbackSrc === "string") {
      return <img src={fallbackSrc} alt={alt ?? ''} style={style} />;
    }
    if (fallbackSrc) {
      return <>{fallbackSrc}</>;
    }
    return <img src={getTokenLogo("default_icon")} alt={alt ?? ''} style={style} />;
  }, [alt, fallbackSrc, style]);

  useEffect(() => {
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
    };
    img.onerror = () => {
      setError(true);
    };
  }, [src]);

  return (
    <div
      {...restProps}
      ref={containerRef}
      className={`relative w-full h-full ${containerClassName}`}
      style={{
        width,
        height,
        ...containerStyle
      }}
    >
      {isLoaded && !isError ? (
        <img
          key={`${src}-real-image`}
          src={src}
          alt={alt ?? ""}
          loading="lazy"
          style={{
            ...style,
            transitionProperty: "opacity",
            transitionDuration: "300ms",
            transitionTimingFunction: "ease-in-out",
            transitionDelay: `${delay}s`,
          }}
          className={`real-image w-full h-full object-contain origin-center ${className} ${isLoaded && !isError ? "opacity-100" : "opacity-0"}`}
          onLoad={() => {
            setLoaded(true);
          }}
          onError={() => {
            setError(true);
          }}
        />
      ) : renderFallback}
    </div>
  );
};

export default LazyImage;

export interface Props {
  src: string;
  fallbackSrc?: string | React.ReactNode;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  delay?: number;

  [k: string]: any;
}
