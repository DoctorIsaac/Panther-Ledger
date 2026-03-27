import './footer.css'
import fiuLogo from '../../assets/fiu-logo.png'


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <img src={fiuLogo} alt="FIU Logo" className="footer-logo" />
      </div>
    </footer>
  )
}

export default Footer
