import React from "react";
import { Container, Row, Col, Card, Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

const Cart = () => {
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
  } = useCart();

  // Fix: Add safety check for cartItems being undefined
  const safeCartItems = cartItems || [];

  if (safeCartItems.length === 0) {
    return (
      <Container className="py-5" style={{ marginTop: "80px" }}>
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <i className="fas fa-shopping-cart fa-4x text-muted mb-4"></i>
            <h2>Your Cart is Empty</h2>
            <p className="text-muted mb-4">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link to="/browse">
              <Button variant="primary" size="lg">
                <i className="fas fa-search me-2"></i>Browse Products
              </Button>
            </Link>
          </Col>
        </Row>
      </Container>
    );
  }

  const shipping = 0;
  const tax = (cartTotal || 0) * 0.08; // Add safety check for cartTotal
  const finalTotal = (cartTotal || 0) + shipping + tax;

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                Shopping Cart ({safeCartItems.length} items)
              </h4>
              <Button variant="outline-danger" size="sm" onClick={clearCart}>
                Clear Cart
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {safeCartItems.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "80px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              marginRight: "1rem",
                            }}
                          />
                          <div>
                            <h6 className="mb-1">{item.name}</h6>
                            <small className="text-muted">
                              {item.type === "supply"
                                ? "Product"
                                : `${item.breed || "Unknown"} • ${item.type || "Pet"}`}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">
                        <strong>${(item.price || 0).toFixed(2)}</strong>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                Math.max(1, (item.quantity || 1) - 1)
                              )
                            }
                            disabled={(item.quantity || 1) <= 1}
                          >
                            -
                          </Button>
                          <span className="mx-3">{item.quantity || 1}</span>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() =>
                              updateQuantity(item._id, (item.quantity || 1) + 1)
                            }
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="align-middle">
                        <strong>
                          $
                          {((item.price || 0) * (item.quantity || 1)).toFixed(
                            2
                          )}
                        </strong>
                      </td>
                      <td className="align-middle">
                        <Button
                          variant="link"
                          className="text-danger"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${(cartTotal || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping:</span>
                <span className="text-success">Free</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>${finalTotal.toFixed(2)}</strong>
              </div>

              <div className="d-grid gap-2">
                <Link to="/checkout">
                  <Button variant="primary" size="lg" className="w-100">
                    <i className="fas fa-credit-card me-2"></i>
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button variant="outline-secondary" className="w-100">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
