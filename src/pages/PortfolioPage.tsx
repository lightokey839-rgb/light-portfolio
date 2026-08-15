import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import About from "../components/About/About";
import Services from "../components/Services/Services";
import Projects from "../components/Projects/Projects";
import TechStack from "../components/TechStack/TechStack";
import Contact from "../components/Contact/Contact";
import Footer from "../components/Footer/Footer";

export default function PortfolioPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
        <Projects />
        <TechStack />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
