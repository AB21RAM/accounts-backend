const connection = require("./db")

exports.overview=(req,res)=>{
    let {ay} = req.body;

    if(!ay){
        ay = 1;
    }

    connection.query('select * from academic_year where academic_id = ?',[ay],(err,acadname)=>{
        if(err) console.log(err)
        else{
         let ayname = acadname[0].academic_name;
         connection.query( `
        select 
            sum(total_paid) as collection,
            sum(coalesce(total_fee,0)) as total,
            abs(coalesce(sum(coalesce(total_fee,0)) - sum(total_paid) , 0)) as balance
        from (
         select
            a.name as name,
            b.bname as branch,
            p.programm_name as program,
            a.cat_id as category,
            coalesce(sum(fs.amount),0) as total_fee,
            coalesce(ss.scholership_amount,0) as scholership,
            (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)) as amt_afterscholership,
            coalesce(sum(fr.amount),0) as total_paid,
            fs.ay
        from students as s
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        left join student_scholership as ss on ss.stud_clg_id = s.stud_clg_id and ss.ay = s.academic_year
        left join (
            select sum(amount) as amount, stud_clg_id, academic_year
            from tbl_fee_head_receipts
            where fh_id in (1,2,3)
            group by stud_clg_id, academic_year ) as fr on fr.stud_clg_id = s.stud_clg_id and fr.academic_year = s.academic_year
        left join (
            select sum(amount) as amount,is_dsa,ay,year_of_admission 
            from tbl_fee_structure group by is_dsa,ay,year_of_admission) as fs on fs.is_dsa = a.is_dsa and s.academic_year = fs.ay and fs.year_of_admission = a.year_of_admission
        where s.academic_year = ?
        group by fs.ay ,a.name,b.bname, p.programm_name, a.cat_id,ss.scholership_amount, fr.stud_clg_id) as a
        
         `,[ayname],(err,collection)=>{
            if(err) console.log(err);
            else{
               
                res.status(200).json({collection:collection[0]['collection'],total:collection[0].total, balance:collection[0].balance});
                return res.end()
            }
        }) 
        }
    })
    
}

exports.headwiseOverview=(req,res)=>{
    let {ay,fh_id} = req.query;

    console.log(ay,fh_id);
    if(!ay || ay=='undefined'){
        ay = 1;
    }
    if(!fh_id)
    {
        fh_id=1;
    }

    connection.query('select * from academic_year where academic_id = ?',[ay],(err,acadname)=>{
        if(err) console.log(err)
        else{
         let ayname = acadname[0].academic_name;
         connection.query( `
         select 
         sum(amount) as total, 
         sum(amt) as total_paid, 
         sum(amount)- sum(coalesce(amt,0)) as balance
     from
     (select 
         s.stud_clg_id, fs.fh_id as fee, amount, fr.fh_id, amt
     from allowed_application as a
     left join students as s 
             on s.stud_clg_id = a.application_number
     left join tbl_fee_structure  as fs
             on fs.ay = s.academic_year 
             and a.year_of_admission = fs.year_of_admission 
             and a.is_dsa = fs.is_dsa
     left join (select 
                     stud_clg_id,fh_id,sum(amount) as amt 
                 from tbl_fee_head_receipts 
                 group by stud_clg_id,fh_id) as fr on fr.stud_clg_id = a.application_number and fr.fh_id = fs.fh_id
                 where s.academic_year = ?
     ) as b
     where fh_id = ?
         `,[ayname,fh_id],(err,collection)=>{
            if(err) console.log(err);
            else{
               
                res.status(200).json({collection:collection[0]['total_paid'],total:collection[0].total, balance:collection[0].balance});
                return res.end()
            }
        }) 
        }
    })
    
}