import "./globals.css";

export const metadata = {
  title: "Property Board Game Companion | Real-time Multiplayer",
  description:
    "Funky, pastel, real-time multiplayer companion for the physical property board game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F8F7EF] text-[#171717] antialiased selection:bg-[#FFD95A] selection:text-[#171717]"
      >
        {children}
      </body>
    </html>
  );
}
