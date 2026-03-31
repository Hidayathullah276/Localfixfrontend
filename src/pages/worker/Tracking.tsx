import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Phone, CheckCircle, Navigation, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { motion } from "framer-motion";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const workerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function WorkerTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [workerLocation, setWorkerLocation] = useState<[number, number] | null>(null);
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBooking = async () => {
      try {
        const curr = await api.get(`/bookings/${id}`);
        if (!active) return;
        
        if (!curr) {
          toast.error("Booking not found");
          navigate("/worker");
          return;
        }

        setBooking(curr);

        if (curr.location?.coordinates && curr.location.coordinates.length === 2) {
           setCustomerLocation([curr.location.coordinates[1], curr.location.coordinates[0]]);
        }
        if (curr.worker_info?.location?.coordinates && curr.worker_info.location.coordinates.length === 2) {
           setWorkerLocation([curr.worker_info.location.coordinates[1], curr.worker_info.location.coordinates[0]]);
        }

        setLoading(false);
      } catch (err) {
        if(active) {
          toast.error("Failed to load tracking data");
          navigate("/worker");
        }
      }
    };
    
    fetchBooking();

    // Setup polling for live location updates
    let watcherId: number;
    let intervalId: NodeJS.Timeout;

    if ("geolocation" in navigator) {
       intervalId = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
              api.patch('/workers/location', { coordinates: coords, bookingId: id }).catch(console.error);
              setWorkerLocation([position.coords.latitude, position.coords.longitude]);
            },
            (error) => console.log(error),
            { enableHighAccuracy: true, timeout: 5000 }
          );
       }, 5000); 
    }

    return () => {
       active = false;
       if(intervalId) clearInterval(intervalId);
    };
  }, [id, navigate]);

  const updateStatus = async (status: string) => {
     try {
       await api.put(`/bookings/${id}`, { status });
       toast.success("Status updated");
       setBooking({ ...booking, status });
       if (status === 'completed' || status === 'work_finished') {
          navigate("/worker");
       }
     } catch (err) {
       toast.error("Status update failed");
     }
  };

  if (loading || !booking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const customerInfo = booking.customer_info;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-primary to-purple-800 flex flex-col">
      <div className="p-4 flex items-center text-white z-10">
        <button onClick={() => navigate("/worker")} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-display">Job Navigation</h1>
      </div>

      <div className="flex-1 relative mt-2 rounded-t-[2rem] overflow-hidden bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        {/* Map UI */}
        <div className="absolute inset-x-0 top-0 bottom-[240px] bg-slate-100">
             {booking && (
               <MapContainer
                 key={booking._id}
                 center={customerLocation || workerLocation || [20.5937, 78.9629]}
                 zoom={13}
                 style={{ height: "100%", width: "100%" }}
                 zoomControl={false}
               >
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                 
                 {customerLocation ? (
                   <Marker position={customerLocation} />
                 ) : null}
                 
                 {workerLocation ? (
                   <Marker position={workerLocation} icon={workerIcon} />
                 ) : null}
                 
                 {customerLocation && workerLocation ? (
                   <Polyline 
                     positions={[workerLocation, customerLocation]} 
                     pathOptions={{ color: '#4f46e5', weight: 5, dashArray: '10, 10' }}
                   />
                 ) : null}
               </MapContainer>
             )}
             {!booking && (
               <div className="flex items-center justify-center h-full"> 
                 <p className="text-muted-foreground animate-pulse">Initializing Map...</p>
               </div>
             )}
        </div>

        {/* Customer Info Card */}
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-[1000] p-6 pb-8">
          <div className="w-12 h-1.5 bg-muted mx-auto rounded-full mb-6" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-50 text-xl font-bold text-indigo-700">
               {customerInfo?.name?.charAt(0) || "C"}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-1">{customerInfo?.name || "Customer"}</h3>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {booking.address}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
               {booking.status === "accepted" && (
                 <Button className="h-11 bg-indigo-600 hover:bg-indigo-700" onClick={() => updateStatus("worker_arriving")}>
                    <Navigation className="w-4 h-4 mr-2" /> Start Nav
                 </Button>
               )}
               {booking.status === "worker_arriving" && (
                 <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus("service_started")}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Arrived
                 </Button>
               )}
                {booking.status === "service_started" && (
                  <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus("work_finished")}>
                     <CheckCircle className="w-4 h-4 mr-2" /> Finish Job
                  </Button>
                )}
                <Button 
                  className="h-11 bg-indigo-600 hover:bg-indigo-700 font-bold"
                  onClick={() => {
                    const coords = booking.location?.coordinates;
                    if (coords && coords.length === 2) {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
                    } else {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address)}`, '_blank');
                    }
                  }}
                >
                  <Navigation className="w-4 h-4 mr-2" /> Navigate
                </Button>
             <Button 
               variant="outline"
               className="h-11 border-indigo-200 text-indigo-700"
               onClick={() => window.location.href = `tel:${customerInfo?.phone}`}
             >
                <Phone className="w-4 h-4 mr-2" /> Call Customer
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
