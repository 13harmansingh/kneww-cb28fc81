import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { USState } from "@/data/usStates";

interface StateMapCardProps {
  state: USState;
  onClick: () => void;
}

export const StateMapCard = ({ state, onClick }: StateMapCardProps) => {
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

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN || "";
    
    if (!MAPBOX_TOKEN) {
      console.error("Mapbox token not found");
      return;
    }

    // Clean up existing map before creating new one
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    // Add small delay to ensure proper cleanup
    const timeoutId = setTimeout(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: state.coordinates,
        zoom: state.zoom,
        interactive: false,
        attributionControl: false,
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [state.code, state.coordinates, state.zoom, isVisible]);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden border border-accent/20 hover:border-accent transition-all hover:scale-[1.02] active:scale-95"
    >
      <div ref={mapContainer} className="w-full h-48 bg-muted/20" />
      <div className="bg-card p-4 border-t border-border">
        <h3 className="text-lg font-semibold text-white">{state.name}</h3>
        <p className="text-sm text-muted-foreground">{state.code}</p>
      </div>
    </button>
  );
};
