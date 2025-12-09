import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { Country } from "@/data/countries";
import { FollowStateButton } from "@/components/follow/FollowStateButton";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

interface CountryMapCardProps {
  country: Country;
  onClick: () => void;
}

export const CountryMapCard = ({ country, onClick }: CountryMapCardProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!mapContainer.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px" }
    );

    observer.observe(mapContainer.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isVisible) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Dynamic map style based on theme
    const mapStyle = resolvedTheme === "light"
      ? "mapbox://styles/mapbox/outdoors-v12"
      : "mapbox://styles/mapbox/dark-v11";

    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: country.coordinates,
        zoom: 3,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
      });

      map.current.on("style.load", () => {
        const fogConfig = resolvedTheme === "light"
          ? { color: "rgb(248, 247, 244)", "high-color": "rgb(200, 195, 185)", "horizon-blend": 0.15 }
          : { color: "rgb(15, 20, 35)", "high-color": "rgb(40, 50, 90)", "horizon-blend": 0.2 };
        
        map.current?.setFog(fogConfig);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [country.code, isVisible, resolvedTheme]);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent transition-all group"
    >
      <div ref={mapContainer} className="h-48 w-full bg-muted/20" />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition">
              {country.name}
            </h3>
            <p className="text-sm text-muted-foreground">Click to view news</p>
          </div>
          <FollowStateButton
            stateCode={country.code}
            stateName={country.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
    </div>
  );
};
