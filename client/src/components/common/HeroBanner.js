// client/src/components/HeroBanner.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const HeroBanner = ({ 
  title = "", 
  subtitle = "Your One Stop Pet Super Store", 
  icon = "fa-paw",
  subtitleIcon = "fa-heart",
  showImage = true,
  imageSrc = "https://storage.cloud.google.com/furbabies-petstore/FurBabiesIcon.png",
  imageAlt = "FurBabies icon",
  children 
}) => {
  return (
    <section className="furbabies-banner">
      <Container>
        <Row className="justify-content-center align-items-center">
          <Col xs={12} md={10}>
            <h1 className="hero-title">
              <i className={`fas ${icon} me-2`}></i>
              {title}
              {showImage && (
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="hero-icon ms-2"
                />
              )}
            </h1>
            <p className="hero-subtitle">
              <i className={`fas ${subtitleIcon} me-2`}></i>
              {subtitle}
            </p>
            {children}
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default HeroBanner;