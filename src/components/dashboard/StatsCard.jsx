
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-600",
    lightBg: "bg-blue-100",
    shadow: "shadow-blue-500/20"
  },
  green: {
    bg: "bg-green-500", 
    text: "text-green-600",
    lightBg: "bg-green-100",
    shadow: "shadow-green-500/20"
  },
  red: {
    bg: "bg-red-500",
    text: "text-red-600", 
    lightBg: "bg-red-100",
    shadow: "shadow-red-500/20"
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-600",
    lightBg: "bg-orange-100",
    shadow: "shadow-orange-500/20"
  }
};

export default function StatsCard({ 
  title, 
  value, 
  total, 
  icon: Icon, 
  color = "blue",
  isLoading = false 
}) {
  const colorClass = colorClasses[color];

  return (
    <Card className={`relative overflow-hidden border-0 ${colorClass.shadow} bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${colorClass.lightBg} dark:opacity-30 rounded-full transform translate-x-6 -translate-y-6 opacity-60`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 ${colorClass.lightBg} dark:opacity-80 rounded-xl`}>
            <Icon className={`w-4 h-4 ${colorClass.text}`} />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline space-x-1">
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {value}
              </div>
            )}
            {total && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                / {total}
              </div>
            )}
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-tight">
            {title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
