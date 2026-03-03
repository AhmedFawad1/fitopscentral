import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "./site-components/Footer";
import Navbar from "./site-components/Navbar";



const poppins = Poppins({
  weight: ['400', '700'],
  subsets: ['latin'],
});


export const metadata = {
  title: "FitOps Central | Gym Management Software",
  description: "Gym management software for fitness businesses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
