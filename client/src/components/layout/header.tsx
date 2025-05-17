import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-20">
      <div className="flex items-center justify-between px-4 py-2">
        <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <i className="fas fa-bars text-xl"></i>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full border-2 border-primary flex items-center justify-center bg-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-6 w-6 text-primary">
                      <path d="M50 10C36.2 10 25 21.2 25 35v30c0 13.8 11.2 25 25 25s25-11.2 25-25V35c0-13.8-11.2-25-25-25zm0 5c11 0 20 9 20 20v5H30v-5c0-11 9-20 20-20zm-20 30h40v25c0 11-9 20-20 20s-20-9-20-20V45z" fill="currentColor"/>
                      <circle cx="40" cy="55" r="5" fill="currentColor"/>
                      <circle cx="60" cy="55" r="5" fill="currentColor"/>
                      <path d="M40 70h20v5H40z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h1 className="font-display text-lg text-primary ml-2">Herschell CRM</h1>
                </div>
              </div>
              
              <nav className="px-2 py-4 flex-1 overflow-y-auto">
                <div className="mb-6">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Main</p>
                  <Link href="/dashboard">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/dashboard' ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-tachometer-alt mr-3 text-primary"></i>
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/members">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/members' || location.startsWith('/members/') ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-users mr-3 text-muted-foreground"></i>
                      Members
                    </a>
                  </Link>
                  <Link href="/membership-tiers">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/membership-tiers' ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-star mr-3 text-muted-foreground"></i>
                      Membership Tiers
                    </a>
                  </Link>
                  <Link href="/transactions">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/transactions' ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-exchange-alt mr-3 text-muted-foreground"></i>
                      Transactions
                    </a>
                  </Link>
                </div>
                
                <div className="mb-6">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Marketing</p>
                  <Link href="/newsletter">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/newsletter' ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-envelope-open-text mr-3 text-muted-foreground"></i>
                      Newsletter
                    </a>
                  </Link>
                  <Link href="/newsletter/campaigns">
                    <a 
                      className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/newsletter/campaigns' ? 'active' : 'hover:bg-gray-50'}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <i className="fas fa-chart-line mr-3 text-muted-foreground"></i>
                      Campaign Reports
                    </a>
                  </Link>
                </div>
                
                {user?.role === 'manager' && (
                  <div>
                    <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>
                    <Link href="/settings">
                      <a 
                        className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/settings' ? 'active' : 'hover:bg-gray-50'}`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <i className="fas fa-cog mr-3 text-muted-foreground"></i>
                        Settings
                      </a>
                    </Link>
                    <Link href="/users">
                      <a 
                        className={`sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md w-full mb-1 ${location === '/users' ? 'active' : 'hover:bg-gray-50'}`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <i className="fas fa-users-cog mr-3 text-muted-foreground"></i>
                        User Management
                      </a>
                    </Link>
                  </div>
                )}
              </nav>
              
              <div className="px-4 py-2 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {user?.firstName
                        ? `${user.firstName} ${user.lastName || ''}`
                        : user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.role === 'manager' ? 'Museum Manager' : 'Staff'}</p>
                  </div>
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center">
          <div className="h-10 w-auto rounded-full border-2 border-primary flex items-center justify-center bg-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-6 w-6 text-primary">
              <path d="M50 10C36.2 10 25 21.2 25 35v30c0 13.8 11.2 25 25 25s25-11.2 25-25V35c0-13.8-11.2-25-25-25zm0 5c11 0 20 9 20 20v5H30v-5c0-11 9-20 20-20zm-20 30h40v25c0 11-9 20-20 20s-20-9-20-20V45z" fill="currentColor"/>
              <circle cx="40" cy="55" r="5" fill="currentColor"/>
              <circle cx="60" cy="55" r="5" fill="currentColor"/>
              <path d="M40 70h20v5H40z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="font-display text-lg text-primary ml-2">Herschell CRM</h1>
        </div>
        
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium">
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
