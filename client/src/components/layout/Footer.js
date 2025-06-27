import React from "react";
import { Container } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="text-center">
      <Container>
        <p className="mb-3">
          <i className="fas fa-paw me-2"></i>&copy; 2025 FurBabies. All rights
          reserved.
        </p>
        <div className="footer-icons">
          <a
            href="https://facebook.com/furbabies"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit our Facebook page"
          >
            <i className="fab fa-facebook"></i>
          </a>
          <a
            href="https://twitter.com/furbabies"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit our Twitter page"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://instagram.com/furbabies"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit our Instagram page"
          >
            <i className="fab fa-instagram"></i>
          </a>
          <a href="tel:+1-555-0123" aria-label="Call us">
            <i className="fas fa-phone"></i>
          </a>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
