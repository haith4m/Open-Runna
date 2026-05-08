import React from "react";
import {
  TouchableOpacity, Text, ActivityIndicator, View,
  type TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles: Record<string, string> = {
    primary: "bg-brand",
    secondary: "bg-bg-elevated border border-bg-overlay",
    ghost: "bg-transparent",
    destructive: "bg-accent",
  };

  const textStyles: Record<string, string> = {
    primary: "text-bg font-semibold",
    secondary: "text-text-primary font-medium",
    ghost: "text-brand font-medium",
    destructive: "text-white font-semibold",
  };

  const sizeStyles: Record<string, { container: string; text: string }> = {
    sm: { container: "px-4 py-2 rounded-xl", text: "text-sm" },
    md: { container: "px-6 py-4 rounded-2xl", text: "text-base" },
    lg: { container: "px-8 py-5 rounded-2xl", text: "text-lg" },
  };

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      style={[{ opacity: isDisabled ? 0.5 : 1 }, style as any]}
      className={`${containerStyles[variant]} ${sizeStyles[size]!.container} flex-row items-center justify-center gap-2`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#0A0A0A" : "#00D4AA"}
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={`${textStyles[variant]} ${sizeStyles[size]!.text}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
