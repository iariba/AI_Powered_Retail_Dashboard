import { useEffect, useState } from "react";
import { Sidebar } from "../layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { getNotifications } from "../api/notifications"; 
type Notification = {
  _id: string;
  message: string;
  createdAt: string;
  severity:string
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getNotifications();
      setNotifications(data);
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:ml-52 xl:ml-72">
        <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" /> Notifications
        </h1>
        <div className="space-y-4">
          {notifications.map((notification) => (
         <Card
         key={notification._id}
         className={`p-4 border rounded-lg shadow-sm ${
           notification.severity === "high"
             ? "bg-red-100 border-red-400 text-gray-800 dark:bg-red-200"
             : notification.severity === "medium"
             ? "bg-yellow-100 border-yellow-300 text-gray-800 dark:bg-yellow-200"
             : " dark:text-white"
         }`}
       >
         <p
           className={`font-medium ${
             notification.severity === "high" || notification.severity === "medium"
               ? "text-gray-800"
               : "text-gray-800 dark:text-white"
           }`}
         >
           {notification.message}
         </p>
         <p
           className={`text-sm mt-1 ${
             notification.severity === "high" || notification.severity === "medium"
               ? "text-gray-700"
               : "text-gray-500 dark:text-gray-400"
           }`}
         >
           {new Date(notification.createdAt).toLocaleString()}
         </p>
       </Card>
       
          ))}
        </div>
      </main>
    </div>
  );
}
