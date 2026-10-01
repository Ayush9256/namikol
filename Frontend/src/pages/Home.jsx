import Hero from "../components/home/Hero"
import NewArrivals from "../components/home/NewArrivals"
import BestSellers from "../components/home/BestSellers"
import EditorialBanner from "../components/home/EditorialBanner"
import WhyChoose from "../components/home/WhyChoose"
import Testimonials from "../components/home/Testimonials"
import Gallery from "../components/home/Gallery"
import Newsletter from "../components/home/Newsletter"

function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Hero />
      <NewArrivals />
      <BestSellers />
      <EditorialBanner />
      <WhyChoose />
      <Testimonials />
      <Gallery />
      <Newsletter />
    </main>
  )
}

export default Home