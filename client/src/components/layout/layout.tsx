import React from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header for mobile */}
        <Header />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto carousel-pattern pb-8">
          <div className="container mx-auto md:pt-8 pt-16 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
