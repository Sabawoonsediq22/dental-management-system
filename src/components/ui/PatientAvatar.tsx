import React from "react";

interface PatientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  className?: string;
}

// Generate consistent color from name
const getColorFromName = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index] || "bg-blue-500";
};

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
  xxl: "w-20 h-20 text-xl",
};

const PatientAvatar: React.FC<PatientAvatarProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  // Get initials from name
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? "";
      const last = parts[parts.length - 1]?.[0] ?? "";
      return (first + last).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${bgColor}
        rounded-full flex items-center justify-center
        text-white font-medium
        shrink-0
        ${className}
      `}
      title={name}
      role="img"
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
};

export default PatientAvatar;
