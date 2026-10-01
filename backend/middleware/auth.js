import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const token = header.substring(7);

    const firebase = getFirebaseAdmin();

    if (!firebase) {
      return res.status(500).json({
        error: "Firebase Admin is not configured"
      });
    }

    const decoded = await firebase.auth().verifyIdToken(token);

    let user = await User.findOne({
      firebaseUid: decoded.uid
    });

    if (!user) {
      const role =
        decoded.email?.toLowerCase() ===
        process.env.ADMIN_EMAIL?.toLowerCase()
          ? "ADMIN"
          : "CUSTOMER";

      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || "User",
        email: decoded.email || "",
        phone: decoded.phone_number || "",
        role
      });
    }

    req.firebaseUser = decoded;
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    return res.status(401).json({
      error: "Invalid authentication token"
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      error: "Admin access required"
    });
  }

  next();
}
