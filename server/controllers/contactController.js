// server/controllers/contactController.js - ES6 Module Version
import Contact from "../models/Contact.js";

// 📬 Submit contact form
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      subject: subject || "General Inquiry",
      message,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message:
        "Contact form submitted successfully. We will get back to you soon!",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error submitting contact form",
      error: error.message,
    });
  }
};

// 📋 Get all contacts (Admin)
const getAllContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = status ? { status } : {};

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("response.respondedBy", "username email");

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching contacts",
      error: error.message,
    });
  }
};

// 🔍 Get single contact by ID (Admin)
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate(
      "response.respondedBy",
      "username email",
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching contact",
      error: error.message,
    });
  }
};

// 📝 Respond to contact (Admin)
const respondToContact = async (req, res) => {
  try {
    const { message } = req.body;

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    contact.response = {
      message,
      respondedBy: req.user._id,
      respondedAt: new Date(),
    };
    contact.status = "responded";

    await contact.save();

    res.json({ success: true, message: "Response recorded", data: contact });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error responding to contact",
      error: error.message,
    });
  }
};

// 🔁 Update contact status (Admin)
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    res.json({
      success: true,
      message: "Contact status updated",
      data: contact,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// ✅ ES6 Export - Default export with all functions
export default {
  submitContact,
  getAllContacts,
  getContactById,
  respondToContact,
  updateContactStatus,
};