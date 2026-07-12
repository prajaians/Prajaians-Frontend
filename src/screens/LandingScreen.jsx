import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingStyles.css';

// Cloudinary CDN assets — f_auto,q_auto lets Cloudinary auto-pick the best
// format (WebP/AVIF for images, VP9/H.265 for video) and compression for
// each visitor's browser, which is why these load fast in production
// instead of shipping the original heavy .jpeg/.mov files.
const cafeLogo = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875610/logo_n8wr9w.jpg';
const cafe1 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe1_pgpxym.jpg';
const cafe2 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe2_lic9is.jpg';
const cafe3 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe3_jsjdn1.jpg';
const cafe4 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe4_tuihln.jpg';
const cafe5 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe5_dbod0q.jpg';
const cafe6 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe6_et1xmo.jpg';
const cafe7 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875596/cafe7_rtlfce.jpg';
const cafe8 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe8_j72lj6.jpg';
const cafe9 = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875595/cafe9_nlz1mb.jpg';
const managerAvatar = 'https://res.cloudinary.com/mddemz67/image/upload/f_auto,q_auto/v1783875599/manager_avatar_ceiris.jpg';

// Videos: f_auto,q_auto again for adaptive codec/bitrate. w_1280 caps the
// hero/grid videos at a sane delivery width so Cloudinary doesn't stream
// full source resolution to a small on-screen player.
const video1 = 'https://res.cloudinary.com/mddemz67/video/upload/f_auto,q_auto,w_1280/v1783875612/Chocolate_Lava_cfstxl.mov';
const video2 = 'https://res.cloudinary.com/mddemz67/video/upload/f_auto,q_auto,w_1280/v1783875609/Dynamite_Beef_French_Fries_zrsu66.mp4';
const video3 = 'https://res.cloudinary.com/mddemz67/video/upload/f_auto,q_auto,w_1280/v1783875599/Chicken_Tikka_q8wx9h.mp4';

const LandingScreen = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    setLoaded(true);

    // Scroll reveal animations
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-children');
    const revealOnScroll = () => {
      revealElements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementTop < windowHeight - 100) {
          el.classList.add('active');
        }
      });
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      const sections = ['home', 'about', 'menu', 'gallery', 'contact'];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
      revealOnScroll();
    };

    window.addEventListener('scroll', handleScroll);
    revealOnScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openLightbox = (img) => {
    setLightboxImage(img);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage(null);
    document.body.style.overflow = 'auto';
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Navigate to login page
  const handleLoginClick = () => {
    navigate('/login');
  };

  const menuItems = [
    { name: 'CHICKEN BITES', price: '₹32', description: 'Arborio rice with black truffle shavings', category: 'Signature' },
    { name: 'WRAPS', price: '₹58', description: 'A5 Japanese wagyu, grilled to perfection', category: 'Premium' },
    { name: 'CLASSIC CHICKEN BURGER', price: '₹45', description: 'Maine lobster in creamy cognac sauce', category: 'Signature' },
    { name: 'SANDWICHES', price: '₹38', description: 'Slow-cooked duck leg, apple gastrique', category: 'Chef Special' },
    { name: 'BURGER', price: '₹42', description: 'Saffron rice with fresh catch of the day', category: 'Popular' },
    { name: 'SHAKES', price: '₹36', description: 'Butternut squash, spinach, feta pastry', category: 'Vegetarian' },
  ];

  const galleryImages = [
    cafe1,
    cafe2,
    cafe3,
    cafe4,
    cafe5,
    cafe6,
    cafe7,
    cafe8,
    cafe9,
  ];

  const testimonials = [
    { name: 'Sarah Mitchell', text: 'An extraordinary dining experience. The ambiance, the service, and the food are absolutely world-class.', rating: 5 },
    { name: 'James Chen', text: 'Prajaian\'s Resto-Cafe has become my go-to place for special occasions. Impeccable attention to detail.', rating: 5 },
  ];

  const reservationTimeSlots = [
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '20:00', label: '8:00 PM' },
    { value: '21:00', label: '9:00 PM' },
  ];

  const reservationHighlights = [
    'Instant booking request',
    'Private event support',
    'Vegetarian-friendly menu',
  ];

  return (
    <div className={`landing-page ${loaded ? 'loaded' : ''}`}>
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Premium Background - only for non-hero sections */}
      <div className="page-background"></div>

      {/* Floating Particles */}
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{ animationDelay: `${i * 0.5}s` }}></div>
        ))}
      </div>

      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar">
        <div className="scroll-progress-fill" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-modal" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>&times;</button>
          <img src={lightboxImage} alt="Gallery Full View" className="lightbox-image" />
        </div>
      )}

      {/* Navigation */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo">
            <img src={cafeLogo} alt="Prajaian's Cafe Logo" className="logo-img" />
            <span className="logo-text">PRAJAIAN'S</span>
          </div>

          <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} role="navigation" aria-label="Main navigation">
            {['home', 'about', 'menu', 'gallery', 'contact'].map((item) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className={`nav-link ${activeSection === item ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item);
                  }}
                  aria-current={activeSection === item ? 'page' : undefined}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="btn-login" onClick={handleLoginClick}>
              SignIn
            </button>
            <button className="btn-reserve" onClick={() => scrollToSection('contact')}>
              Reserve Table
            </button>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Video Only */}
      <section id="home" className="hero-section" role="banner" aria-label="Restaurant ambiance video">
        <video
          className="hero-video-bg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={cafe1}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        >
          <source src={video1} type="video/mp4" />
        </video>
        <div className="video-overlay" aria-hidden="true"></div>
      </section>

      {/* Food Highlights Section */}
      <section className="food-highlights">
        <div className="container">
          <div className="section-header light">
            <span className="section-tag">Chef's Selection</span>
            <h2 className="section-title">Signature <span>Dishes</span></h2>
          </div>
          <div className="food-video-grid">
            <div className="food-video-card">
              <video autoPlay muted loop playsInline preload="auto">
                <source src={video1} type="video/mp4" />
              </video>
              <div className="food-video-overlay">
                <span>Chocolate Lava</span>
              </div>
            </div>
            <div className="food-video-card">
              <video autoPlay muted loop playsInline preload="auto">
                <source src={video2} type="video/mp4" />
              </video>
              <div className="food-video-overlay">
                <span>Dynamite Fries</span>
              </div>
            </div>
            <div className="food-video-card">
              <video autoPlay muted loop playsInline preload="auto">
                <source src={video3} type="video/mp4" />
              </video>
              <div className="food-video-overlay">
                <span>Chicken Tikka</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider"></div>

      {/* About Section */}
      <main id="main-content">
        <section id="about" className="about-section reveal">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Our Story</span>
              <h2 className="section-title">A Legacy of <span>Excellence</span></h2>
            </div>
            <div className="about-grid">
              <div className="about-content">
                <p className="about-text">
                  Nestled in the heart of the city, Prajain's Resto-Cafe has been crafting
                  unforgettable culinary experiences since 2023. Our philosophy is simple:
                  source the finest ingredients, honor traditional techniques, and present
                  each dish with artistic flair.
                </p>
                <p className="about-text">
                  Led by our visionary chef, every plate tells a story of passion, precision,
                  and the rich tapestry of flavors that define our kitchen.
                </p>
                <div className="about-features">
                  <div className="feature">
                    <span className="feature-number">15+</span>
                    <span className="feature-label">Years of Excellence</span>
                  </div>
                  <div className="feature">
                    <span className="feature-number">50K+</span>
                    <span className="feature-label">Happy Guests</span>
                  </div>
                  <div className="feature">
                    <span className="feature-number">3</span>
                    <span className="feature-label">Michelin Stars</span>
                  </div>
                </div>
              </div>
              <div className="about-images">
                <div className="about-img-main">
                  <img src={cafe2} alt="Our Cafe Interior" />
                </div>
                <div className="about-img-secondary">
                  <img src={cafe7} alt="Fine dining" />
                </div>
                <div className="about-decoration">
                  <span>✦</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Section */}
        <section id="menu" className="menu-section reveal">
          <div className="container">
            <div className="section-header light">
              <span className="section-tag">Our Menu</span>
              <h2 className="section-title">Culinary <span>Masterpieces</span></h2>
              <p className="section-desc">
                Each dish is a celebration of flavor, crafted with passion and precision
              </p>
            </div>
            <div className="menu-grid">
              {menuItems.map((item, index) => (
                <div className="menu-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="menu-card-header">
                    <span className="menu-category">{item.category}</span>
                    <span className="menu-price">{item.price}</span>
                  </div>
                  <h3 className="menu-item-name">{item.name}</h3>
                  <p className="menu-item-desc">{item.description}</p>
                  <div className="menu-card-footer">
                    <button className="btn-add">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="menu-cta">
              <button className="btn-view-menu">View Full Menu</button>
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider"></div>

        {/* Gallery Section */}
        <section id="gallery" className="gallery-section reveal">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Gallery</span>
              <h2 className="section-title">A Feast for the <span>Eyes</span></h2>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((img, index) => (
                <div
                  className={`gallery-item ${index === 0 ? 'large' : ''} ${index === 3 || index === 6 ? 'tall' : ''}`}
                  key={index}
                  onClick={() => openLightbox(img)}
                >
                  <img src={img} alt={`Gallery ${index + 1}`} loading="lazy" decoding="async" />
                  <div className="gallery-overlay">
                    <span>+</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider"></div>

        {/* Testimonials Section */}
        <section className="testimonials-section reveal">
          <div className="container">
            <div className="section-header light">
              <span className="section-tag">Testimonials</span>
              <h2 className="section-title">What Our <span>Guests Say</span></h2>
            </div>
            <div className="testimonials-grid">
              {testimonials.map((testimonial, index) => (
                <div className="testimonial-card" key={index}>
                  <div className="testimonial-stars">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className="author-avatar">
                      {testimonial.name.charAt(0)}
                    </div>
                    <span className="author-name">{testimonial.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section Divider */}
        <div className="section-divider"></div>

        {/* Contact/Reservation Section */}
        <section id="contact" className="contact-section reveal">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info">
                <span className="section-tag">Reservations</span>
                <h2 className="section-title">Book Your <span>Table</span></h2>
                <p className="contact-desc">
                  Reserve your table for an unforgettable dining experience.
                  Our team is ready to make your evening special.
                </p>
                <div className="reservation-highlights">
                  {reservationHighlights.map((highlight) => (
                    <span key={highlight} className="reservation-highlight-pill">{highlight}</span>
                  ))}
                </div>
                <div className="contact-details">
                  <div className="contact-item">
                    <div className="contact-icon">📍</div>
                    <div className="contact-copy">
                      <h4>Location</h4>
                      <p>Near Shanthi Hospital, Kodakara, Thrissur Dt, Kerala - 680684.</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon">📞</div>
                    <div className="contact-copy">
                      <h4>Phone</h4>
                      <p>+91 85907 47379</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <div className="contact-icon">🕐</div>
                    <div className="contact-copy">
                      <h4>Hours</h4>
                      <p>Mon-Sun: 11:00 AM - 11:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="contact-form">
                <form className="reservation-form">
                  <div className="reservation-form-header">
                    <div className="reservation-form-heading">
                      <span className="reservation-form-tag">Online booking</span>
                      <h3>Plan your visit in minutes</h3>
                    </div>
                    <p className="reservation-form-copy">Share your details and preferred timing. We&apos;ll prepare the perfect table for you.</p>
                  </div>

                  <div className="reservation-grid">
                    <div className="reservation-field">
                      <label htmlFor="reservation-name">Full Name</label>
                      <input id="reservation-name" type="text" placeholder="Enter your full name" required />
                    </div>
                    <div className="reservation-field">
                      <label htmlFor="reservation-phone">Phone Number</label>
                      <input id="reservation-phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" required />
                    </div>
                    <div className="reservation-field">
                      <label htmlFor="reservation-email">Email Address</label>
                      <input id="reservation-email" type="email" placeholder="guest@example.com" required />
                    </div>
                    <div className="reservation-field">
                      <label htmlFor="reservation-guests">Party Size</label>
                      <select id="reservation-guests" required>
                        <option value="">Select guests</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="reservation-field">
                      <label htmlFor="reservation-date">Reservation Date</label>
                      <input id="reservation-date" type="date" required />
                    </div>
                    <div className="reservation-field">
                      <label htmlFor="reservation-time">Preferred Time</label>
                      <select id="reservation-time" required>
                        <option value="">Select time</option>
                        {reservationTimeSlots.map((slot) => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="reservation-field reservation-field-wide">
                      <label htmlFor="reservation-occasion">Occasion or Seating Preference</label>
                      <input id="reservation-occasion" type="text" placeholder="Birthday, family dinner, window seat..." />
                    </div>
                    <div className="reservation-field reservation-field-wide">
                      <label htmlFor="reservation-note">Special Requests</label>
                      <textarea id="reservation-note" placeholder="Tell us about dietary needs, decorations, or anything else we should prepare."></textarea>
                    </div>
                  </div>

                  <div className="reservation-form-footer">
                    <div className="reservation-assurance">
                      <span>Response window</span>
                      <strong>Within business hours</strong>
                    </div>
                    <button type="submit" className="btn-submit reservation-submit">Reserve My Table</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src={cafeLogo} alt="Prajain's Cafe Logo" className="logo-img" />
                <span className="logo-text">Prajain's</span>
              </div>
              <p className="footer-tagline">Where every meal is a celebration</p>
            </div>
            <div className="footer-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3920.5!2d76.2!3d10.35!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDIxJzAwLjAiTiA3NsKwMTInMDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Restaurant Location"
              ></iframe>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Quick Links</h4>
                <ul>
                  <li><button onClick={() => scrollToSection('home')}>Home</button></li>
                  <li><button onClick={() => scrollToSection('about')}>About</button></li>
                  <li><button onClick={() => scrollToSection('menu')}>Menu</button></li>
                  <li><button onClick={() => scrollToSection('contact')}>Contact</button></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <ul>
                  <li><button>Privacy Policy</button></li>
                  <li><button>Terms of Service</button></li>
                  <li><button>Cookie Policy</button></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Connect</h4>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Prajain's Resto-Cafe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingScreen;