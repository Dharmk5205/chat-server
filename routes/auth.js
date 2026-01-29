const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const authMiddleware = require("../middleware/authMiddleware"); // ✅ Add this

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingEmail = await User.findOne({ $or: [{ email }] });
    const existingUser = await User.findOne({$or:[{username }]})
    if (existingEmail) {
      return res.status(400).json({ message: "Email already taken" });
    }

    else if(existingUser){
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ fullName, username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating account", error: error.message });
  }
});

// POST /auth/set-avatar
router.post("/set-avatar", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { avatar } = req.body;

  if (!avatar) {
    return res.status(400).json({ message: "Avatar is required" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    );
    res.json({ message: "Avatar updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update avatar" });
  }
});



// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Get Logged-In User
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token", error: error.message });
  }
});

module.exports = router;
