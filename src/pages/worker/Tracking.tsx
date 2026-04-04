import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Phone, CheckCircle, Navigation, MapPin, ArrowLeft, XCircle } from "lucide-react";
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
  const [unassigning, setUnassigning] = useState(false);
  const [unassignReason, setUnassignReason] = useState("");

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
        
        const workerLoc = curr.worker_id?.location || curr.worker_info?.location;
        if (workerLoc?.coordinates && workerLoc.coordinates.length === 2) {
           setWorkerLocation([workerLoc.coordinates[1], workerLoc.coordinates[0]]);
        }

        socket.emit('join_tracking', { bookingId: id });
        setLoading(false);
      } catch (err) {
        if(active) {
          toast.error("Failed to load tracking data");
          navigate("/worker");
        }
      }
    };
    
    fetchBooking();

    socket.on('booking_updated', (data) => {
      if (data.id === id || data._id === id) {
        setBooking(data);
        if (data.status === "completed" || data.status === "cancelled") {
           navigate("/worker");
        }
      }
    });

    let intervalId: any;
    if ("geolocation" in navigator) {
       intervalId = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              if (isNaN(latitude) || isNaN(longitude)) return;
              const coords: [number, number] = [longitude, latitude];
              api.patch('/workers/location', { coordinates: coords, bookingId: id }).catch(console.error);
              setWorkerLocation([latitude, longitude]);
            },
            (error) => console.log("Geolocation error:", error),
            { enableHighAccuracy: true, timeout: 5000 }
          );
       }, 5000); 
    }

    return () => {
       active = false;
       socket.off('booking_updated');
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-white/80">Connecting to tracking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background gap-4">
         <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-600" />
         </div>
         <h2 className="text-xl font-display font-bold text-white">Booking Not Found</h2>
         <Button onClick={() => navigate("/worker")} variant="outline">Back to Dashboard</Button>
      </div>
    );
  }

  const handleUnassign = async () => {
     try {
       await api.put(`/bookings/unassign/${id}`, { reason: unassignReason || "Cancelled via tracking" });
       toast.success("Job unassigned");
       navigate("/worker");
     } catch (err: any) {
       toast.error(err.message || "Failed to unassign");
     }
  };

  const customerInfo = booking.customer_info || {};
  const isCoordinatesValid = (coords: any): coords is [number, number] => 
    Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);

  const customerPos = isCoordinatesValid(customerLocation) ? customerLocation : null;
  const workerPos = isCoordinatesValid(workerLocation) ? workerLocation : null;
  const initialCenter: [number, number] = workerPos || customerPos || [20.5937, 78.9629];

  return (
    <div className="min-h-screen bg-indigo-900 flex flex-col">
       {/* ... existing tracking UI ... */}
       <div className="p-4 flex items-center text-white z-10">
        <button onClick={() => navigate("/worker")} className="mr-3 p-2 bg-white/10 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-display">Live Job Tracking</h1>
      </div>

      <div className="flex-1 relative mt-2 rounded-t-[2.5rem] overflow-hidden bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
         <div className="absolute inset-x-0 top-0 bottom-[260px] bg-slate-100">
             {booking && (customerPos || workerPos) ? (
               <MapContainer
                 key={`map-worker-v2-${id || "new"}`}
                 center={initialCenter}
                 zoom={15}
                 style={{ height: "100%", width: "100%" }}
                 zoomControl={false}
               >
                 <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                 {customerLocation && <Marker position={customerLocation} />}
                 {workerLocation && <Marker position={workerLocation} icon={workerIcon} />}
                 {customerLocation && workerLocation && (
                   <Polyline
                     positions={[workerLocation, customerLocation]}
                     pathOptions={{ color: "#4f46e5", weight: 5, dashArray: "10, 10" }}
                   />
                 )}
               </MapContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center bg-slate-50"> 
                 <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                 <div className="space-y-1">
                   <p className="text-lg font-bold text-slate-800">Initializing Navigation...</p>
                   <p className="text-sm text-slate-500">Waiting for GPS signal to lock in</p>
                 </div>
               </div>
             )}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-[1000] p-8 pb-10 overflow-y-auto max-h-[60vh]">
          <div className="w-16 h-1.5 bg-slate-100 mx-auto rounded-full mb-8" />
          
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-200">
               {customerInfo?.name?.charAt(0) || "C"}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Customer Details</span>
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-1">{customerInfo?.name || "Premium Customer"}</h3>
              <p className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <MapPin className="w-4 h-4 text-indigo-500" /> {booking.address}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
               {booking.status === "accepted" && (
                 <Button className="h-14 w-full bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-100" onClick={() => updateStatus("worker_arriving")}>
                    <Navigation className="w-5 h-5 mr-2" /> Start Navigation
                 </Button>
               )}
               {booking.status === "worker_arriving" && (
                 <Button className="h-14 w-full bg-emerald-600 hover:bg-emerald-700 text-lg font-bold rounded-2xl shadow-xl shadow-emerald-100" onClick={() => updateStatus("service_started")}>
                    <CheckCircle className="w-5 h-5 mr-2" /> I have Arrived
                 </Button>
               )}
                {booking.status === "service_started" && (
                  <Button className="h-14 w-full bg-orange-600 hover:bg-orange-700 text-lg font-bold rounded-2xl shadow-xl shadow-orange-100" onClick={() => updateStatus("work_finished")}>
                     <CheckCircle className="w-5 h-5 mr-2" /> Complete Job
                  </Button>
                )}

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    className="flex-1 h-14 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50"
                    onClick={() => {
                      const coords = booking.location?.coordinates;
                      if (coords && coords.length === 2) {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
                      } else {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.address)}`, '_blank');
                      }
                    }}
                  >
                    <Navigation className="w-5 h-5 mr-2 text-indigo-600" /> Maps
                  </Button>
                  <Button 
                    variant="secondary"
                    className="flex-1 h-14 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100"
                    onClick={() => window.location.href = `tel:${customerInfo?.phone}`}
                  >
                    <Phone className="w-5 h-5 mr-2" /> Call
                  </Button>
                </div>

                {/* Unassign Option */}
                {['accepted', 'worker_arriving'].includes(booking.status) && (
                   <button 
                    onClick={() => setUnassigning(true)}
                    className="w-full mt-2 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100"
                   >
                     Unassign this job
                   </button>
                )}
          </div>
        </div>
      </div>

      {unassigning && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl"
           >
              <div className="p-6 bg-red-50 text-center border-b border-red-100">
                 <h2 className="text-xl font-bold text-red-800">Cancel Job?</h2>
                 <p className="text-xs text-red-600 mt-1">This will release the job to other workers.</p>
              </div>
              <div className="p-6 space-y-4">
                 <select 
                   value={unassignReason}
                   onChange={(e) => setUnassignReason(e.target.value)}
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-200"
                 >
                    <option value="">Reason for cancellation...</option>
                    <option value="Not skilled for this job">Not skilled for this job</option>
                    <option value="Wrong job assigned">Wrong job assigned</option>
                    <option value="Personal issue">Personal issue</option>
                    <option value="Too far location">Too far location</option>
                    <option value="Other">Other</option>
                 </select>

                 <div className="flex gap-4">
                    <button 
                      onClick={() => setUnassigning(false)}
                      className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
                    >
                      Wait, Back
                    </button>
                    <button 
                      onClick={handleUnassign}
                      disabled={!unassignReason}
                      className="flex-1 py-4 text-sm font-bold bg-red-600 text-white rounded-xl disabled:opacity-50"
                    >
                      Confirm
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
