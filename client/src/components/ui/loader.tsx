import React from "react";

export function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-lg font-medium text-primary">Loading...</p>
      </div>
    </div>
  );
}
