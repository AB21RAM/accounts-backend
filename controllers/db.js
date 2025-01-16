const mysql = require("mysql2");
const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env; // Load your environment variables

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "academate",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.message);
    throw err;
  }
  console.log("Connected to MySQL");
});

module.exports = connection;
