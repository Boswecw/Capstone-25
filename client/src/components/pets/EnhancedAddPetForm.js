// client/src/components/EnhancedAddPetForm.js
import React, { useState } from "react";
import { getImagePath, validateImageUrl } from "../../utils/imageHelper";
import "./EnhancedPetForm.css";

console.log("✅ EnhancedAddPetForm is rendering");

const EnhancedAddPetForm = ({ onSubmit, onCancel }) => {
  console.log("Rendering EnhancedAddPetForm"); // <- this must show in console
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    breed: "",
    age: "",
    description: "",
    image: "",
    adopted: false,
  });

  console.log("Rendering EnhancedAddPetForm");

  const [imageOption, setImageOption] = useState("url"); // 'url' or 'local'
  const [imagePreview, setImagePreview] = useState("");
  const [imageValid, setImageValid] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sample local images that should be in public/images/pets/
  const sampleImages = [
    "beagle.jpg",
    "ragdoll.jpg",
    "aussie.jpg",
    "russian-blue.jpg",
    "poodle-mix.jpg",
    "black-cat.jpg",
    "mini-rex.jpg",
    "cockatiel.jpg",
    "tuxedo-cat.jpg",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Handle image changes
    if (name === "image") {
      handleImageChange(value);
    }
  };

  const handleImageChange = async (imagePath) => {
    try {
      if (!imagePath) {
        setImagePreview("");
        setImageValid(true);
        return;
      }

      const fullPath = getImagePath(imagePath);
      setImagePreview(fullPath);

      const isValid = await validateImageUrl(fullPath);
      setImageValid(isValid);
    } catch (err) {
      console.error("handleImageChange crashed:", err);
      setImageValid(false);
    }
  };

  const handleImageOptionChange = (option) => {
    setImageOption(option);
    setFormData((prev) => ({ ...prev, image: "" }));
    setImagePreview("");
    setImageValid(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.image && !imageValid) {
      alert("Please fix the image issue before submitting.");
      return;
    }

    setLoading(true);

    try {
      const petData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        image: formData.image || "",
      };

      await onSubmit(petData);
    } catch (error) {
      console.error("Error adding pet:", error);
      alert("Error adding pet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enhanced-pet-form">
      <div className="form-header">
        <h2>🐾 Add New Pet</h2>
        <button onClick={onCancel} className="close-btn" type="button">
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic pet info */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Pet Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter pet's name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Hamster">Hamster</option>
              <option value="Gerbil">Gerbil</option>
              <option value="Chinchilla">Chinchilla</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="breed">Breed</label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="Enter breed (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age (years)</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter age"
              min="0"
              max="30"
            />
          </div>
        </div>

        {/* Enhanced Image Section */}
        <div className="form-group image-section">
          <label>Pet Image</label>

          {/* Image option selector */}
          <div className="image-options">
            <label className="radio-option">
              <input
                type="radio"
                name="imageOption"
                value="url"
                checked={imageOption === "url"}
                onChange={() => handleImageOptionChange("url")}
              />
              <span>Image URL</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="imageOption"
                value="local"
                checked={imageOption === "local"}
                onChange={() => handleImageOptionChange("local")}
              />
              <span>Local Image</span>
            </label>
          </div>

          {/* URL Input */}
          {imageOption === "url" && (
            <div className="image-input">
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/pet-image.jpg"
                className={!imageValid ? "error" : ""}
              />
              {!imageValid && (
                <span className="error-text">❌ Invalid image URL</span>
              )}
              <small className="help-text">
                💡 Try Unsplash: https://unsplash.com/s/photos/pets
              </small>
            </div>
          )}

          {/* Local Image Selector */}
          {imageOption === "local" && (
            <div className="local-images">
              <select
                name="image"
                value={formData.image}
                onChange={handleChange}
              >
                <option value="">Select a local image</option>
                {sampleImages.map((img) => (
                  <option key={img} value={img}>
                    {img}
                  </option>
                ))}
              </select>

              <div className="path-info">
                <small>
                  💡 Place images in: <code>public/images/pets/</code>
                </small>
              </div>

              <details className="path-help">
                <summary>📁 How to add your own images</summary>
                <div className="help-content">
                  <ol>
                    <li>
                      Create folder: <code>public/images/pets/</code>
                    </li>
                    <li>Copy your image files there</li>
                    <li>Use filename only (e.g., "mydog.jpg")</li>
                    <li>
                      Refresh this page and the file will appear in the dropdown
                    </li>
                  </ol>
                  <p>
                    <strong>Supported formats:</strong> .jpg, .jpeg, .png, .gif,
                    .webp
                  </p>
                </div>
              </details>
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview">
              <h4>Preview:</h4>
              <div className="preview-container">
                <img
                  src={imagePreview}
                  alt="Preview"
                  onError={() => setImageValid(false)}
                  onLoad={() => setImageValid(true)}
                />
                {!imageValid && (
                  <div className="preview-error">
                    <span>❌ Image failed to load</span>
                  </div>
                )}
              </div>
              <div className="preview-path">
                <small>
                  Path: <code>{imagePreview}</code>
                </small>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell us about this pet's personality, needs, etc."
            rows="4"
          />
        </div>

        {/* Adoption status */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="adopted"
              checked={formData.adopted}
              onChange={handleChange}
            />
            <span className="checkmark"></span>
            Mark as adopted
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || (formData.image && !imageValid)}
          >
            {loading ? "Adding Pet..." : "Add Pet"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedAddPetForm;
