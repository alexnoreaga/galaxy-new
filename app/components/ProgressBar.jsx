import React from 'react'
import { NavLink, useLoadingRoute } from "@remix-run/react";

export const ProgressBar = () => {
    const loadingRoute = useLoadingRoute();
  
    if (!loadingRoute) {
      return null;
    }
  
    return (
      <div style={{ width: "100%", height: "4px", position: "fixed", top: 0, left: 0, backgroundColor: "blue", transform: `scaleX(${loadingRoute.progress})`, transformOrigin: "left", zIndex: 999 }}></div>
    );
  }

