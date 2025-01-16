const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const connection = require("./db");

exports.getUserByEmail = (req, res) => {
  // Check authentication (JWT token)
  if (!req.user || !req.user.email) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Missing or invalid token" });
    res.end();
  }

  const userEmail = req.user.email; // Extract the email from the JWT token

  // Select data for the user with the matching email from the database (excluding password)
  connection.query(
    "SELECT id, email, name, contact, branch, batch, collegeId FROM alumni_data WHERE email = ?",
    [userEmail],
    (error, results) => {
      if (error) {
        console.error("Error retrieving user data:", error.message);
        return res.status(500).json({ message: "Error retrieving user data" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Send the user data to the client
      res.status(200).json(results[0]);
    }
  );
};

exports.getSingleFeeHeadsAmount = (req, res) => {
  // Check authentication (JWT token)
  if (!req.user || !req.user.email) {
    return res
      .status(401)
      .json({ message: "Unauthorized - Missing or invalid token" });
    res.end();
  }

  const userEmail = req.user.email; // Extract the email from the JWT token

  // Select data for the user with the matching email from the database (excluding password)
  connection.query("SELECT * FROM sigle_heads_amount", (error, results) => {
    if (error) {
      console.error("Error retrieving user data:", error.message);
      return res.status(500).json({ message: "Error retrieving user data" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send the user data to the client
    res.status(200).json(results);
  });
};
