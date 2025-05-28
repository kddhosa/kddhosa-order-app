import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  children,
  fallback,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={className}>
        {fallback || <Skeleton className="h-8 w-full" />}
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingWrapper;
