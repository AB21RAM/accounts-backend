// FetchAllAcademic();

const connection = require("./db");

exports.addFeeHead = (req, res) => {
    const { name } = req.body;
    const query = "INSERT INTO fee_heads (head_name) VALUES (?)";
    connection.query(query, [name], (err, result) => {
      if (err) {
        console.error("Error inserting data into the database:", err);
        res.status(500).json({ success: false, err });
        return;
      } else {
        res.status(200).json({
          success: true,
          message: "Data inserted successfully",
          result: result,
        });
      }
      res.end(); // Close the connection
    });
};

exports.fetchAllFh = (req, res) => {
    connection.query("SELECT * FROM fee_heads", (err, result) => {
      if (err) {
        res.status(500).json({ error: err });
      } else {
        if (result.length > 0) {
          res.status(200).json({ found: true, result: result });
        } else {
          res.status(404).json({ found: false, error: "Category not found" });
        }
      }
      res.end();
    });
};

exports.fetchAllProgram = (req, res) => {
    connection.query("SELECT * FROM programm_type", [], (err, result) => {
      if (err) {
        res.status(500).json({ error: err });
      } else {
        if (result.length > 0) {
          res.status(200).json({ found: true, result: result });
        } else {
          res.status(404).json({ found: false, error: "Category not found" });
        }
      }
      res.end();
    });
};

exports.mapcattofeehead = (req, res) => {
  //Note : passing year is nothing but the year_of_admission

  const {fh_name, amount, program, passing_year, priority, ay } =   req.body;

  const query =
    "INSERT INTO tbl_fee_structure (fh_id, amount, is_dsa, year_of_admission, priority, ay) VALUES (?,?,?,?,?,?)";
  connection.query(
    query,
    [fh_name, amount, program, passing_year, priority, ay],
    (err, result) => {
      if (err) {
        console.error("Error inserting data into the database:", err);
        res.status(500).json({ success: false, err });
        return;
      } else {
        res.status(200).json({
          success: true,
          message: "Data inserted successfully",
          result: result,
        });
      }
      res.end(); // Close the connection
    }
  );
};