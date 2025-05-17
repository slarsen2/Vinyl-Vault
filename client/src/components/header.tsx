import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, User as UserIcon, ChevronDown, LogOut, Settings, LayoutDashboard } from "lucide-react";

interface HeaderProps {
  user: User | null;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export default function Header({ user, onSearch, searchQuery }: HeaderProps) {
  const { logoutMutation } = useAuth();
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleMobileSearch = () => {
    setIsMobileSearchVisible(!isMobileSearchVisible);
  };
  
  return (
    <header className="bg-navy border-b border-amber/20 sticky top-0 z-40 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative w-10 h-10 vinyl-after">
              <div className="absolute inset-0 bg-burgundy rounded-full record-grooves"></div>
            </div>
            <h1 className="text-2xl font-heading font-bold text-amber">VinylVault</h1>
          </div>
          
          {/* Search Bar */}
          <div className="hidden md:block flex-grow max-w-md mx-6">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search your collection..." 
                className="w-full py-2 px-4 pl-10 bg-navy border border-amber/30 rounded-full focus:outline-none focus:ring-2 focus:ring-amber text-sm"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-2.5 text-amber h-5 w-5" />
            </div>
          </div>
          
          {/* Nav Links */}
          <nav className="flex items-center space-x-1 md:space-x-4">
            <button 
              className="md:hidden p-2 rounded-full hover:bg-navy-700"
              onClick={toggleMobileSearch}
            >
              <Search className="text-amber h-5 w-5" />
            </button>
            
            <Link href="/" className="p-2 rounded-md hover:bg-charcoal flex items-center">
              <LayoutDashboard className="text-amber h-5 w-5 mr-1" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-md hover:bg-charcoal flex items-center">
                <UserIcon className="text-amber h-5 w-5 mr-1" />
                <span className="hidden md:inline">{user?.name}</span>
                <ChevronDown className="text-amber h-4 w-4 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-charcoal border-amber/30 text-cream">
                <DropdownMenuItem className="hover:bg-navy cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-navy cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-amber/20" />
                <DropdownMenuItem className="hover:bg-burgundy cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
        
        {/* Mobile Search */}
        {isMobileSearchVisible && (
          <div className="md:hidden mt-3 pb-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search your collection..." 
                className="w-full py-2 px-4 pl-10 bg-navy border border-amber/30 rounded-full focus:outline-none focus:ring-2 focus:ring-amber text-sm"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search className="absolute left-3 top-2.5 text-amber h-5 w-5" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
