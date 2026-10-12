import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const ADMIN_EMAILS = new Set([
  "mainaemmanuel855@gmail.com",
  "kimaningugihenry@gmail.com",
].map((email) => email.toLowerCase()));

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const token = header.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      error: "Authentication token is missing",
    });
  }

  let decoded;

  // Verify Firebase identity separately from database operations.
  try {
    const firebaseAuth = getFirebaseAuth();

    if (!firebaseAuth) {
      return res.status(500).json({
        error: "Firebase Admin is not configured",
      });
    }

    decoded = await firebaseAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);

    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }

  try {
    const email = decoded.email?.trim().toLowerCase() || "";
    const isAdmin = ADMIN_EMAILS.has(email);

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      // The MongoDB schema requires an email address.
      if (!email) {
        return res.status(400).json({
          error: "An email address is required to create your NITUME profile.",
        });
      }

      try {
        user = await User.create({
          firebaseUid: decoded.uid,
          name:
            decoded.name?.trim() ||
            email.split("@")[0] ||
            "User",
          email,
          phone: decoded.phone_number || "",
          role: isAdmin ? "ADMIN" : "CUSTOMER",
        });
      } catch (createError) {
        // Handle simultaneous requests attempting to create the same user.
        if (createError.code === 11000) {
          user = await User.findOne({
            firebaseUid: decoded.uid,
          });

          if (!user) throw createError;
        } else {
          throw createError;
        }
      }
    }

    // Never accept a role from the client.
    // Only the server-side allowlist can promote an account.
    if (isAdmin && user.role !== "ADMIN") {
      user.role = "ADMIN";
      await user.save();
    }

    req.firebaseUser = decoded;
    req.user = user;

    return next();
  } catch (error) {
    console.error("User profile lookup/creation failed:", error.message);

    return res.status(500).json({
      error: "Unable to load your NITUME profile. Please try again.",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      error: "Admin access required",
    });
  }

  return next();
}