const connection = require("./db");

exports.studentWiseReciept = async (req, res) => {
  const { stud_clg_id, ay } = req.body;
  await connection.query(
    `
            select 
                f.receipt_id as 'Receipt Number',
                a.name as 'Name',
                a.application_number as 'College ID',
                b.bname as 'Branch Name',
                a.cat_id as 'Category',
                date_format(f.date_of_payment,'%d-%m-%y')  as 'Date',
                f.installment_number as 'Installment',
                f.amount as 'Amount',
                f.balance_amount as 'Balance Amount',
                f.mop
            from tbl_fee_receipt as f
            left join students as s on upper(s.stud_clg_id) = upper(f.stud_clg_id)
            left join allowed_application as a on a.application_number = f.stud_clg_id
            left join branch as b on b.branch_id = s.branch_id
            where s.stud_clg_id = ? and f.academic_year = ?
        `,
    [stud_clg_id, ay],
    async (err, report) => {
      if (err) console.log(err);
      else {
        let newreport = await convertJSONtoCSVss(report);
        console.log(newreport);
        res.status(200).json({ data: newreport });
        return res.end();
      }
    }
  );
};

exports.getHeadwiseReport = async (req, res) => {
  const { selectedHead, from_date, to_date, branch_id } = req.body;

  let new_from_date = new Date(from_date).toLocaleDateString("en-CA");
  let new_to_date = new Date(to_date).toLocaleDateString("en-CA");

  if (selectedHead == "") {
    await connection.query(
      `
                select 
                    f.receipt_id as 'Receipt Number',
                    a.name as 'Name',
                    a.application_number as 'College ID',
                    b.bname as 'Branch Name',
                    a.cat_id as 'Category',
                    date_format(f.date_of_payment,'%d-%m-%y')  as 'Date',
                    f.installment_number as 'Installment',
                    f.amount as 'Amount',
                    f.balance_amount as 'Balance Amount',
                    f.mop as 'Mode Of Payment'
                from tbl_fee_receipt as f
                left join students as s on upper(s.stud_clg_id) = upper(f.stud_clg_id)
                left join allowed_application as a on a.application_number = f.stud_clg_id
                left join branch as b on b.branch_id = s.branch_id
                where date_of_payment between ? and ? and s.branch_id = ?
            `,
      [new_from_date, new_to_date, branch_id],
      async (err, report) => {
        if (err) console.log(err);
        else {
          let newreport = await convertJSONtoCSVss(report);
          console.log(newreport);
          res.status(200).json({ data: newreport });
          return res.end();
        }
      }
    );
  } else {
    await connection.query(
      `
                select 
                    f.receipt_id as 'Receipt Number',
                    a.name as 'Name',
                    a.application_number as 'College ID',
                    b.bname as 'Branch Name',
                    a.cat_id as 'Category',
                    date_format(f.date_of_payment,'%d-%m-%y') as 'Date',
                    f.installment_number as 'Installment',
                    f.amount as 'Amount',
                    f.balance_amount as 'Balance Amount',
                    f.mop as 'Mode Of Payment'
                from tbl_fee_head_receipts as f
                left join students as s on s.stud_clg_id = f.stud_clg_id and s.academic_year = f.academic_year
                left join allowed_application as a on a.application_number = f.stud_clg_id
                left join branch as b on b.branch_id = s.branch_id
                where f.fh_id = ? and s.branch_id = ? and f.date_of_payment between ? and ?;
            `,
      [selectedHead, branch_id, new_from_date, new_to_date],
      async (err, report) => {
        if (err) console.log(err);
        else {
          console.log(new_to_date, new_from_date);
          console.log(report);
          if (report.length > 1) {
            let newreport = await convertJSONtoCSVss(report);
            console.log(newreport);
            res.status(200).json({ data: newreport });
            return res.end();
          }
        }
      }
    );
  }
};

exports.getBalReport = async (req, res) => {
  const { branch_id } = req.body;

  console.log(branch_id);
  connection.query(
    `
            select 
                a.name as 'Name',
                a.application_number as 'College ID',
                a.years as 'Program',
                b.bname as 'Branch Name',
                a.cat_id as 'Category',
                coalesce(coalesce(fsa.amount,0)-coalesce(sh.scholership_amount,0),0) as 'Actual Fee',
                case when f.installment_number = 1 then f.amount else 0  end as 'Intallment 1',
                case when f.installment_number = 2 then f.amount else 0 end as 'Intallment 2',
                case when f.installment_number = 3 then f.amount else 0 end as 'Intallment 3',
                case when f.installment_number = 4 then f.amount else 0 end as 'Intallment 4',
                case when f.installment_number = 5 then f.amount else 0 end as 'Intallment 5',
                case when f.installment_number = 6 then f.amount else 0 end as 'Intallment 6',
                case when f.installment_number = 7 then f.amount else 0 end as 'Intallment 7',
                case when f.installment_number = 8 then f.amount else 0 end as 'Intallment 8',
                case when f.installment_number = 9 then f.amount else 0 end as 'Intallment 9',
                case when f.installment_number = 10 then f.amount else 0 end as 'Intallment 10',
                coalesce(sum(f.amount),0) as 'Total Fee Paid',
                coalesce(coalesce(coalesce(fsa.amount,0)-coalesce(sh.scholership_amount,0),0)-coalesce(f.amount,0),0) as 'Balance Fee'
            from tbl_fee_receipt as f
            left join students as s on s.stud_clg_id = f.stud_clg_id and s.academic_year = f.academic_year
            left join allowed_application as a on a.application_number = f.stud_clg_id
            left join student_scholership as sh on s.stud_clg_id = sh.stud_clg_id
            left join (select sum(amount) as amount, ay, is_dsa, year_of_admission from tbl_fee_structure group by ay, is_dsa, year_of_admission) as fsa on fsa.ay = s.academic_year and fsa.is_dsa = a.is_dsa and fsa.year_of_admission = a.year_of_admission
            left join branch as b on b.branch_id = s.branch_id
            where s.branch_id = ?
            group by a.application_number, a.name, s.stud_clg_id, f.installment_number,f.amount, f.amount, fsa.amount,a.years, a.cat_id,sh.scholership_amount
        `,
    [branch_id],
    async (err, report) => {
      if (err) console.log(err);
      else {
        let newreport = await convertJSONtoCSVss(report);
        res.status(200).json({ data: newreport });
        return res.end();
      }
    }
  );
};

function convertJSONtoCSVss(data) {
  const header = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(header.join(","));

  for (const row of data) {
    const values = header.map((field) => {
      let value = row[field];
      if (typeof value !== "string") {
        value = String(value); // Convert to string if not already a string
      }
      value = value.replace(/"/g, ""); // Remove any double quotes from the value
      return value;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

exports.getBranch = async (req, res) => {
  connection.query(`select * from branch`, (err, branches) => {
    if (err) console.log(err);
    else {
      res.status(200).json({ branches: branches });
      return res.end();
    }
  });
};
