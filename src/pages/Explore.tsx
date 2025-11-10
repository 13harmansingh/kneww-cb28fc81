import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

const MAPBOX_TOKEN = "pk.eyJ1IjoicjR3Y2xvIiwiYSI6ImNtOHFwNmhzbzBsdXcyanNjcmhjdm9hOGsifQ.7XhOgtfnTOl8qKZZNgMMLw";

const Explore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe",
      zoom: 1.5,
      center: [0, 20],
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.current.on("style.load", () => {
      map.current?.setFog({
        color: "rgb(25, 25, 40)",
        "high-color": "rgb(50, 50, 80)",
        "horizon-blend": 0.2,
      });
    });

    // Add click handler for reverse geocoding
    map.current.on("click", async (e) => {
      setIsLoading(true);
      const { lng, lat } = e.lngLat;

      try {
        // Reverse geocoding using Mapbox API
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=country`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const country = data.features[0];
          const countryName = country.text;
          const countryCode = country.properties?.short_code?.toUpperCase();

          // Add a marker at the clicked location
          new mapboxgl.Marker({ color: "#9b87f5" })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<div class="p-2"><strong>${countryName}</strong></div>`
              )
            )
            .addTo(map.current!);

          // Navigate to news for this country
          toast.success(`Loading news for ${countryName}`);
          setTimeout(() => {
            navigate(`/?country=${countryCode}&countryName=${encodeURIComponent(countryName)}`);
          }, 500);
        }
      } catch (error) {
        console.error("Error with reverse geocoding:", error);
        toast.error("Could not identify location. Please try again.");
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2">Explore World News</h1>
        <p className="text-muted-foreground">Click anywhere on the map to discover local news</p>
      </div>

      <div className="relative h-[calc(100vh-200px)] mx-4 mt-6 rounded-2xl overflow-hidden border border-border">
        <div ref={mapContainer} className="absolute inset-0" />
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-white">Finding location...</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Explore;
