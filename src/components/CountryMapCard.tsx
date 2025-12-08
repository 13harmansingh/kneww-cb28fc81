import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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

    const mapStyle = "mapbox://styles/mapbox/outdoors-v12";

    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: country.coordinates,
        zoom: 3.5,
        interactive: false,
        attributionControl: false,
        preserveDrawingBuffer: true,
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [country.code, isVisible]);

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-all group relative"
    >
      <div className="relative">
        <div ref={mapContainer} className="h-44 w-full bg-muted/20 map-container-teal" />
        <div className="absolute bottom-3 left-3 z-10">
          <FollowStateButton
            stateCode={country.code}
            stateName={country.name}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition truncate">
          {country.name}
        </h3>
      </div>
    </div>
  );
};
