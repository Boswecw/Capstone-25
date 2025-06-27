// client/src/components/Cart/CartDropdown.js
import React from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const CartDropdown = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (!isOpen) return null;

  return (
    <div
      className="cart-dropdown"
      style={{
        position: "absolute",
        top: "100%",
        right: "0",
        width: "350px",
        maxHeight: "400px",
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Shopping Cart ({items.length})</h6>
          <Button variant="link" size="sm" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </div>
      </div>

      <div style={{ maxHeight: "250px", overflowY: "auto", padding: "0.5rem" }}>
        {items.length === 0 ? (
          <div className="text-center py-4">
            <i className="fas fa-shopping-cart fa-2x text-muted mb-2"></i>
            <p className="text-muted">Your cart is empty</p>
            <Link to="/browse" onClick={onClose}>
              <Button variant="primary" size="sm">
                Browse Pets
              </Button>
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className="mb-2"
              style={{ border: "1px solid #f0f0f0" }}
            >
              <Card.Body className="p-2">
                <Row className="align-items-center">
                  <Col xs={3}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "50px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  </Col>
                  <Col xs={6}>
                    <h6 className="mb-1" style={{ fontSize: "0.9rem" }}>
                      {item.name}
                    </h6>
                    <small className="text-muted">{item.breed}</small>
                    <div className="fw-bold text-success">${item.price}</div>
                  </Col>
                  <Col xs={3} className="text-end">
                    <div className="d-flex align-items-center justify-content-end mb-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                      >
                        -
                      </Button>
                      <span className="mx-2" style={{ fontSize: "0.9rem" }}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        style={{ padding: "2px 6px", fontSize: "0.75rem" }}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0"
                      onClick={() => removeFromCart(item.id)}
                      style={{ fontSize: "0.75rem" }}
                    >
                      Remove
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid #eee",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Total: ${cartTotal.toFixed(2)}</strong>
          </div>
          <div className="d-grid gap-2">
            <Link to="/cart" onClick={onClose}>
              <Button variant="outline-primary" size="sm" className="w-100">
                View Cart
              </Button>
            </Link>
            <Link to="/checkout" onClick={onClose}>
              <Button variant="primary" size="sm" className="w-100">
                Checkout
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartDropdown;
