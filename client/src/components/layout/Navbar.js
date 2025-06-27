// client/src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import {
  Navbar as BootstrapNavbar,
  Nav,
  Container,
  NavDropdown,
  Badge,
  Button,
} from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import CartIcon from "../Cart/CartIcon";
import CartDropdown from "../Cart/CartDropdown";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cart dropdown state
  const [showCart, setShowCart] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartRef = useRef(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
    setShowCart(false);
  };

  // Close cart dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCart(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close cart dropdown on route change
  useEffect(() => {
    setShowCart(false);
  }, [location.pathname]);

  // Check if user is admin
  const isAdmin = user && user.role === "admin";

  // Handle cart toggle
  const handleCartToggle = () => {
    setShowCart(!showCart);
  };

  // Navigation items for better organization
  const mainNavItems = [
    { path: "/", label: "Home", icon: "fas fa-home" },
    { path: "/browse", label: "Browse Pets", icon: "fas fa-search" },
    { path: "/dogs", label: "Dogs", icon: "fas fa-dog" },
    { path: "/cats", label: "Cats", icon: "fas fa-cat" },
    { path: "/aquatics", label: "Aquatics", icon: "fas fa-fish" },
    { path: "/about", label: "About", icon: "fas fa-info-circle" },
    { path: "/contact", label: "Contact", icon: "fas fa-envelope" },
  ];

  return (
    <BootstrapNavbar 
      expand="lg" 
      className={`custom-navbar ${scrolled ? 'navbar-scrolled' : ''}`} 
      fixed="top"
      variant="dark"
    >
      <Container fluid className="px-3 px-lg-4">
        {/* Enhanced Brand/Logo */}
        <BootstrapNavbar.Brand 
          as={Link} 
          to="/" 
          className="brand-logo d-flex align-items-center"
        >
          <div className="logo-icon-wrapper me-2">
            <i className="fas fa-paw logo-icon"></i>
          </div>
          <span className="brand-text">
            <span className="brand-fur">Fur</span>
            <span className="brand-babies">Babies</span>
          </span>
        </BootstrapNavbar.Brand>

        {/* Mobile toggle button - Enhanced */}
        <div className="d-flex align-items-center d-lg-none">
          {/* Mobile cart icon */}
          <div className="position-relative me-2" ref={cartRef}>
            <CartIcon onClick={handleCartToggle} />
            <CartDropdown
              isOpen={showCart}
              onClose={() => setShowCart(false)}
            />
          </div>
          
          <BootstrapNavbar.Toggle 
            aria-controls="navbar-nav"
            className="custom-toggler"
          >
            <span className="navbar-toggler-icon-custom">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </BootstrapNavbar.Toggle>
        </div>

        <BootstrapNavbar.Collapse id="navbar-nav">
          {/* Main Navigation Links - Enhanced */}
          <Nav className="me-auto main-nav">
            {mainNavItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={`nav-item-custom ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <i className={`${item.icon} nav-icon me-1`}></i>
                <span className="nav-text">{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>

          {/* Right side navigation - Enhanced */}
          <Nav className="ms-auto align-items-center right-nav">
            {/* Shopping Cart - Desktop only (mobile shown above) */}
            <div className="position-relative me-3 d-none d-lg-block" ref={cartRef}>
              <CartIcon onClick={handleCartToggle} />
              <CartDropdown
                isOpen={showCart}
                onClose={() => setShowCart(false)}
              />
            </div>

            {/* User Authentication Section - Enhanced */}
            {user ? (
              <>
                {/* Admin Dashboard Link - Enhanced */}
                {isAdmin && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    className={`admin-link me-3 ${
                      location.pathname === "/admin" ? "active" : ""
                    }`}
                    title="Admin Dashboard"
                  >
                    <i className="fas fa-cog me-1"></i>
                    <span className="d-none d-xl-inline">Admin</span>
                  </Nav.Link>
                )}

                {/* Enhanced User Dropdown */}
                <NavDropdown
                  title={
                    <div className="user-dropdown-toggle d-flex align-items-center">
                      <div className="user-avatar me-2">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="user-info d-none d-md-block">
                        <span className="user-name">{user.username}</span>
                        {isAdmin && (
                          <Badge
                            bg="warning"
                            text="dark"
                            className="admin-badge ms-2"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                      <i className="fas fa-chevron-down ms-2 dropdown-arrow"></i>
                    </div>
                  }
                  id="user-dropdown"
                  align="end"
                  className="user-dropdown-menu"
                >
                  <div className="dropdown-header">
                    <div className="user-info-header">
                      <i className="fas fa-user-circle fa-2x text-primary mb-2"></i>
                      <h6 className="mb-0">{user.username}</h6>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </div>
                  
                  <NavDropdown.Divider />

                  <NavDropdown.Item as={Link} to="/profile" className="dropdown-item-custom">
                    <i className="fas fa-user me-2 text-primary"></i>My Profile
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/orders" className="dropdown-item-custom">
                    <i className="fas fa-shopping-bag me-2 text-success"></i>My Orders
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/favorites" className="dropdown-item-custom">
                    <i className="fas fa-heart me-2 text-danger"></i>Favorites
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  {isAdmin && (
                    <>
                      <div className="dropdown-section-title">
                        <small className="text-muted px-3">Admin Panel</small>
                      </div>
                      <NavDropdown.Item as={Link} to="/admin" className="dropdown-item-custom">
                        <i className="fas fa-tachometer-alt me-2 text-warning"></i>Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/orders" className="dropdown-item-custom">
                        <i className="fas fa-list me-2 text-info"></i>Manage Orders
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                    </>
                  )}

                  <NavDropdown.Item as={Link} to="/settings" className="dropdown-item-custom">
                    <i className="fas fa-cog me-2 text-secondary"></i>Settings
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  <NavDropdown.Item
                    onClick={handleLogout}
                    className="dropdown-item-custom logout-item"
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="auth-buttons d-flex align-items-center">
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-light"
                  className={`login-btn me-2 ${
                    location.pathname === "/login" ? "active" : ""
                  }`}
                >
                  <i className="fas fa-sign-in-alt me-1"></i>
                  <span className="d-none d-sm-inline">Login</span>
                </Button>

                <Button
                  as={Link}
                  to="/register"
                  variant="light"
                  className={`signup-btn ${
                    location.pathname === "/register" ? "active" : ""
                  }`}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  <span className="d-none d-sm-inline">Sign Up</span>
                </Button>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
