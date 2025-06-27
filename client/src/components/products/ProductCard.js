// client/src/components/ProductCard.js - FIXED VERSION
import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const ProductCard = ({ product, onAddToCart }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      type: "product",
      brand: product.brand,
      category: product.category,
    };

    addToCart(cartItem, 1);

    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: "fa-bone",
      toys: "fa-ball-pile",
      accessories: "fa-collar",
      health: "fa-heart-pulse",
      grooming: "fa-scissors",
      housing: "fa-house",
      treats: "fa-cookie",
    };
    return icons[category] || "fa-box";
  };

  return (
    <Card className="h-100 product-card shadow-sm">
      <div className="position-relative">
        <Card.Img
          variant="top"
          src={product.image}
          alt={product.name}
          style={{
            height: "200px",
            objectFit: "cover",
            cursor: "pointer",
          }}
        />

        {product.featured && (
          <Badge bg="warning" className="position-absolute top-0 start-0 m-2">
            <i className="fas fa-star me-1"></i>Featured
          </Badge>
        )}

        {!product.inStock && (
          <Badge bg="danger" className="position-absolute top-0 end-0 m-2">
            Out of Stock
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          <small className="text-muted">
            <i className={`fas ${getCategoryIcon(product.category)} me-1`}></i>
            {product.brand}
          </small>
        </div>

        <Card.Title className="h6 mb-2">
          <Link
            to={`/product/${product._id}`}
            className="text-decoration-none text-dark"
          >
            {product.name}
          </Link>
        </Card.Title>

        <Card.Text className="text-muted small mb-2 flex-grow-1">
          {product.description && product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description}
        </Card.Text>

        {product.rating && product.rating.count > 0 && (
          <div className="mb-2">
            <small className="text-warning">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`fas fa-star${i < Math.floor(product.rating.average) ? "" : "-o"}`}
                ></i>
              ))}
              <span className="text-muted ms-1">({product.rating.count})</span>
            </small>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-auto">
          <div className="price">
            <span className="h5 mb-0 text-primary fw-bold">
              {formatPrice(product.price)}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="d-flex align-items-center"
          >
            <i className="fas fa-cart-plus me-1"></i>
            Add to Cart
          </Button>
        </div>

        <div className="mt-2">
          <small className="text-muted">
            <i className="fas fa-tag me-1"></i>
            {product.category} •{" "}
            {product.petType ? product.petType.join(", ") : "All Pets"}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
