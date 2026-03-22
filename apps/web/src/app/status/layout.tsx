import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Systemstatus | Zentory",
  description: "Aktueller Systemstatus und Betriebsinformationen von Zentory.",
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
