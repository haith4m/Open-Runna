import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  elevated?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, children, style, ...props }: CardProps) {
  return (
    <View
      {...props}
      style={style}
      className={`${elevated ? "bg-bg-elevated" : "bg-bg-surface"} rounded-2xl p-4`}
    >
      {children}
    </View>
  );
}
