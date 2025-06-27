// client/src/pages/Products.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import ProductCard from "../../components/products/ProductCard";
import api from "../../services/api";
import { useCart } from "../../contexts/CartContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartMessage, setCartMessage] = useState("");

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get("/products");
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    setCartMessage(`${product.name} added to cart!`);
    setTimeout(() => setCartMessage(""), 3000);
  };

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <h2 className="text-center mb-4">
        <i className="fas fa-shopping-bag me-2"></i>Shop All Products
      </h2>

      {cartMessage && (
        <Alert variant="success" className="text-center">
          <i className="fas fa-check-circle me-2"></i>
          {cartMessage}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" />
          <div className="mt-2">Loading products...</div>
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      ) : (
        <Row className="g-4">
          {products.map((product) => (
            <Col key={product._id} sm={6} md={4} lg={3}>
              <ProductCard product={product} onAddToCart={handleAddToCart} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Products;
