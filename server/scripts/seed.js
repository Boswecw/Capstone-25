// server/scripts/seed.js - Safe version with error handling
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Import models
const Pet = require("../models/Pet");
const User = require("../models/User");
const Contact = require("../models/Contact");

// Try to import Product model, but handle if it doesn't exist
let Product;
try {
  Product = require("../models/Product");
  console.log("✅ Product model loaded successfully");
} catch (error) {
  console.log("⚠️  Product model not found - will skip product seeding");
  console.log("   Create server/models/Product.js to enable product seeding");
  Product = null;
}

// Sample pet data (keeping your existing pets)
const pets = [
  {
    name: "Golden Retriever",
    type: "dog",
    breed: "Golden Retriever",
    age: "2 years",
    price: 800,
    description:
      "Friendly, loyal companion perfect for families. This beautiful Golden Retriever loves playing fetch and is great with children.",
    image: "/images/GoldenRetriever.png",
    size: "large",
    gender: "male",
    available: true,
    votes: { up: 15, down: 2 },
  },
  {
    name: "British Short-Hair",
    type: "cat",
    breed: "British Shorthair",
    age: "1 year",
    price: 500,
    description:
      "Gentle and loveable companion. This cat is perfect for apartment living and has a calm temperament.",
    image: "/images/CatA.png",
    size: "medium",
    gender: "female",
    available: true,
    votes: { up: 12, down: 1 },
  },
  {
    name: "Betta Fish",
    type: "fish",
    breed: "Betta",
    age: "6 months",
    price: 25,
    description:
      "Colorfully delightful aquatic companion. Easy to care for and makes a great first pet.",
    image: "/images/Betafish.jpg",
    size: "small",
    available: true,
    votes: { up: 8, down: 0 },
  },
  {
    name: "Colorful Parrot",
    type: "bird",
    breed: "Macaw",
    age: "1 year",
    price: 1200,
    description:
      "Colorful and talkative, needs lots of love and attention. This intelligent bird can learn many words.",
    image: "/images/Parrot.png",
    size: "large",
    gender: "male",
    available: true,
    votes: { up: 18, down: 3 },
  },
  {
    name: "Holland Lop Rabbit",
    type: "small-pet",
    breed: "Holland Lop",
    age: "4 months",
    price: 150,
    description:
      "Fluffy and fun, perfect for kids. This rabbit is litter trained and very social.",
    image: "/images/RabbitA.png",
    size: "small",
    gender: "female",
    available: true,
    votes: { up: 10, down: 1 },
  },
  {
    name: "Guinea Pig",
    type: "small-pet",
    breed: "American Guinea Pig",
    age: "3 months",
    price: 45,
    description:
      "Lively and social beginner pet. Great for children and very easy to care for.",
    image: "/images/GuineaPigsLPicon.png",
    size: "small",
    gender: "male",
    available: true,
    votes: { up: 7, down: 0 },
  },
  {
    name: "German Shepherd",
    type: "dog",
    breed: "German Shepherd",
    age: "1 year",
    price: 1000,
    description:
      "Highly intelligent intensely active breed. Perfect for active families who enjoy outdoor activities.",
    image: "/images/germanshepherd.png",
    size: "large",
    gender: "female",
    available: true,
    votes: { up: 22, down: 1 },
  },
  {
    name: "Siamese Cat",
    type: "cat",
    breed: "Siamese",
    age: "6 months",
    price: 400,
    description:
      "Talkative social and unique companion. Known for their beautiful blue eyes and vocal personality.",
    image: "/images/Siamese.png",
    size: "medium",
    gender: "male",
    available: true,
    votes: { up: 14, down: 2 },
  },
  {
    name: "Labrador Puppy",
    type: "dog",
    breed: "Labrador Retriever",
    age: "3 months",
    price: 650,
    description:
      "Energetic and friendly puppy. Great with kids and other pets. Needs lots of exercise and play.",
    image: "/images/lab-puppy.png",
    size: "medium",
    gender: "female",
    available: true,
    votes: { up: 20, down: 0 },
  },
  {
    name: "Persian Cat",
    type: "cat",
    breed: "Persian",
    age: "2 years",
    price: 600,
    description:
      "Beautiful long-haired cat with a gentle personality. Requires regular grooming but very affectionate.",
    image: "/images/Himalayan.jpg",
    size: "medium",
    gender: "female",
    available: true,
    votes: { up: 11, down: 1 },
  },
  {
    name: "Pet Bed",
    type: "supply",
    breed: "Comfort Bed",
    age: "N/A",
    price: 65,
    description:
      "Soft, cozy and easy to wash. Perfect for dogs and cats of all sizes.",
    image: "/images/PetBeds.png",
    available: true,
    votes: { up: 5, down: 0 },
  },
  {
    name: "Premium Pet Food",
    type: "supply",
    breed: "Nutrition Plus",
    age: "N/A",
    price: 30,
    description:
      "Wholesome nutrition for furry friends. High-quality ingredients for optimal health.",
    image: "/images/PetFoodLPicon.png",
    available: true,
    votes: { up: 8, down: 1 },
  },
  {
    name: "Interactive Cat Toy",
    type: "supply",
    breed: "Smart Toy",
    age: "N/A",
    price: 25,
    description:
      "Keep your cat entertained for hours. Motion-activated and battery-powered.",
    image: "/images/interactivecattoy.png",
    available: true,
    votes: { up: 6, down: 0 },
  },
  {
    name: "Aquarium Kit",
    type: "supply",
    breed: "Complete Setup",
    age: "N/A",
    price: 120,
    description:
      "Everything you need to start your aquarium. Includes tank, filter, and starter supplies.",
    image: "/images/Aquarium.png",
    available: true,
    votes: { up: 4, down: 0 },
  },
];

// Sample products (only used if Product model exists)
const products = [
  {
    name: "Premium Dog Food",
    category: "food",
    subcategory: "dry-food",
    price: 29.99,
    description:
      "High-quality, nutritious dry dog food made with real chicken and wholesome grains. Perfect for adult dogs of all sizes.",
    image: "/images/Dogfood.png",
    brand: "FurBabies Premium",
    inStock: true,
    stockQuantity: 50,
    featured: true,
    petType: ["dog"],
    tags: ["chicken", "adult", "dry", "premium"],
    weight: "15 lbs",
    size: "Large Bag",
    ageRange: "Adult",
  },
  {
    name: "Interactive Cat Toys",
    category: "toys",
    subcategory: "interactive",
    price: 14.99,
    description:
      "Engaging interactive toys to keep your cat entertained and mentally stimulated. Includes feather wand, puzzle balls, and catnip mice.",
    image: "/images/interactivecattoy.png",
    brand: "PlayTime Plus",
    inStock: true,
    stockQuantity: 75,
    featured: true,
    petType: ["cat"],
    tags: ["interactive", "mental-stimulation", "feather", "catnip"],
    size: "Variety Pack",
    ageRange: "All Ages",
  },
  {
    name: "Aquarium Starter Kit",
    category: "housing",
    subcategory: "aquarium",
    price: 49.99,
    description:
      "Complete aquarium setup kit with 10-gallon tank, filter, heater, LED lighting, and essential accessories for beginner fish keepers.",
    image: "/images/Aquarium.png",
    brand: "AquaLife",
    inStock: true,
    stockQuantity: 25,
    featured: true,
    petType: ["fish"],
    tags: ["starter", "complete-kit", "10-gallon", "LED"],
    size: "10 Gallon",
    ageRange: "All Fish",
  },
];

// Sample users
const users = [
  {
    username: "admin",
    email: "admin@furbabies.com",
    password: "admin123",
    role: "admin",
    profile: {
      firstName: "Admin",
      lastName: "User",
    },
  },
  {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
    role: "user",
    profile: {
      firstName: "Test",
      lastName: "User",
    },
  },
];

// Sample contacts
const contacts = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    subject: "Question about adoption",
    message:
      "Hi, I am interested in adopting a Golden Retriever. Could you please provide more information about the adoption process?",
  },
];

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting FurBabies database seeding...");
    console.log("=".repeat(50));

    // Connect to MongoDB
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
    console.log("📊 Database name:", mongoose.connection.name);
    console.log("");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    const deletedPets = await Pet.deleteMany({});
    const deletedUsers = await User.deleteMany({});
    const deletedContacts = await Contact.deleteMany({});

    console.log(`🗑️  Deleted ${deletedPets.deletedCount} pets`);
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} users`);
    console.log(`🗑️  Deleted ${deletedContacts.deletedCount} contacts`);

    // Only clear products if Product model exists
    if (Product) {
      const deletedProducts = await Product.deleteMany({});
      console.log(`🗑️  Deleted ${deletedProducts.deletedCount} products`);
    }
    console.log("");

    // Create users
    console.log("👥 Creating users...");
    const createdUsers = [];

    for (const userData of users) {
      try {
        const user = new User(userData);
        const savedUser = await user.save();
        createdUsers.push(savedUser);
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${createdUsers.length} users`);
    console.log("");

    // Get admin user
    const adminUser = createdUsers.find((user) => user.role === "admin");

    // Create pets
    console.log("🐾 Creating pets...");
    const createdPets = [];

    for (const petData of pets) {
      try {
        const pet = new Pet({
          ...petData,
          createdBy: adminUser._id,
        });

        const savedPet = await pet.save();
        createdPets.push(savedPet);
        console.log(
          `✅ Created: ${petData.name} (${petData.type}) - $${petData.price}`,
        );
      } catch (error) {
        console.error(`❌ Failed to create ${petData.name}:`, error.message);
      }
    }

    console.log(`🎉 Successfully created ${createdPets.length} pets`);
    console.log("");

    // Create products (only if Product model exists)
    if (Product) {
      console.log("📦 Creating products...");
      const createdProducts = [];

      for (const productData of products) {
        try {
          const product = new Product({
            ...productData,
            createdBy: adminUser._id,
          });

          const savedProduct = await product.save();
          createdProducts.push(savedProduct);
          console.log(
            `✅ Created: ${productData.name} (${productData.category}) - $${productData.price}`,
          );
        } catch (error) {
          console.error(
            `❌ Failed to create ${productData.name}:`,
            error.message,
          );
        }
      }

      console.log(`🎉 Successfully created ${createdProducts.length} products`);
      console.log("");
    } else {
      console.log("⚠️  Skipping product creation - Product model not found");
      console.log("   To enable products: Create server/models/Product.js");
      console.log("");
    }

    // Create contacts
    console.log("📧 Creating contact messages...");
    const createdContacts = [];

    for (const contactData of contacts) {
      try {
        const contact = new Contact(contactData);
        const savedContact = await contact.save();
        createdContacts.push(savedContact);
        console.log(`✅ Created contact from: ${contactData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create contact from ${contactData.name}:`,
          error.message,
        );
      }
    }

    console.log(
      `🎉 Successfully created ${createdContacts.length} contact messages`,
    );
    console.log("");

    // Final summary
    const totalPets = await Pet.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalContacts = await Contact.countDocuments();
    const totalProducts = Product ? await Product.countDocuments() : 0;

    console.log("=".repeat(50));
    console.log("🎉 DATABASE SEEDING COMPLETED!");
    console.log("=".repeat(50));
    console.log(`📊 Final Statistics:`);
    console.log(`   🐾 Pets: ${totalPets}`);
    console.log(`   📦 Products: ${totalProducts}`);
    console.log(`   👥 Users: ${totalUsers}`);
    console.log(`   📧 Contacts: ${totalContacts}`);
    console.log("");
    console.log("🔑 Login Credentials:");
    console.log("   👨‍💼 Admin: admin@furbabies.com / admin123");
    console.log("   👤 Test User: test@example.com / password123");
    console.log("");

    if (!Product) {
      console.log("🎯 Next Steps for Products:");
      console.log("   1. Create server/models/Product.js");
      console.log("   2. Run seed script again to add products");
      console.log("");
    }

    await mongoose.disconnect();
    console.log("👋 Disconnected from database");
    console.log("🌟 Ready to test your FurBabies application!");

    process.exit(0);
  } catch (error) {
    console.error("\n💥 SEEDING FAILED!");
    console.error("❌ Error:", error.message);

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("❌ Error disconnecting:", disconnectError.message);
    }

    process.exit(1);
  }
};

// Run the seeding
console.log("🌱 FurBabies Database Seeding Script");
console.log("🕒 Started at:", new Date().toLocaleString());
console.log("");

seedDatabase();
