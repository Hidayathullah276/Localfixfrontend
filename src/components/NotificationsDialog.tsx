import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, ExternalLink, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

interface NotificationsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationsDialog({ isOpen, onClose }: NotificationsProps) {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = (n: any) => {
        markAsRead(n._id || n.id);
        if (n.link) {
            navigate(n.link);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-4 left-4 md:left-auto md:right-8 md:w-96 glass-card z-[101] overflow-hidden flex flex-col max-h-[70vh]"
                    >
                        <div className="p-4 border-b flex items-center justify-between bg-primary/5">
                            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />
                                Notifications
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-primary hover:underline"
                                >
                                    Mark all as read
                                </button>
                                <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <Inbox className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n._id || n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 rounded-xl transition-all cursor-pointer relative border ${n.isRead ? 'bg-card border-transparent opacity-70' : 'bg-primary/5 border-primary/10 shadow-sm'
                                            }`}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
                                        )}
                                        <h4 className={`text-sm font-bold ${n.isRead ? 'text-foreground' : 'text-primary'}`}>{n.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                        <div className="flex items-center justify-between mt-3 text-[10px]">
                                            <span className="text-muted-foreground/60">{new Date(n.createdAt).toLocaleString()}</span>
                                            {n.link && <span className="flex items-center gap-1 text-primary font-bold">View <ExternalLink className="w-3 h-3" /></span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
