import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TopBarProps {
  activeTab?: string;
  onNavigate?: (tab: "Dashboard" | "My products" | "Certificates" | "Help") => void;
  onLogout?: () => void;
  userEmail?: string;
  userName?: string;
}

export function TopBar({ activeTab = "Dashboard", onNavigate, onLogout, userEmail = "john.doe@example.com", userName = "John Doe" }: TopBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: "Dashboard" as const },
    { label: "My products" as const },
    { label: "Certificates" as const },
    { label: "Help" as const }
  ];

  const handleNavClick = (label: "Dashboard" | "My products" | "Certificates" | "Help") => {
    if (onNavigate) {
      onNavigate(label);
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Get user initials
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavClick("Dashboard")}
              className="text-blue-600 text-xl hover:text-blue-700 transition-colors"
            >
              Simplehire
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.label)}
                className={`text-sm transition-colors ${
                  item.label === activeTab
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User avatar with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              className="flex items-center gap-2 hover:bg-slate-50 rounded-full pr-3 pl-1 py-1 transition-colors" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">{getInitials(userName)}</AvatarFallback>
              </Avatar>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-slate-200">
                    <p className="text-sm text-slate-900">{userName}</p>
                    <p className="text-xs text-slate-500">{userEmail}</p>
                  </div>
                  
                  {/* Menu items */}
                  <div className="py-1">
                    <button 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 text-slate-600" />
                      Profile
                    </button>
                    <button 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-slate-600" />
                      Settings
                    </button>
                  </div>
                  
                  {/* Logout - separated */}
                  <div className="border-t border-slate-200 py-1">
                    <button 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}