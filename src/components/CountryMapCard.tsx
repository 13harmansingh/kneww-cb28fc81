import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Country } from "@/data/countries";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

interface CountryMapCardProps {
  country: Country;
  onClick: () => void;
}

export const CountryMapCard = ({ country, onClick }: CountryMapCardProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Clean up existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: country.coordinates,
        zoom: 3,
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
  }, [country.code]);

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-accent transition-all group"
    >
      <div ref={mapContainer} className="h-48 w-full" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-accent transition">
          {country.name}
        </h3>
        <p className="text-sm text-muted-foreground">Click to view news</p>
      </div>
    </div>
  );
};
