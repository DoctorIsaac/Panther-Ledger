import { Header, Hero, Features, Footer } from '../../components'
import './Home.css'

const Home = () => {
  return (
    <div className="home">
      <Header />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}

export default Home