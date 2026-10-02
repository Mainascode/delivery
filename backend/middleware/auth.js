import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const ADMIN_EMAILS = [
  "mainaemmanuel855@gmail.com",
  "kimaningugihenry@gmail.com",
];

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const token = header.substring(7);

    const firebaseAuth = getFirebaseAuth();

    if (!firebaseAuth) {
      return res.status(500).json({
        error: "Firebase Admin is not configured",
      });
    }

    const decoded = await firebaseAuth.verifyIdToken(token);

    const email = decoded.email?.toLowerCase();

    const isAdmin = ADMIN_EMAILS.includes(email);

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || "User",
        email: decoded.email || "",
        phone: decoded.phone_number || "",
        role: isAdmin ? "ADMIN" : "CUSTOMER",
      });
    }

    if (isAdmin && user.role !== "ADMIN") {
      user.role = "ADMIN";
      await user.save();
    }

    req.firebaseUser = decoded;
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    return res.status(401).json({
      error: "Invalid authentication token",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      error: "Admin access required",
    });
  }

  next();
}


