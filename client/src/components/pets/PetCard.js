// client/src/components/PetCard.js - Enhanced to use all Pet model features
import React, { useState, useEffect } from "react";
import { Card, Button, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import PetImage from "./PetImage";
import api from "../../services/api";
import "./PetCard.css";

const PetCard = ({
  pet,
  onVote,
  showAddToCart = true,
  size = "medium",
  onFavorite,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [voting, setVoting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [viewIncremented, setViewIncremented] = useState(false);

  // Increment views when card is rendered (only once)
  useEffect(() => {
    if (!viewIncremented && pet._id) {
      incrementViews();
      setViewIncremented(true);
    }
  }, [pet._id, viewIncremented]);

  const incrementViews = async () => {
    try {
      await api.post(`/pets/${pet._id}/view`);
    } catch (error) {
      // Silently fail - not critical, but log for debugging
      console.log(
        "Failed to increment views:",
        error.response?.status || "Network error"
      );
    }
  };

  const handleVote = async (voteType) => {
    if (!user || voting) return;

    setVoting(true);
    try {
      await api.post(`/pets/${pet._id}/vote`, { voteType });
      onVote?.(pet._id, voteType);
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoting(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return;

    try {
      if (isFavorited) {
        await api.delete(`/pets/${pet._id}/favorite`);
        setIsFavorited(false);
        onFavorite?.(pet._id, false);
      } else {
        await api.post(`/pets/${pet._id}/favorite`);
        setIsFavorited(true);
        onFavorite?.(pet._id, true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAddToCart = () => {
    if (isAdding) return;

    setIsAdding(true);
    addToCart({
      ...pet,
      type: "pet",
      cartType: "adoption",
    });
    setShowToast(true);

    setTimeout(() => {
      setIsAdding(false);
      setShowToast(false);
    }, 2000);
  };

  const handleImageLoad = () => {
    // This is now handled by PetImage component
  };

  const handleImageError = () => {
    // This is now handled by PetImage component
  };

  const formatPrice = (price) => {
    if (typeof price === "number") {
      return `$${price.toLocaleString()}`;
    }
    return price || "Contact for Price";
  };

  const getImageHeight = () => {
    switch (size) {
      case "small":
        return 120;
      case "large":
        return 280;
      case "square":
        return 200;
      default:
        return 200;
    }
  };

  const getAdoptionStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success";
      case "pending":
        return "warning";
      case "adopted":
        return "secondary";
      case "hold":
        return "info";
      default:
        return "secondary";
    }
  };

  const getAdoptionStatusText = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "pending":
        return "Adoption Pending";
      case "adopted":
        return "Adopted";
      case "hold":
        return "On Hold";
      default:
        return "Unknown";
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      dog: "fa-dog",
      cat: "fa-cat",
      fish: "fa-fish",
      bird: "fa-dove",
      "small-pet": "fa-rabbit",
      supply: "fa-box",
    };
    return icons[type] || "fa-paw";
  };

  return (
    <>
      <Card
        className={`h-100 shadow-sm pet-card ${pet.featured ? "featured" : ""}`}
        data-status={pet.adoptionStatus || "available"}
      >
        {/* Featured Badge */}
        {pet.featured && (
          <Badge
            bg="warning"
            className="position-absolute top-0 start-0 m-2"
            style={{ zIndex: 10 }}
          >
            <i className="fas fa-star me-1"></i>Featured
          </Badge>
        )}

        {/* Favorite Button */}
        {user && (
          <Button
            variant={isFavorited ? "danger" : "outline-danger"}
            size="sm"
            className="position-absolute top-0 end-0 m-2"
            style={{ zIndex: 10 }}
            onClick={handleFavorite}
          >
            <i
              className={`fas fa-heart ${isFavorited ? "" : "far fa-heart"}`}
            ></i>
          </Button>
        )}

        <div className="position-relative">
          {/* Enhanced Image Container using PetImage component */}
          <PetImage
            src={pet.image}
            alt={pet.name}
            className={size}
            fallbackText={`${pet.name} Photo`}
            width={300}
            height={getImageHeight()}
          />

          {/* Type Icon Overlay */}
          <i className={`fas ${getTypeIcon(pet.type)} type-icon`}></i>

          {/* Status Badge */}
          <Badge
            bg={getAdoptionStatusColor(pet.adoptionStatus || "available")}
            className="position-absolute bottom-0 end-0 m-2"
            style={{ zIndex: 10 }}
          >
            {getAdoptionStatusText(pet.adoptionStatus || "available")}
          </Badge>
        </div>

        <Card.Body className="d-flex flex-column">
          {/* Pet Name and Type */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Card.Title className="text-primary mb-0 h5">{pet.name}</Card.Title>
            <i className={`fas ${getTypeIcon(pet.type)} text-muted`}></i>
          </div>

          {/* Basic Info */}
          <div className="small text-muted flex-grow-1">
            <div>
              <strong>Breed:</strong> {pet.breed}
            </div>
            <div>
              <strong>Age:</strong> {pet.age}
            </div>
            {pet.size && (
              <div>
                <strong>Size:</strong> {pet.size}
              </div>
            )}
            {pet.gender && (
              <div>
                <strong>Gender:</strong> {pet.gender}
              </div>
            )}

            {/* Health Info Badges */}
            {pet.healthInfo && (
              <div className="mt-2 health-badges">
                {pet.healthInfo.vaccinated && (
                  <Badge
                    bg="success"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.7em" }}
                  >
                    <i className="fas fa-syringe me-1"></i>Vaccinated
                  </Badge>
                )}
                {pet.healthInfo.spayed && (
                  <Badge
                    bg="info"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.7em" }}
                  >
                    <i className="fas fa-check me-1"></i>Spayed/Neutered
                  </Badge>
                )}
                {pet.healthInfo.microchipped && (
                  <Badge
                    bg="warning"
                    className="me-1 mb-1"
                    style={{ fontSize: "0.7em" }}
                  >
                    <i className="fas fa-microchip me-1"></i>Microchipped
                  </Badge>
                )}
              </div>
            )}

            {/* Characteristics */}
            {pet.characteristics && pet.characteristics.length > 0 && (
              <div className="mt-2 characteristics">
                <small>
                  <strong>Traits:</strong>
                </small>
                <div>
                  {pet.characteristics.slice(0, 3).map((trait, index) => (
                    <Badge
                      key={index}
                      bg="light"
                      text="dark"
                      className="me-1 mb-1"
                      style={{ fontSize: "0.65em" }}
                    >
                      {trait}
                    </Badge>
                  ))}
                  {pet.characteristics.length > 3 && (
                    <Badge
                      bg="light"
                      text="dark"
                      style={{ fontSize: "0.65em" }}
                    >
                      +{pet.characteristics.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-2 text-dark">
              {pet.description && pet.description.length > 100
                ? `${pet.description.substring(0, 100)}...`
                : pet.description}
            </div>

            {/* Location */}
            {pet.location && (
              <div className="mt-2">
                <small className="text-muted">
                  <i className="fas fa-map-marker-alt me-1"></i>
                  {pet.location.city}, {pet.location.state}
                </small>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3">
            {/* Stats Row */}
            <div className="d-flex justify-content-between align-items-center mb-2 small text-muted stats-row">
              <div>
                <i className="fas fa-eye me-1"></i>
                {pet.views || 0} views
              </div>
              {pet.averageRating > 0 && (
                <div className="d-flex align-items-center">
                  <i className="fas fa-star text-warning me-1"></i>
                  <span>{pet.averageRating}</span>
                  <span className="ms-1">
                    ({pet.totalRatings || pet.ratings?.length || 0})
                  </span>
                </div>
              )}
              {pet.favoriteCount > 0 && (
                <div>
                  <i className="fas fa-heart text-danger me-1"></i>
                  {pet.favoriteCount}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="h5 text-success mb-0 price">
                  {formatPrice(pet.adoptionFee || pet.price)}
                </span>
                {pet.adoptionFee && pet.adoptionFee !== pet.price && (
                  <div>
                    <small className="text-muted">Adoption Fee</small>
                  </div>
                )}
              </div>
            </div>

            {/* Voting buttons */}
            {user && pet.adoptionStatus === "available" && (
              <div className="d-flex justify-content-center mb-2">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Like this pet</Tooltip>}
                >
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleVote("up")}
                    disabled={voting}
                  >
                    <i className="fas fa-thumbs-up me-1"></i>
                    {pet.votes?.up || 0}
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Not interested</Tooltip>}
                >
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleVote("down")}
                    disabled={voting}
                  >
                    <i className="fas fa-thumbs-down me-1"></i>
                    {pet.votes?.down || 0}
                  </Button>
                </OverlayTrigger>
              </div>
            )}

            <div className="d-grid gap-2">
              <Link to={`/pet/${pet._id}`} className="btn btn-primary btn-sm">
                <i className="fas fa-eye me-1"></i>
                View Details
              </Link>

              {showAddToCart && pet.adoptionStatus === "available" && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                >
                  <i className="fas fa-heart me-1"></i>
                  {isAdding ? "Adding..." : "Start Adoption"}
                </Button>
              )}

              {pet.adoptionStatus !== "available" && (
                <Button variant="secondary" size="sm" disabled>
                  <i className="fas fa-ban me-1"></i>
                  {getAdoptionStatusText(pet.adoptionStatus)}
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default PetCard;
