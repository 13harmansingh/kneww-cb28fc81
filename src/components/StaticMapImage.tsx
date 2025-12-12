import { useTheme } from "next-themes";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

interface StaticMapImageProps {
  coordinates: [number, number];
  zoom: number;
  width?: number;
  height?: number;
  className?: string;
}

export const StaticMapImage = ({
  coordinates,
  zoom,
  width = 400,
  height = 200,
  className,
}: StaticMapImageProps) => {
  const { resolvedTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);

  // Use theme-appropriate style
  const style = resolvedTheme === "light" ? "light-v11" : "dark-v11";
  
  // Build Mapbox Static Images API URL with @2x for retina
  const staticUrl = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${coordinates[0]},${coordinates[1]},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      <img
        src={staticUrl}
        alt="Map"
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/20 animate-pulse" />
      )}
      {/* Warm teal gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-accent/10 dark:to-accent/5" />
    </div>
  );
};
