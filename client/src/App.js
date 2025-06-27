// client/src/App.js - Fixed Version
import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Import CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
// comment
// Import critical pages directly (above the fold content)
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// Enhanced lazy loading with preloading hints
const createLazyComponent = (importFunc, fallbackComponent) => {
  return lazy(() =>
    importFunc().catch((error) => {
      console.warn(`Failed to load component, using fallback:`, error);
      return { default: fallbackComponent };
    }),
  );
};

// Fallback components for better UX
const createFallbackPage = (
  icon,
  title,
  description,
  linkText = "Browse All Pets",
  linkHref = "/browse",
) => {
  return () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="text-center">
        <i className={`fas ${icon} fa-4x text-primary mb-3`}></i>
        <h2>{title}</h2>
        <p className="text-muted mb-4">{description}</p>
        <a href={linkHref} className="btn btn-primary">
          <i className="fas fa-search me-2"></i>
          {linkText}
        </a>
      </div>
    </div>
  );
};

// Lazy loaded components with intelligent fallbacks
const Dogs = createLazyComponent(
  () => import("./pages/pet/Dogs"),
  createFallbackPage("fa-dog", "Dogs Page", "Our dogs page is coming soon!"),
);

const Cats = createLazyComponent(
  () => import("./pages/pet/Cats"),
  createFallbackPage("fa-cat", "Cats Page", "Our cats page is coming soon!"),
);

const Aquatics = createLazyComponent(
  () => import("./pages/pet/Aquatics"),
  createFallbackPage(
    "fa-fish",
    "Aquatics Page",
    "Our aquatics page is coming soon!",
  ),
);

const Browse = createLazyComponent(
  () => import("./pages/pet/Browse"),
  createFallbackPage(
    "fa-search",
    "Browse Pets",
    "Browse all our available pets for adoption.",
  ),
);

const PetDetail = createLazyComponent(
  () => import("./pages/pet/PetDetail"),
  createFallbackPage(
    "fa-heart",
    "Pet Details",
    "Detailed information about this pet.",
    "Back to Browse",
  ),
);

const Login = createLazyComponent(
  () => import("./pages/auth/Login"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">
              <h3>
                <i className="fas fa-sign-in-alt me-2"></i>Login
              </h3>
            </div>
            <div className="card-body">
              <p className="text-center text-muted">
                Login functionality will be implemented here.
              </p>
              <div className="alert alert-info">
                <strong>Demo Credentials:</strong>
                <br />
                Admin: admin@furbabies.com / admin123
                <br />
                User: test@example.com / password123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

const Register = createLazyComponent(
  () => import("./pages/auth/Register"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header text-center">
              <h3>
                <i className="fas fa-user-plus me-2"></i>Register
              </h3>
            </div>
            <div className="card-body">
              <p className="text-center text-muted">
                Registration functionality will be implemented here.
              </p>
              <a href="/login" className="btn btn-primary w-100">
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

const Profile = createLazyComponent(
  () => import("./pages/user/Profile"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-user me-2"></i>User Profile
              </h3>
            </div>
            <div className="card-body">
              <p>Profile management will be implemented here.</p>
              <div className="row">
                <div className="col-md-6">
                  <h5>Personal Information</h5>
                  <ul>
                    <li>Edit personal details</li>
                    <li>Update contact information</li>
                    <li>Change password</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Pet Activities</h5>
                  <ul>
                    <li>View adoption history</li>
                    <li>Manage favorite pets</li>
                    <li>Track applications</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

const Cart = createLazyComponent(
  () => import("./pages/commerce/Cart"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-shopping-cart me-2"></i>Shopping Cart
              </h3>
            </div>
            <div className="card-body text-center">
              <i className="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
              <h4>Your cart is empty</h4>
              <p className="text-muted">
                Add some pets or supplies to get started!
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <a href="/browse" className="btn btn-primary">
                  <i className="fas fa-paw me-2"></i>Browse Pets
                </a>
                <a href="/products" className="btn btn-outline-primary">
                  <i className="fas fa-shopping-bag me-2"></i>Shop Supplies
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

const Checkout = createLazyComponent(
  () => import("./pages/commerce/Checkout"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-credit-card me-2"></i>Secure Checkout
              </h3>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>Order Process</h5>
                  <ul>
                    <li>Review your order</li>
                    <li>Enter shipping information</li>
                    <li>Select payment method</li>
                    <li>Confirm adoption details</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Secure Payment</h5>
                  <ul>
                    <li>SSL encrypted processing</li>
                    <li>Multiple payment options</li>
                    <li>Instant confirmation</li>
                    <li>Email receipt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

const AdminDashboard = createLazyComponent(
  () => import("./components/admin/AdminDashboard.js"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3>
            <i className="fas fa-tachometer-alt me-2"></i>Admin Dashboard
          </h3>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <i className="fas fa-paw fa-2x text-primary mb-2"></i>
                  <h5>Manage Pets</h5>
                  <p className="text-muted small">Add, edit, remove pets</p>
                  <button className="btn btn-outline-primary btn-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <i className="fas fa-users fa-2x text-primary mb-2"></i>
                  <h5>Manage Users</h5>
                  <p className="text-muted small">User administration</p>
                  <button className="btn btn-outline-primary btn-sm">
                    Manage
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <i className="fas fa-chart-bar fa-2x text-primary mb-2"></i>
                  <h5>Analytics</h5>
                  <p className="text-muted small">Reports and statistics</p>
                  <button className="btn btn-outline-primary btn-sm">
                    View
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <i className="fas fa-cog fa-2x text-primary mb-2"></i>
                  <h5>Settings</h5>
                  <p className="text-muted small">System configuration</p>
                  <button className="btn btn-outline-primary btn-sm">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Administrative functions will be fully implemented in the next
            phase.
          </div>
        </div>
      </div>
    </div>
  ),
);

// FIXED: Products component with proper fallback (no server imports)
const Products = createLazyComponent(
  () => import("./pages/commerce/Products"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="text-center">
        <i className="fas fa-box fa-4x text-primary mb-3"></i>
        <h2>Pet Products & Supplies</h2>
        <p className="text-muted mb-4">
          Browse our selection of pet supplies and accessories.
        </p>

        {/* Sample products display */}
        <div className="row mt-4">
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-bone fa-3x text-primary mb-2"></i>
                <h5>Premium Dog Food</h5>
                <p className="text-muted">$29.99</p>
                <button className="btn btn-primary btn-sm">Add to Cart</button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-mouse fa-3x text-primary mb-2"></i>
                <h5>Interactive Cat Toy</h5>
                <p className="text-muted">$14.99</p>
                <button className="btn btn-primary btn-sm">Add to Cart</button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body text-center">
                <i className="fas fa-bed fa-3x text-primary mb-2"></i>
                <h5>Comfortable Pet Bed</h5>
                <p className="text-muted">$45.99</p>
                <button className="btn btn-primary btn-sm">Add to Cart</button>
              </div>
            </div>
          </div>
        </div>

        <div className="alert alert-info mt-4">
          <i className="fas fa-info-circle me-2"></i>
          Products catalog will be fully implemented in the next phase.
        </div>
      </div>
    </div>
  ),
);

// FIXED: AddPet component with proper fallback
const AddPet = createLazyComponent(
  () => import("./pages/user/AddPet"),
  () => (
    <div className="container py-5" style={{ marginTop: "80px" }}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>
                <i className="fas fa-plus me-2"></i>Add New Pet for Adoption
              </h3>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Requirements:</strong> Only authenticated users can add
                pets for adoption.
              </div>

              <p>
                Pet addition form will be implemented here with the following
                features:
              </p>
              <ul>
                <li>Pet information (name, breed, age, size)</li>
                <li>Upload pet photos</li>
                <li>Description and personality traits</li>
                <li>Medical history and vaccination status</li>
                <li>Adoption fee and requirements</li>
              </ul>

              <div className="d-flex gap-2 mt-4">
                <a href="/browse" className="btn btn-primary">
                  <i className="fas fa-search me-2"></i>Browse Current Pets
                </a>
                <a href="/profile" className="btn btn-outline-primary">
                  <i className="fas fa-user me-2"></i>My Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
);

// Component to handle route-based preloading
const RoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    // Preload likely next pages based on current route
    const preloadMap = {
      "/": [Browse, Login], // From home, users likely go to browse or login
      "/browse": [PetDetail, Cart], // From browse, users view details or add to cart
      "/login": [Register, Profile], // From login, users might register or go to profile
      "/register": [Login, Profile], // Similar logic
      "/cart": [Checkout], // From cart, users go to checkout
    };

    const routesToPreload = preloadMap[location.pathname];
    if (routesToPreload) {
      // Preload components after a small delay to not block current page
      setTimeout(() => {
        routesToPreload.forEach((component) => {
          // This triggers the lazy loading without rendering
          if (component.preload) {
            component.preload();
          }
        });
      }, 1000);
    }
  }, [location.pathname]);

  return null;
};

// Enhanced 404 component
const NotFound = () => (
  <div className="container text-center py-5" style={{ marginTop: "80px" }}>
    <div className="row justify-content-center">
      <div className="col-md-6">
        <i className="fas fa-exclamation-triangle fa-4x text-warning mb-4"></i>
        <h2>404 - Page Not Found</h2>
        <p className="text-muted mb-4">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <a href="/" className="btn btn-primary">
            <i className="fas fa-home me-2"></i>Go Home
          </a>
          <a href="/browse" className="btn btn-outline-primary">
            <i className="fas fa-search me-2"></i>Browse Pets
          </a>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="App">
              <Navbar />
              <RoutePreloader />

              <main style={{ minHeight: "calc(100vh - 140px)" }}>
                <Suspense
                  fallback={
                    <div style={{ marginTop: "80px" }}>
                      <LoadingSpinner
                        text="Loading page..."
                        centered={true}
                        className="py-5"
                      />
                    </div>
                  }
                >
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/dogs" element={<Dogs />} />
                    <Route path="/cats" element={<Cats />} />
                    <Route path="/aquatics" element={<Aquatics />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/pet/:id" element={<PetDetail />} />
                    <Route path="/product/:id" element={<PetDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Shopping Cart Routes */}
                    <Route path="/cart" element={<Cart />} />

                    {/* Protected Routes */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/add-pet"
                      element={
                        <ProtectedRoute>
                          <AddPet />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute adminOnly={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>

              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
