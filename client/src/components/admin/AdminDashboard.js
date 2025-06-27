// client/src/components/AdminDashboard.js (SAFE VERSION - Debug React Errors)
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePets } from "../../hooks/usePets";
import EnhancedAddPetForm from "../pets/EnhancedAddPetForm";
import EditPetForm from "../pets/EditPetForm";
import ErrorBoundary from "../common/ErrorBoundary";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { pets, loading, error, deletePet, addPet, updatePet } = usePets();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowAddForm(false);
        setEditingPet(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleDeletePet = async (id, petName) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${petName}? This action cannot be undone.`,
      )
    ) {
      try {
        await deletePet(id);
        alert(`${petName} has been deleted successfully.`);
      } catch (error) {
        alert("Error deleting pet: " + error.message);
      }
    }
  };

  const handleAddPet = async (petData) => {
    try {
      console.log("📝 AdminDashboard: Adding pet:", petData);
      await addPet(petData);
      setShowAddForm(false);
      alert("Pet added successfully!");
    } catch (error) {
      console.error("❌ AdminDashboard: Error adding pet:", error);
      alert("Error adding pet: " + error.message);
    }
  };

  const handleUpdatePet = async (id, petData) => {
    try {
      await updatePet(id, petData);
      setEditingPet(null);
      alert("Pet updated successfully!");
    } catch (error) {
      alert("Error updating pet: " + error.message);
    }
  };

  // Debug logging
  console.log("🎛️ AdminDashboard render:", {
    user: user?.email,
    petsCount: pets?.length,
    showAddForm,
    editingPet: !!editingPet,
    loading,
    error,
  });

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  // Safely get stats to avoid React object rendering errors
  const safeStats = {
    total: Array.isArray(pets) ? pets.length : 0,
    available: Array.isArray(pets)
      ? pets.filter((pet) => !pet.adopted).length
      : 0,
    adopted: Array.isArray(pets) ? pets.filter((pet) => pet.adopted).length : 0,
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>🐾 Furbabies Admin Dashboard</h1>
          <div className="admin-user-info">
            <span>
              Welcome, {user?.name || user?.username || user?.email || "Admin"}!
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Pets</h3>
            <span className="stat-number">{safeStats.total}</span>
          </div>
          <div className="stat-card">
            <h3>Available</h3>
            <span className="stat-number">{safeStats.available}</span>
          </div>
          <div className="stat-card">
            <h3>Adopted</h3>
            <span className="stat-number">{safeStats.adopted}</span>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <p>Error: {String(error)}</p>
          </div>
        )}

        <div className="admin-actions">
          <button
            onClick={() => {
              console.log("🖱️ Add Pet button clicked");
              setShowAddForm(true);
            }}
            className="btn btn-primary add-pet-btn"
          >
            + Add New Pet
          </button>
        </div>

        {/* Add Pet Modal */}
        {showAddForm && (
          <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <ErrorBoundary>
                <EnhancedAddPetForm
                  onSubmit={handleAddPet}
                  onCancel={() => setShowAddForm(false)}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Edit Pet Modal */}
        {editingPet && (
          <div className="modal-overlay" onClick={() => setEditingPet(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <ErrorBoundary>
                <EditPetForm
                  pet={editingPet}
                  onSubmit={(petData) =>
                    handleUpdatePet(editingPet._id, petData)
                  }
                  onCancel={() => setEditingPet(null)}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        <div className="pets-management">
          <h2>Manage Pets</h2>

          {Array.isArray(pets) && pets.length > 0 ? (
            <div className="admin-pets-grid">
              {pets.map((pet) => {
                // Safely render each pet to avoid object rendering errors
                if (!pet || typeof pet !== "object" || !pet._id) {
                  console.warn("Invalid pet object:", pet);
                  return null;
                }

                return (
                  <div key={pet._id} className="admin-pet-card">
                    <div className="pet-image">
                      {pet.image ? (
                        <img src={String(pet.image)} alt={String(pet.name)} />
                      ) : (
                        <div className="placeholder-image">📸</div>
                      )}
                    </div>

                    <div className="pet-details">
                      <h3>{String(pet.name || "Unnamed Pet")}</h3>
                      <p>
                        <strong>Type:</strong> {String(pet.type || "Unknown")}
                      </p>
                      <p>
                        <strong>Breed:</strong> {String(pet.breed || "Mixed")}
                      </p>
                      <p>
                        <strong>Age:</strong> {String(pet.age || "Unknown")}{" "}
                        years
                      </p>
                      <p>
                        <strong>Votes:</strong> {Number(pet.votes) || 0}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <span
                          className={`status ${pet.adopted ? "adopted" : "available"}`}
                        >
                          {pet.adopted ? "Adopted" : "Available"}
                        </span>
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {String(pet.description || "No description")}
                      </p>
                    </div>

                    <div className="admin-pet-actions">
                      <button
                        onClick={() => setEditingPet(pet)}
                        className="btn btn-secondary"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet._id, pet.name)}
                        className="btn btn-danger"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-pets">
              <p>No pets in the database yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
              >
                Add Your First Pet
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
