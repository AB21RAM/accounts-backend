const connection = require("./db");

exports.getFeeStructure =  (req,res) =>{
    const {clgId, ay,uid} = req.body;

    console.log(ay);
    if(clgId==undefined){
        connection.query(
            `
            select
                a.name as name,
                b.bname as branch,
                p.programm_name as program,
                a.cat_id as category,
                coalesce(sum(fs.amount),0) as total_fee,
                coalesce(ss.scholership_amount,0) as scholership,
                (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)) as amt_afterscholership,
                coalesce(sum(fr.amount),0) as total_paid,
                abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0))) as payable
            from students as s
            left join allowed_application as a on s.stud_clg_id = a.application_number
            left join branch as b on b.branch_id = s.branch_id
            left join programm_type as p on p.programm_id = s.programm_id
            left join student_scholership as ss on ss.stud_clg_id = s.stud_clg_id and ss.ay = s.academic_year
            left join (
                select sum(amount) as amount, stud_clg_id, academic_year
                from tbl_fee_receipt
                group by stud_clg_id, academic_year) as fr on fr.stud_clg_id = s.stud_clg_id and fr.academic_year = s.academic_year
            left join (
                select sum(amount) as amount,is_dsa,ay,year_of_admission 
                from tbl_fee_structure group by is_dsa,ay,year_of_admission) as fs on fs.is_dsa = a.is_dsa and s.academic_year = fs.ay and fs.year_of_admission = a.year_of_admission
            where s.uid = ? and s.academic_year = ?
            group by fs.ay ,a.name,b.bname, p.programm_name, a.cat_id,ss.scholership_amount, fr.stud_clg_id
            `,[uid, ay],(err,Details)=>{
                if(err) {
                    res.status(500).json({msg : "Internal Server Error"})
                    console.log(err)
                    return res.end()
                }
                else{
                    if(Details.length > 0)
                    {
                        console.log('called')
                        console.log(Details)
                        res.status(200).json({details : Details[0]})
                        return res.end();
                    }
                    else{
                        res.status(404).json({msg : "Data Not Found!"})
                        return res.end();
                    }
                }
            }
        )
    }
    else{
    connection.query(

        `
        select
            a.name as name,
            b.bname as branch,
            p.programm_name as program,
            a.cat_id as category,
            coalesce(sum(fs.amount),0) as total_fee,
            coalesce(ss.scholership_amount,0) as scholership,
            (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)) as amt_afterscholership,
            coalesce(sum(fr.amount),0) as total_paid,
            abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0))) as payable
        from students as s
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        left join student_scholership as ss on ss.stud_clg_id = s.stud_clg_id and ss.ay = s.academic_year
        left join (
            select sum(amount) as amount, stud_clg_id, academic_year
            from tbl_fee_receipt
            group by stud_clg_id, academic_year) as fr on fr.stud_clg_id = s.stud_clg_id and fr.academic_year = s.academic_year
        left join (
            select sum(amount) as amount,is_dsa,ay,year_of_admission 
            from tbl_fee_structure group by is_dsa,ay,year_of_admission) as fs on fs.is_dsa = a.is_dsa and s.academic_year = fs.ay and fs.year_of_admission = a.year_of_admission
        where s.stud_clg_id = ? and s.academic_year = ?
        group by fs.ay ,a.name,b.bname, p.programm_name, a.cat_id,ss.scholership_amount, fr.stud_clg_id
        `,[clgId, ay],(err,Details)=>{
            if(err) {
                res.status(500).json({msg : "Internal Server Error"})
                console.log(err)
                return res.end()
            }
            else{
                if(Details.length > 0)
                {
                    console.log('called')
                    console.log(Details)
                    res.status(200).json({details : Details[0]})
                    return res.end();
                }
                else{
                    res.status(404).json({msg : "Data Not Found!"})
                    return res.end();
                }
            }
        }
    )}
}


exports.updateReceivedScholership = (req,res)=>{
    const {stud_clg_id, ay, amount} = req.body;
    
    connection.query(`
        insert into tbl_gov_receivalble (stud_clg_id, ay, amount) values (?,?,?)
    `,[stud_clg_id,ay,amount],(err,result)=>{
        if(err){
            res.status(500).json({msg : "Internal Server Error"})
            console.log(err)
            return res.end()
        }
        else{
            res.status(200).json({msg : "Data has been updated!"})
            return res.end();
        }
    })
}