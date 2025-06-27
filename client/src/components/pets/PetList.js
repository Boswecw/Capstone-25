// client/src/components/PetList.js
import React from "react";
import { Link } from "react-router-dom";
import PetImage from "./PetImage";
import "./PetList.css";

const PetList = ({ pets, loading, onDeletePet, onVotePet }) => {
  const handleDelete = async (id, petName) => {
    if (window.confirm(`Are you sure you want to delete ${petName}?`)) {
      try {
        await onDeletePet(id);
        alert(`${petName} has been removed from the list.`);
      } catch (error) {
        alert("Error deleting pet. Please try again.");
      }
    }
  };

  const handleVote = async (id, petName) => {
    try {
      await onVotePet(id);
      // Optional: Show success message
    } catch (error) {
      alert("Error voting for pet. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading our furry friends...</p>
      </div>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <div className="no-pets">
        <h3>No pets available for adoption right now</h3>
        <p>Check back soon for new furry friends!</p>
      </div>
    );
  }

  return (
    <div className="pet-list">
      <div className="pets-grid">
        {pets.map((pet) => (
          <div key={pet._id} className="pet-card">
            <PetImage
              src={pet.image}
              alt={pet.name}
              fallbackText={`${pet.type} Photo`}
              className="pet-card-image"
            />

            <div className="pet-info">
              <h3>{pet.name}</h3>
              <p className="pet-type">
                {pet.type} • {pet.breed}
              </p>
              {pet.age && <p className="pet-age">Age: {pet.age} years</p>}
              <p className="pet-description">{pet.description}</p>

              <div className="pet-stats">
                <span className="votes">❤️ {pet.votes || 0} votes</span>
                {pet.adopted && <span className="adopted">✅ Adopted</span>}
              </div>
            </div>

            <div className="pet-actions">
              <Link to={`/pet/${pet._id}`} className="btn btn-primary">
                View Details
              </Link>

              <button
                onClick={() => handleVote(pet._id, pet.name)}
                className="btn btn-secondary vote-btn"
                disabled={pet.adopted}
              >
                👍 Vote
              </button>

              <button
                onClick={() => handleDelete(pet._id, pet.name)}
                className="btn btn-danger delete-btn"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetList;
