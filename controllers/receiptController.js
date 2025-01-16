const connection = require("./db");

exports.getGeneralReceipt=async (req,res)=>{
    const {fh_id,dateR} = req.body;

    let newDate = new Date(dateR).toLocaleDateString('en-CA');
    console.log('callled')
    if(fh_id!=''){
        connection.query(`
        select 
            fr.*,
            a.name,
            b.bname,
            p.programm_name as program,
            a.cat_id as category
        from tbl_fee_head_receipts as fr
        left join students as s on s.stud_clg_id = fr.stud_clg_id
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        where fh_id=? and date_of_payment=?`,[fh_id,newDate],(err,receipts)=>{
            if(err){
                console.log(err);
                res.status(500).json({ msg: "Something went wrong" });
                return res.end;
            }
            else{
                res.status(200).json({ receipts: receipts });
                return res.end();
            }
        })
    }else{
        connection.query(`
        select 
            fr.*,
            a.name,
            b.bname,
            p.programm_name as program,
            a.cat_id as category
        from tbl_fee_receipt as fr
        left join students as s on s.stud_clg_id = fr.stud_clg_id
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        where date_of_payment=?`,[newDate],(err,receipts)=>{
            if(err){
                console.log(err);
                res.status(500).json({ msg: "Something went wrong" });
                return res.end;
            }
            else{
                console.log(receipts)
                res.status(200).json({ receipts: receipts });
                return res.end();
            }
        })
    }
}

exports.fetchReceiptsId = async (req,res) =>{
    const {id, fh_id} = req.body;

    if(fh_id!=''){
        connection.query(`
        select 
            fr.*,
            a.name,
            b.bname,
            p.programm_name as program,
            a.cat_id as category
        from tbl_fee_head_receipts as fr
        left join students as s on s.stud_clg_id = fr.stud_clg_id
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        where receipt_id=?`,[id],(err,receipts)=>{
            if(err){
                console.log(err);
                res.status(500).json({ msg: "Something went wrong" });
                return res.end;
            }
            else{
                res.status(200).json({ receipts: receipts });
                return res.end();
            }
        })
    }else{
        connection.query(`
        select 
            fr.*,
            a.name,
            b.bname,
            p.programm_name as program,
            a.cat_id as category
        from tbl_fee_receipt as fr
        left join students as s on s.stud_clg_id = fr.stud_clg_id
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        where receipt_id=?`,[id],(err,receipts)=>{
            if(err){
                console.log(err);
                res.status(500).json({ msg: "Something went wrong" });
                return res.end;
            }
            else{
                res.status(200).json({ receipts: receipts });
                return res.end();
            }
        })
    }
}