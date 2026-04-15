const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SALT_ROUNDS = 10;

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev-secret";
  const name = user.name || user.email || user.phone || "user";

  return jwt.sign(
    {
      userId: String(user._id),
      role: user.role,
      region_id: user.region_id || null,
      name,
    },
    secret,
    { expiresIn: "12h" }
  );
}

async function register(req, res, next) {
  try {
    const { password, ...payload } = req.body;

    if (!password) {
      return res.status(400).json({ error: "password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      ...payload,
      password: hashedPassword,
    });

    return res.status(201).json({
      user: user.toJSON(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "email or phone already exists" });
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: "email or phone and password are required" });
    }

    const user = await User.findOne(email ? { email } : { phone }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const token = signToken(user);
    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, signToken };
