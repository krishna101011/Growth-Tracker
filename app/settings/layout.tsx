import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Settings — Growth Graph",
  description: "Configure your Growth Graph preferences, AI review keys, and data management.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
