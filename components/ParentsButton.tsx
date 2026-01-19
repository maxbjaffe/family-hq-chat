"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PinModal } from "@/components/PinModal";
import { Shield } from "lucide-react";

interface UserInfo {
  id: string;
  name: string;
  role: "admin" | "adult" | "kid";
}

interface ParentsButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function ParentsButton({
  className = "",
  variant = "outline",
  size = "default"
}: ParentsButtonProps) {
  const router = useRouter();
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePinSuccess = (user: UserInfo) => {
    setShowPinModal(false);
    // Route to parent dashboard with user context
    router.push(`/parents?user=${encodeURIComponent(user.name)}`);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowPinModal(true)}
        className={`gap-2 ${className}`}
      >
        <Shield className="h-4 w-4" />
        Parents
      </Button>

      <PinModal
        isOpen={showPinModal}
        onSuccess={handlePinSuccess}
        onCancel={() => setShowPinModal(false)}
        title="Parent Access"
      />
    </>
  );
}
