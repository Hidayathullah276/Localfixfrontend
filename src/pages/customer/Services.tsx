import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { ServiceIcon } from "@/components/ServiceIcon";
import { BottomNav } from "@/components/BottomNav";
import { motion } from "framer-motion";
import { ArrowLeft, Star, IndianRupee, Zap } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    api.get("/services")
      .then((data) => {
        setServices(data);
      });
  }, []);

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">All Services</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose a service to get started</p>

        <div className="space-y-3">
          {services.map((service, i) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/book/${service._id}`} className="block glass-card-hover p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                    <ServiceIcon icon={service.icon || "Wrench"} className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground">{service.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold gradient-text flex items-center">
                        <IndianRupee className="w-3 h-3" />{service.base_price}
                      </span>
                      {service.emergency_price && (
                        <span className="text-[10px] text-destructive flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> ₹{service.emergency_price}
                        </span>
                      )}
                      <span className="text-[10px] text-amber-500 flex items-center gap-0.5 ml-auto">
                        <Star className="w-3 h-3 fill-current" /> 4.8
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
