const connection = require("./db");

exports.fetchAllFaculty = async (req, res) => {
  connection.query(
    `
        select name, faculty_clg_id as faculty_id from faculty;
    `,
    (err, faculty) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: "Something Went Wrong!" });
        return res.end();
      } else {
        res.status(200).json({ facultyList: faculty });
        return res.end();
      }
    }
  );
};

exports.getSalaryData = async (req, res) => {
  const { faculty_id } = req.body;

  connection.query(
    `
    select 
    f.faculty_id, 
    f.name, 
    coalesce(fb.amount,0) as basic_earn, 
    coalesce(fli.amount,0) as loan_installment,
    coalesce(sa.spl_allow, 0) as spl_allow,
    coalesce(sa.other_allow,0) as other_allow, 
    coalesce(sa.income_tax,0) as income_tax, 
    coalesce(sa.other_deduction,0) as other_deduction, 
    coalesce(sfi.bank_account_no,'') as bank_account_no,
    coalesce(sa.agp,0) as agp,
coalesce(da_hra.da,0) as da,
coalesce(da_hra.pf,0) as pf,
coalesce(da_hra.hra,0) as hra,
coalesce(fixed.ta,0) as ta,
coalesce(fixed.ptax,0) as ptax,
coalesce(sfi.grade,'') as grade,
coalesce(sfi.pfno,'') as pfno,
coalesce(sfi.panno,'') as panno,
dept.name as department,
r.name as designation,
ft.ftname as division 
from faculty as f 
left join tbl_salary_faculty_info as sfi on sfi.faculty_id = f.faculty_id
left join tbl_faculty_basic_earn_mapping as fb on f.faculty_id = fb.faculty_id 
left join tbl_faculty_loan_installaments as fli on fli.faculty_id = f.faculty_id 
left join tbl_spl_other_allow as sa on f.faculty_id = sa.faculty_id
left join department as dept on dept.depart_id = f.depart_id
left join faculty_types as ft on ft.ftype_id = f.ftype_id
left join role as r on r.role_id = f.role
join (
select sum(da) as da,sum(pf) as pf, sum(hra) as hra from (select case when name='DA' then sum(percentage) else 0 end as da, case when name='PF' then sum(percentage) else 0 end as pf, case when name = 'HRA' then sum(percentage) else 0 end as hra from tbl_salary_da_per group by name) as a
) as da_hra
join (
select sum(ptax) as ptax, sum(ta) as ta from (select case when name='PTAX' then sum(amount) else 0 end as ptax, case when name = 'TA' then sum(amount) else 0 end as ta from tbl_fixed_salary_components group by name) as a
) as fixed
where f.faculty_clg_id = ?
    `,
    [faculty_id],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: "Something Went Wrong!" });
        return res.end();
      } else {
        res.status(200).json({ data: data });
        return res.end();
      }
    }
  );
};

exports.salaryFormData = async (req, res) => {
  const {
    pfno,
    bank_account_no,
    panno,
    grade,
    faculty_id,
    basic_earn,
    loan_installment,
    spl_allow,
    other_allow,
    income_tax,
    other_deduction,
    agp,
  } = req.body;

  console.log(
    faculty_id,
    basic_earn,
    loan_installment,
    spl_allow,
    other_allow,
    income_tax,
    other_deduction,
    agp
  );
  connection.query(
    "select * from tbl_faculty_basic_earn_mapping where faculty_id = ?",
    [faculty_id],
    async (err, faculty) => {
      if (err) console.log(err);
      else if (faculty.length > 0) {
        await connection.query(
          `
                update tbl_faculty_basic_earn_mapping 
                set amount = ? where faculty_id = ?
                `,
          [basic_earn, faculty_id],
          (err, basic_updated) => {
            if (err) console.log(err);
          }
        );

        await connection.query(
          `
                    update tbl_faculty_loan_installaments
                    set amount = ? where faculty_id = ?
                `,
          [loan_installment, faculty_id],
          (err, loan_updaetd) => {
            if (err) console.log(err);
          }
        );

        await connection.query(
          `
                update tbl_spl_other_allow
                set spl_allow = ?,
                    other_allow = ?,
                    income_tax = ?,
                    other_deduction = ?,
                    agp = ?
                where faculty_id = ?
            `,
          [
            spl_allow,
            other_allow,
            income_tax,
            other_deduction,
            agp,
            faculty_id,
          ],
          (err, spl_updated) => {
            if (err) console.log(err);
          }
        );
      } else {
        await connection.query(
          "insert into tbl_faculty_basic_earn_mapping (amount,faculty_id) values (?,?)",
          [basic_earn, faculty_id],
          (err, basic_inserted) => {
            if (err) console.log(err);
          }
        );

        await connection.query(
          "insert into tbl_faculty_loan_installaments (amount, faculty_id ) values (?,?)",
          [loan_installment, faculty_id],
          (err, loan_inserted) => {
            if (err) console.log(err);
          }
        );

        await connection.query(
          `
            insert into tbl_spl_other_allow (spl_allow,other_allow,income_tax,other_deduction,agp,faculty_id) values (?,?,?,?,?,?)
            `,
          [
            spl_allow,
            other_allow,
            income_tax,
            other_deduction,
            agp,
            faculty_id,
          ],
          (err, spl_inserted) => {
            if (err) console.log(err);
          }
        );
      }
    }
  );

  connection.query(
    `
        select * from tbl_salary_faculty_info
    `,
    (err, faculty) => {
      if (err) console.log(err);
      else if (faculty.length > 0) {
        connection.query(
          `update tbl_salary_faculty_info set pfno=?, panno=?, grade=?, bank_account_no = ? where faculty_id = ?`,
          [pfno, panno, grade, bank_account_no, faculty_id],
          (err, updated_salary) => {
            if (err) console.log(err);
          }
        );
      } else {
        connection.query(
          `insert into tbl_salary_faculty_info (pfno,panno,grade,bank_account_no,faculty_id) values (?,?,?,?)`,
          [pfno, panno, grade, bank_account_no, faculty_id],
          (err, inserted_salary) => {
            if (err) console.log(err);
          }
        );
      }
    }
  );

  res.status(200).json({ msg: "Data Modified!" });
  return res.end();
};

exports.fetchAllPercenatge = async (req, res) => {
  connection.query("select * from tbl_salary_da_per", (err, data) => {
    if (err) console.log(err);
    else {
      res.status(200).json({ data: data });
      return res.end();
    }
  });
};

exports.frtchAllFixedComponents = async (rea, res) => {
  connection.query("select * from tbl_fixed_salary_components", (err, data) => {
    if (err) console.log(err);
    else {
      res.status(200).json({ data: data });
      return res.end();
    }
  });
};

exports.updatePercentage = async (req, res) => {
  const { da, hra, pf } = req.body;

  for (let i = 1; i <= 3; i++) {
    let amt = i == 1 ? da : i == 2 ? hra : pf;
    connection.query(
      "update tbl_salary_da_per set percentage = ? where da_id = ?",
      [amt, i],
      (err, data) => {
        if (err) console.log(err);
      }
    );
  }

  res.status(200).json({ msg: "Data Modified!" });
  return res.end();
};

exports.updateFixedComponents = async (req, res) => {
  const { ta, ptax } = req.body;

  for (let i = 1; i <= 2; i++) {
    let amt = i == 1 ? ta : ptax;
    connection.query(
      "update tbl_fixed_salary_components set amount = ? where fsc_id = ?",
      [amt, i],
      (err, data) => {
        if (err) console.log(err);
      }
    );
  }

  res.status(200).json({ msg: "Data Modified!" });
  return res.end();
};

exports.generateSalarySlip = async (req, res) => {
  //   const { formated_date } = req.body;

  const today = new Date();
  let end = new Date(today.getFullYear(), today.getMonth(), 1);
  end.setDate(0);
  let start = new Date(end);
  start.setDate(1);

  end = end.toLocaleDateString("en-CA");
  start = start.toLocaleDateString("en-CA");
  console.log(start);
  connection.query(
    `
            select salaryDate from tbl_pay_slip_faculty where salaryDate = DATE_FORMAT(?, '%b%Y')
        `,
    [end],
    (err, salData) => {
      if (err) console.log(err);
      else {
        console.log("salData:", salData);
        if (salData.length > 0) {
          res.status(200).json({ msg: "Data Already Present!" });
          return res.end();
        } else {
          connection.query(
            `
                    insert into tbl_pay_slip_faculty (
                        branch, name, emp_code, grade, department, designation, pfno, division, panno, bank_account_no, days_paid, days_present, w_off, pd_off, lwp, absent, earned_basic, da, hra, ta, other_allow, agp, spl_pay, pf, ptax, income_tax, loan_installment, other_deduction, total_earning, total_deduction, net_pay,salaryDate,pay_slip_month
                    )
                    select
                        *,
                        (basic_earn+da+hra+ta+other_allow+spl_allow+agp) as total_earning,
                        (pf+ptax+income_tax+loan_installment+other_deduction) as total_deduction,
                        ((basic_earn+da+hra+ta+other_allow+spl_allow+agp) - (pf+ptax+income_tax+loan_installment+other_deduction)) as net_pay,
                        DATE_FORMAT(?, '%b%Y') as salaryDate,
                        date_format(?,'%M %Y') as pay_slip_month
                    from (
                        select
                            "Mumbai" as branch,
                            f.name, 
                            f.faculty_clg_id as emp_code, 
                            coalesce(sfi.grade,'') as grade,
                            dept.name as department,
                            r.name as designation,
                            coalesce(sfi.pfno,'') as pfno,
                            ft.ftname as division, 
                            coalesce(sfi.panno,'') as panno,
                            coalesce(sfi.bank_account_no,'Not Provided') as bank_account_no,
                            datediff(?,?)+1 as days_paid,
                            pre.days_present,
                            week.wo as w_off,
                            poff.pd_off,
                            case when (datediff(?,?)+1)-(pre.days_present+week.wo+poff.pd_off)>=1 then ((datediff(?,?)+1)-(pre.days_present+week.wo+poff.pd_off) - leaves.on_leave) else 0 end as lwp,
                            (datediff(?,?)+1)-(pre.days_present+week.wo+poff.pd_off) as absent,
                            coalesce(fb.amount,0) as basic_earn, 
                            coalesce((fb.amount*da_hra.da)/100,0) as da,
                            coalesce((fb.amount*da_hra.hra)/100,0) as hra,
                            coalesce(fixed.ta,0) as ta,
                            coalesce(sa.other_allow,0) as other_allow, 
                            coalesce(sa.agp,0) as agp,
                            coalesce(sa.spl_allow, 0) as spl_allow,
                            coalesce((fb.amount*da_hra.pf)/100,0) as pf,
                            coalesce(fixed.ptax,0) as ptax,
                            coalesce(sa.income_tax,0) as income_tax, 
                            coalesce(fli.amount,0) as loan_installment,
                            coalesce(sa.other_deduction,0) as other_deduction
                        from faculty as f 
                        left join tbl_salary_faculty_info as sfi on sfi.faculty_id = f.faculty_id
                        left join tbl_faculty_basic_earn_mapping as fb on f.faculty_id = fb.faculty_id 
                        left join tbl_faculty_loan_installaments as fli on fli.faculty_id = f.faculty_id 
                        left join tbl_spl_other_allow as sa on f.faculty_id = sa.faculty_id
                        left join department as dept on dept.depart_id = f.depart_id
                        left join faculty_types as ft on ft.ftype_id = f.ftype_id
                        left join role as r on r.role_id = f.role
                        left join (
                            select faculty_clg_id, count(*) as days_present from (select distinct faculty_clg_id, date_d from attendance) as a where date_d between ? and ? and DAYOFWEEK(date_d) not IN (1, 7) group by faculty_clg_id
                        ) as pre on pre.faculty_clg_id = f.faculty_clg_id
                        left join (
                            select faculty_id, sum(no_of_days) as on_leave from (select * from leave_application where from_date between ? and ? and to_date between ? and ? and status = 1) as a group by faculty_id
                        ) as leaves on leaves.faculty_id = f.faculty_id
                        join (
                        select sum(da) as da,sum(pf) as pf, sum(hra) as hra from (select case when name='DA' then sum(percentage) else 0 end as da, case when name='PF' then sum(percentage) else 0 end as pf, case when name = 'HRA' then sum(percentage) else 0 end as hra from tbl_salary_da_per group by name) as a
                        ) as da_hra
                        join (
                        select sum(ptax) as ptax, sum(ta) as ta from (select case when name='PTAX' then sum(amount) else 0 end as ptax, case when name = 'TA' then sum(amount) else 0 end as ta from tbl_fixed_salary_components group by name) as a
                        ) as fixed
                        join (
                            select count(*) as wo from date_range_table where date_value between ? and ? and holidays = 'W.O' group by holidays
                        ) as week
                        join (
                            select count(*) as pd_off from date_range_table where date_value between ? and ? and holidays is not null and holidays <> 'W.O'
                        ) as poff
                    ) as a
                    `,
            [
              end,
              end,
              end,
              start,
              end,
              start,
              end,
              start,
              end,
              start,
              start,
              end,
              start,
              end,
              start,
              end,
              start,
              end,
              start,
              end,
            ],
            (err, data) => {
              if (err) {
                console.error("Insert Query Error: ", err);
                res.status(500).json({ msg: "Database Error", error: err });
              } else {
                connection.query("SHOW WARNINGS", (warningErr, warnings) => {
                  if (warningErr) console.log("Warnings Error:", warningErr);
                  else console.log("MySQL Warnings:", warnings);
                });
                console.log("Insert Success:", data);
                res.status(200).json({ msg: "Success" });
              }
            }
          );
        }
      }
    }
  );
};

exports.getSalarySlips = async (req, res) => {
  const today = new Date();
  let end = new Date(today.getFullYear(), today.getMonth(), 1);
  end.setDate(0);
  let start = new Date(end);
  start.setDate(1);

  end = end.toLocaleDateString("en-CA");
  start = start.toLocaleDateString("en-CA");
  // DATE_FORMAT(?, '%b%Y')
  connection.query(
    `
        select * from tbl_pay_slip_faculty where salaryDate = DATE_FORMAT(?, '%b%Y');
    `,
    [end],
    (err, salData) => {
      if (err) console.log(err);
      else {
        res.status(200).json({ data: salData });
        return res.end();
      }
    }
  );
};

exports.getSalarySlipsIndividual = async (req, res) => {
  const { id, month } = req.body;
  const monthYear = month.replace(/^(\w{3})\w*(\d{4})$/, "$1$2");
  //   const today = new Date();
  //   let end = new Date(today.getFullYear(), today.getMonth(), 1);
  //   end.setDate(0);
  //   let start = new Date(end);
  //   start.setDate(1);

  //   end = end.toLocaleDateString("en-CA");
  //   start = start.toLocaleDateString("en-CA");
  // Dec2023
  connection.query(
    `
        select * from tbl_pay_slip_faculty where upper(salaryDate) = upper(?) and emp_code = ?
    `,
    [monthYear, id],
    (err, salData) => {
      if (err) console.log(err);
      else {
        res.status(200).json({ data: salData });
        return res.end();
      }
    }
  );
};

exports.addOtherDeductions = async (req, res) => {
  const { title, amout, id } = req.body;
  connection.query(
    `
        insert into tbl_other_deductions (title, amount, faculty_id) values (?,?,?)
        `,
    [title, amout, id],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: "Error" });
        return res.end();
      } else {
        res.status(200).json({ msg: "Done" });
        return res.end();
      }
    }
  );
};

exports.getOtherDeductions = async (req, res) => {
  const { id } = req.body;

  connection.query(
    `
        select * from tbl_other_deductions where faculty_id = ?
        `,
    [id],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: "Error" });
        return res.end();
      } else {
        res.status(200).json({ data: data });
        return res.end();
      }
    }
  );
};

exports.deleteOtherDeductions = async (req, res) => {
  const { id } = req.body;

  connection.query(
    `
        delete from tbl_other_deductions where od_id = ?
        `,
    [id],
    (err, data) => {
      if (err) {
        console.log(err);
        res.status(500).json({ msg: "Error" });
        return res.end();
      } else {
        res.status(200).json({ msg: "Deleted" });
        return res.end();
      }
    }
  );
};
