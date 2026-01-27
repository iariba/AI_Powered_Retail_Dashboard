import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
 // DropdownMenuContent,
 // DropdownMenuItem,
  //DropdownMenuLabel,
  //DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';

export function Navbar() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Sidebar />
        <div className="ml-4 lg:ml-72">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        
        {/*<div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src="https://ui.shadcn.com/avatars/01.png" />
                  <AvatarFallback>AK</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Anna Katrina Marchesi</p>
                  <p className="text-xs text-muted-foreground">Head of Administrator</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>*/}
      </div>
    </div>
  );
}
