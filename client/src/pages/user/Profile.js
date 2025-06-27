import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Profile = () => {
  const { user, loading: authLoading } = useAuth(); // Use the user from AuthContext
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false); // Separate loading for profile updates
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/favorites");
      setFavorites(response.data.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      setError("Error loading favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData(e.target);
      const updates = {
        profile: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          address: {
            street: formData.get("street"),
            city: formData.get("city"),
            state: formData.get("state"),
            zipCode: formData.get("zipCode"),
          },
        },
      };

      await api.put("/users/profile", updates);
      setMessage("Profile updated successfully!");
      
      // Optional: Refresh the AuthContext user data
      // You might want to add a refreshUser function to AuthContext
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      setError("Error updating profile");
      console.error("Error updating profile:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: "80px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading profile...</p>
      </Container>
    );
  }

  // This shouldn't happen if ProtectedRoute is working, but just in case
  if (!user) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: "80px" }}>
        <Alert variant="danger">
          You must be logged in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ marginTop: "80px" }}>
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h3>
                <i className="fas fa-user me-2"></i>My Profile
              </h3>
              <small className="text-muted">Welcome back, {user.username}!</small>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={user.username || ""}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Username cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={user.email || ""}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        defaultValue={user.profile?.firstName || ""}
                        placeholder="First Name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        defaultValue={user.profile?.lastName || ""}
                        placeholder="Last Name"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    defaultValue={user.profile?.phone || ""}
                    placeholder="Phone Number"
                  />
                </Form.Group>

                <h5 className="mt-4 mb-3">Address</h5>
                <Form.Group className="mb-3">
                  <Form.Label>Street Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="street"
                    defaultValue={user.profile?.address?.street || ""}
                    placeholder="Street Address"
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        defaultValue={user.profile?.address?.city || ""}
                        placeholder="City"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        defaultValue={user.profile?.address?.state || ""}
                        placeholder="State"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        defaultValue={user.profile?.address?.zipCode || ""}
                        placeholder="ZIP Code"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="primary" disabled={updating}>
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Favorites Section */}
          <Card className="mt-4">
            <Card.Header>
              <h4>
                <i className="fas fa-heart me-2"></i>Favorite Pets (
                {favorites.length})
              </h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2">Loading favorites...</span>
                </div>
              ) : favorites.length === 0 ? (
                <p className="text-muted">
                  You haven't added any pets to your favorites yet.
                </p>
              ) : (
                <Row className="g-3">
                  {favorites.map((pet) => (
                    <Col key={pet._id} md={6} lg={4}>
                      <Card className="h-100">
                        <Card.Img
                          variant="top"
                          src={pet.image}
                          alt={pet.name}
                          style={{ height: "150px", objectFit: "contain" }}
                        />
                        <Card.Body>
                          <Card.Title className="h6">{pet.name}</Card.Title>
                          <Card.Text className="small">{pet.breed}</Card.Text>
                          <div className="price">${pet.price}</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
