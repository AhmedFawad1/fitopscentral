import Navbar from "../site-components/Navbar";

export default function MarketingLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
