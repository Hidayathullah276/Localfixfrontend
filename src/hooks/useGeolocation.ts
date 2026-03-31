import { useState } from "react";
import { toast } from "sonner";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>("");

  const detectLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
            toast.success("Location detected!");
          } else {
            const shortAddr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setAddress(shortAddr);
            toast.info(`Coordinates detected: ${shortAddr}`);
          }
        } catch (error) {
          const shortAddr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAddress(shortAddr);
          toast.info(`Coordinates detected: ${shortAddr}`);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        toast.error("Failed to get your location. please ensure location permissions are enabled.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return { detectLocation, loading, coords, address };
}
