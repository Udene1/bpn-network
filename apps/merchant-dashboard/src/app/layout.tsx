import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "BPN Merchant Dashboard",
  description: "Secure biometric payment management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ display: 'flex' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
