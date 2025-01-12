import "./globals.css";

export const metadata = {
  title: "HTML Splitter",
  description: "Frontend to split large HTML into fragments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
