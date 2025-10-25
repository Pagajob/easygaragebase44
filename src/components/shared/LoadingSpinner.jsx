import React from "react";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/7786828b2_G.png";

export default function LoadingSpinner({ size = "md", text = "Chargement..." }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <img 
          src={EASYGARAGE_LOGO} 
          alt="Chargement" 
          className="w-full h-full"
        />
      </div>
      {text && (
        <p className="text-slate-600 dark:text-slate-400 mt-4 text-center">{text}</p>
      )}
    </div>
  );
}