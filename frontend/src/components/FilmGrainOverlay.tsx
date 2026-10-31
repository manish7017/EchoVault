"use client";

import React from "react";

export default function FilmGrainOverlay() {
  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      {/* Subtle atmospheric vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,12,0.45)_100%)]" 
        aria-hidden="true" 
      />
    </>
  );
}
