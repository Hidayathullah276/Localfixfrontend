import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Phone, XCircle, MapPin, Navigation, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Fix Leaflet icons
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
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function CustomerTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [workerLocation, setWorkerLocation] = useState<[number, number] | null>(null);
  const [customerLocation, setCustomerLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBooking = async () => {
      try {
        const curr = await api.get(`/bookings/${id}`);
        if (!active) return;
        
        if (!curr) {
          toast.error("Booking not found");
          setLoading(false);
          navigate("/bookings");
          return;
        }

        if (curr.status !== "accepted" && curr.status !== "worker_arriving" && curr.status !== "service_started") {
           navigate("/bookings"); // redirect if not active
           return;
        }

        setBooking(curr);

        if (curr.location?.coordinates && curr.location.coordinates.length === 2) {
           setCustomerLocation([curr.location.coordinates[1], curr.location.coordinates[0]]);
        }

        if (curr.worker_info?.location?.coordinates && curr.worker_info.location.coordinates.length === 2) {
           setWorkerLocation([curr.worker_info.location.coordinates[1], curr.worker_info.location.coordinates[0]]);
        }

        socket.emit('join_tracking', { bookingId: id });
        setLoading(false);
      } catch (err) {
        if(active) {
          toast.error("Failed to load tracking data");
          setLoading(false);
          navigate("/bookings");
        }
      }
    };
    fetchBooking();

    socket.on('location_update', (data) => {
      if (data.coordinates) {
        setWorkerLocation([data.coordinates[1], data.coordinates[0]]);
      }
    });

    socket.on('booking_updated', (data) => {
      if (data.id === id || data._id === id) {
        setBooking(data);
        if (data.status === "completed" || data.status === "cancelled") {
           toast.info("Job finished or cancelled");
           navigate("/bookings");
        }
      }
    });

    return () => {
      socket.off('location_update');
      socket.off('booking_updated');
    };
  }, [id, navigate]);

  const handleCancel = async () => {
     if(confirm("Cancel this booking?")) {
        try {
           setIsCancelling(true);
           await api.put(`/bookings/${id}`, { status: "cancelled" });
           toast.success("Booking cancelled");
           navigate("/bookings");
        } catch(err) {
           toast.error("Could not cancel");
           setIsCancelling(false);
        }
     }
  };

  if (loading || !booking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const workerInfo = booking.worker_info;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-800 flex flex-col">
      <div className="p-4 flex items-center text-white z-10">
        <button onClick={() => navigate("/bookings")} className="mr-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-display">Live Tracking</h1>
      </div>

      <div className="flex-1 relative mt-2 rounded-t-[2rem] overflow-hidden bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        {/* Floating Map UI */}
        <div className="absolute inset-x-0 top-0 bottom-[220px] bg-slate-100">
           {(customerLocation || workerLocation) ? (
             <MapContainer
               center={workerLocation || customerLocation || [20.5937, 78.9629]}
               zoom={14}
               style={{ height: "100%", width: "100%" }}
               zoomControl={false}
             >
               <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
               {customerLocation && <Marker position={customerLocation} />}
               {workerLocation && <Marker position={workerLocation} icon={workerIcon} />}
               {customerLocation && workerLocation && (
                 <Polyline 
                   positions={[workerLocation, customerLocation]} 
                   color="#8b5cf6" 
                   weight={4} 
                   dashArray="10, 10" 
                 />
               )}
             </MapContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/30">
                <p>Waiting for GPS signal...</p>
             </div>
           )}

           {/* ETA Badge */}
           <motion.div 
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-purple-100"
           >
             <Navigation className="w-4 h-4 text-primary" />
             <span className="font-bold text-sm text-foreground">
               {booking.status === "worker_arriving" ? "Arriving Soon" : 
                booking.status === "service_started" ? "Job in Progress" : "On the way"}
             </span>
           </motion.div>
        </div>

        {/* Worker Info Card */}
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-[1000] p-6 pb-8 transition-transform">
          <div className="w-12 h-1.5 bg-muted mx-auto rounded-full mb-6" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 flex items-center justify-center shadow-inner overflow-hidden border-2 border-purple-100">
               {workerInfo?.photo ? (
                 <img src={workerInfo.photo} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-xl font-bold text-primary">{workerInfo?.name?.charAt(0) || "W"}</span>
               )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground mb-1">{workerInfo?.name || "Professional"}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="w-4 h-4 fill-amber-500" /> {workerInfo?.rating || "4.8"}
                </span>
                <span className="text-muted-foreground">• {booking.service_categories?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <Button 
               className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-semibold text-base gap-2"
               onClick={() => window.location.href = `tel:${workerInfo?.phone}`}
             >
                <Phone className="w-5 h-5 fill-current" />
                Call Worker
             </Button>
             <Button 
               variant="outline"
               className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
               onClick={handleCancel}
               disabled={isCancelling}
             >
                <XCircle className="w-6 h-6" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
