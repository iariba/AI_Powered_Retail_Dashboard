import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import from react-router-dom
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { useEffect } from 'react';
import { getUsername } from '../api/auth';
import { logoutUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ChartBar,
  Bell,
  LogOut,
  Menu,
  Sun,
  Moon,
  StoreIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { useTheme } from '../providers/theme-provider';
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/home' },
  { icon: ChartBar, label: 'Forecasts', href: '/forecasts' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: StoreIcon, label: 'Database', href: '/database' },
];
export function Sidebar() {
  const { pathname } = useLocation(); // Get the pathname directly from the Location object
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate(); 
  const [username, setUsername] = useState("Guest");
  useEffect(() => {
    const fetchUsername = async () => {
      const name = await getUsername();
      setUsername(name);
      console.log(username)
    };
  
    fetchUsername();
  }, []);
  
  const handleLogout = () => {
    logoutUser();         
    navigate('/')
  };
  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-2">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white">{username}</h2>
        {/*<p className="text-sm text-green-100/60">Industries</p>*/}
      </div>

      <div className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} to={item.href}> {/* Use 'to' from react-router-dom */}
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-4 text-gray-300 hover:text-white hover:bg-gray-800 mb-1',
                  pathname === item.href && 'bg-gray-800 text-white' // Compare pathname directly
                )}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-gray-300 hover:text-white hover:bg-gray-800"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              Dark Mode
            </>
          )}
        </Button>
       {/* <Button
          variant="ghost"
          className="w-full justify-start gap-4 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <HelpCircle className="h-5 w-5" />
          Help
        </Button>*/}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start gap-4 text-gray-300 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-52 xl:w-72 bg-gray-900 p-0 border-r border-gray-800">

          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block h-screen w-52 xl:w-72 bg-gray-900 fixed left-0 top-0 z-50 border-r border-gray-800">


        <SidebarContent />
      </div>
    </>
  );
}
