import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Carousel,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import PetCard from "../../components/pets/PetCard";
import ProductCard from "../../components/products/ProductCard";
import { useCart } from "../../contexts/CartContext";
import api from "../../services/api";
import HeroBanner from "../../components/common/HeroBanner";

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartMessage, setCartMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        setLoading(true);
        const [petsRes, productsRes] = await Promise.all([
          api.get("/pets/featured"),
          api.get("/products/featured?limit=3"),
        ]);
        setFeaturedPets(petsRes.data.data || []);
        setFeaturedProducts(productsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching featured items:", err);
        setError("Failed to load featured items.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedData();
  }, []);

  const handleAddToCart = (product) => {
    // Prevent double clicks
    if (isAddingToCart) return;
    
    setIsAddingToCart(true);
    addToCart(product);
    setCartMessage(`${product.name} added to cart!`);
    
    // Reset protection after delay
    setTimeout(() => {
      setIsAddingToCart(false);
      setCartMessage("");
    }, 3000);
  };

  const testimonials = [
    {
      name: "Jessica R.",
      text: "FurBabies has everything I need for my pup. The staff is friendly and the quality is top-notch!",
      icon: "fa-dog",
      rating: 5.0,
    },
    {
      name: "Marcus D.",
      text: "My cat LOVES the toys I got here. Fast delivery and great prices!",
      icon: "fa-cat",
      rating: 4.8,
    },
    {
      name: "Linda M.",
      text: "Excellent customer service and a wide variety of pet products. Highly recommended!",
      icon: "fa-fish",
      rating: 5.0,
    },
  ];

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link to="/browse" className="btn btn-lg btn-light px-4 py-2">
            <i className="fas fa-paw me-2"></i>Browse Pets
          </Link>
          <Link to="/products" className="btn btn-lg btn-outline-light px-4 py-2">
            <i className="fas fa-shopping-bag me-2"></i>Shop Products
          </Link>
        </div>
      </HeroBanner>

      {/* Cart Message */}
      {cartMessage && (
        <Container className="mt-3">
          <Alert variant="success" className="text-center">
            <i className="fas fa-check-circle me-2"></i>
            {cartMessage}
          </Alert>
        </Container>
      )}

      {/* Quick Actions Section */}
      <section className="py-4 bg-light">
        <Container>
          <Row className="g-3">
            <Col md={3} sm={6}>
              <Card className="h-100 text-center border-0 shadow-sm hover-lift">
                <Card.Body className="py-4">
                  <i className="fas fa-search fa-2x text-primary mb-3"></i>
                  <h6 className="fw-bold">Find a Pet</h6>
                  <small className="text-muted">Browse our adoptable friends</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 text-center border-0 shadow-sm hover-lift">
                <Card.Body className="py-4">
                  <i className="fas fa-calendar-alt fa-2x text-success mb-3"></i>
                  <h6 className="fw-bold">Schedule Visit</h6>
                  <small className="text-muted">Meet your potential companion</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 text-center border-0 shadow-sm hover-lift">
                <Card.Body className="py-4">
                  <i className="fas fa-shopping-cart fa-2x text-warning mb-3"></i>
                  <h6 className="fw-bold">Pet Supplies</h6>
                  <small className="text-muted">Everything your pet needs</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="h-100 text-center border-0 shadow-sm hover-lift">
                <Card.Body className="py-4">
                  <i className="fas fa-phone fa-2x text-info mb-3"></i>
                  <h6 className="fw-bold">Get Support</h6>
                  <small className="text-muted">Expert pet care advice</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Products */}
      <section id="products" className="py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="mb-3">
              <i className="fas fa-star me-2"></i>Featured Products
            </h2>
            <p className="text-muted">Premium products for your beloved pets</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading products...</span>
              </div>
            </div>
          ) : error ? (
            <Alert variant="warning" className="text-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          ) : featuredProducts.length > 0 ? (
            <>
              <Row className="g-4">
                {featuredProducts.map((product) => (
                  <Col key={product._id} md={4}>
                    <ProductCard 
                      product={product} 
                      onAddToCart={handleAddToCart}
                      disabled={isAddingToCart}
                    />
                  </Col>
                ))}
              </Row>
              <div className="text-center mt-4">
                <Link to="/products" className="btn btn-outline-primary">
                  <i className="fas fa-shopping-bag me-2"></i>
                  View All Products
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-box fa-3x text-muted mb-3"></i>
              <h4>No Featured Products</h4>
              <p className="text-muted">
                Featured products will appear here soon!
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Featured Pets */}
      {featuredPets.length > 0 && (
        <section className="py-5 bg-light">
          <Container>
            <div className="text-center mb-5">
              <h2 className="mb-3">
                <i className="fas fa-heart me-2"></i>Featured Pets
              </h2>
              <p className="text-muted">Find your perfect companion</p>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading pets...</span>
                </div>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {featuredPets.slice(0, 3).map((pet) => (
                    <Col key={pet._id} md={4}>
                      <PetCard 
                        pet={pet} 
                        size="large"
                        showAddToCart={true}
                      />
                    </Col>
                  ))}
                </Row>
                <div className="text-center mt-4">
                  <Link to="/browse" className="btn btn-primary">
                    <i className="fas fa-paw me-2"></i>
                    View All Pets
                  </Link>
                </div>
              </>
            )}
          </Container>
        </section>
      )}

      {/* Recent Pets Section - Using medium size */}
      {featuredPets.length > 3 && (
        <section className="py-5">
          <Container>
            <div className="text-center mb-5">
              <h2 className="mb-3">
                <i className="fas fa-paw me-2"></i>More Amazing Pets
              </h2>
              <p className="text-muted">Even more furry friends looking for homes</p>
            </div>
            
            <Row className="g-4">
              {featuredPets.slice(3, 9).map((pet) => (
                <Col key={pet._id} sm={6} md={4} lg={3}>
                  <PetCard 
                    pet={pet} 
                    size="medium"
                    showAddToCart={true}
                  />
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="mb-3">
              <i className="fas fa-award me-2"></i>Why Choose FurBabies?
            </h2>
            <p className="text-muted">We're committed to connecting pets with loving families</p>
          </div>
          <Row className="g-4">
            <Col md={4}>
              <div className="text-center h-100">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-shield-alt fa-2x text-white"></i>
                </div>
                <h5>Health Guaranteed</h5>
                <p className="text-muted">All pets are health-checked and vaccinated before adoption</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center h-100">
                <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-heart fa-2x text-white"></i>
                </div>
                <h5>Lifetime Support</h5>
                <p className="text-muted">We provide ongoing support and advice for your pet's wellbeing</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center h-100">
                <div className="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
                  <i className="fas fa-users fa-2x text-white"></i>
                </div>
                <h5>Perfect Matching</h5>
                <p className="text-muted">We help match pets with families based on lifestyle and preferences</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-5">
        <Container>
          <h2 className="text-center mb-5">
            <i className="fas fa-comments me-2"></i>What Our Customers Say
          </h2>

          <Carousel indicators={false} className="testimonial-carousel">
            {testimonials.map((testimonial, index) => (
              <Carousel.Item key={index}>
                <div className="d-flex justify-content-center">
                  <Card className="p-4 shadow" style={{ maxWidth: "700px" }}>
                    <Card.Body className="text-center">
                      <i className="fas fa-quote-left fa-2x text-muted mb-3"></i>
                      <p className="lead">{testimonial.text}</p>
                      <div className="mt-4">
                        <i
                          className={`fas ${testimonial.icon} fa-2x text-warning mb-2`}
                        ></i>
                        <h5 className="mb-0">{testimonial.name}</h5>
                        <small className="text-muted">
                          <i className="fas fa-star text-warning"></i>{" "}
                          {testimonial.rating} | Verified Buyer
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Container>
      </section>
    </>
  );
};

export default Home;