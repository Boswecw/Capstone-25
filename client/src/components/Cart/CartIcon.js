// client/src/components/Cart/CartIcon.js
import React from "react";
import { Badge } from "react-bootstrap";
import { useCart } from "../../contexts/CartContext";

const CartIcon = ({ onClick }) => {
  const { cartCount } = useCart(); // cartCount is used HERE

  return (
    <div
      className="cart-icon-wrapper d-flex align-items-center"
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "8px 12px",
        borderRadius: "6px",
        transition: "background-color 0.3s ease",
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <i
        className="fas fa-shopping-cart me-1"
        style={{ fontSize: "1.1rem" }}
      ></i>
      <span className="d-none d-md-inline me-1">Cart</span>
      {cartCount > 0 && (
        <Badge
          bg="danger"
          pill
          style={{
            fontSize: "0.7rem",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cartCount > 99 ? "99+" : cartCount}
        </Badge>
      )}
    </div>
  );
};

export default CartIcon;
