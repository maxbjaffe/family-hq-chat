"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function LoadingSpinner({
  size = "md",
  className = "",
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
      {text && <span className="text-slate-600 font-medium">{text}</span>}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "button";
}

export function LoadingSkeleton({
  className = "",
  variant = "text",
}: LoadingSkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200 rounded";

  const variantClasses = {
    card: "h-32 w-full rounded-xl",
    text: "h-4 w-full rounded",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-lg",
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
}

export function LoadingOverlay({ isLoading, text = "Loading..." }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Button loading state helper
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function LoadingButton({
  isLoading,
  children,
  loadingText,
  disabled,
  className = "",
  onClick,
  type = "button",
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`relative inline-flex items-center justify-center min-h-[48px] min-w-[48px] px-4 py-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
