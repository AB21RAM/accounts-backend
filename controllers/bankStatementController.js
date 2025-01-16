const connection = require("./db");

exports.fetchDDData = async (req, res) => {
  connection.query(
    `
        select
            d.*,
            f.receipt_id
        from tbl_dd_info as d
        left join tbl_fee_receipt as f on f.dd_no = d.dd_number
        where dd_id not in (
            select 
            dd_id
            from tbl_bank_statement
        );
    `,
    (err, ddData) => {
      {
        if (err) console.log(err);
        else {
          res.status(200).json({ ddData: ddData });
          return res.end();
        }
      }
    }
  );
};

exports.AddStatement = async (req, res) => {
  const { ddIds } = req.body;

  try {
    await ddIds.forEach((e) => {
      connection.query(
        `
                 insert into tbl_bank_statement (dd_id) values (?)
                 `,
        [e],
        (err, done) => {
          if (err) console.log(err);
        }
      );
    });

    res.status(200).json({ msg: "Generated" });
    return res.end();
  } catch {
    res.status(500).json({ msg: "Something Went Wrong!" });
    return res.end();
  }
};

exports.StatementDates = async (req, res) => {
  try {
    connection.query(
      `select
                distinct Date(statement_date) as dates
            from tbl_bank_statement;
            `,
      (err, dates) => {
        if (err) console.log(err);
        else {
          res.status(200).json({ dates: dates });
          return res.end();
        }
      }
    );
  } catch {
    res.status(500).json({ msg: "Something went wrong!" });
    return res.end();
  }
};

exports.printStatement = async (req, res) => {
  try {
    const { date } = req.body;

    // console.log(new Date(date).toISOString());
    // console.log(date);
    connection.query(
      `
            select
                d.*,
                f.receipt_id
            from tbl_dd_info as d
            left join tbl_bank_statement as s on s.dd_id = d.dd_id
            left join tbl_fee_receipt as f on f.dd_no = d.dd_number
            where Date(s.statement_date) = ?
            `,
      [new Date(date).toISOString()],
      (err, ddData) => {
        if (err) console.log(err);
        else {
          res.status(200).json({ ddData: ddData });
          return res.end();
        }
      }
    );
  } catch {
    res.status(500).json({ msg: "Something went wrong!" });
    return res.end();
  }
};
