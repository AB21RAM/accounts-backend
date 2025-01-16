const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 5002;

app.use(bodyParser.json());
app.use(cors());
// Include your routes here
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
