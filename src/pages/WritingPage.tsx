import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import TechnicalWriting from "../components/TechnicalWriting/TechnicalWriting";

export default function WritingPage() {
  return (
    <>
      <Navbar />
      <main>
        <TechnicalWriting />
      </main>
      <Footer />
    </>
  );
}
