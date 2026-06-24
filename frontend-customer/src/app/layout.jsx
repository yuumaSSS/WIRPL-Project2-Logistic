import "./globals.css";

export const metadata = {
  title: "Logistik",
  description: "Logistik customer app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
