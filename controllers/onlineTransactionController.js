const connection = require("./db")

exports.getFeeDetails = async(req,res) =>{
    const {clgId, ay} = req.body;

    console.log(ay)
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
            abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0))) as balance_amount,
            coalesce(mi.amount,abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)))) as payable
        from students as s
        left join allowed_application as a on s.stud_clg_id = a.application_number
        left join branch as b on b.branch_id = s.branch_id
        left join programm_type as p on p.programm_id = s.programm_id
        left join student_scholership as ss on ss.stud_clg_id = s.stud_clg_id and ss.ay = s.academic_year
        left join tbl_multi_installment as mi on mi.stud_clg_id = s.stud_clg_id and mi.ay = s.academic_year and mi.status = 0
        left join (
            select sum(amount) as amount, stud_clg_id, academic_year
            from tbl_fee_receipt
            group by stud_clg_id, academic_year) as fr on fr.stud_clg_id = s.stud_clg_id and fr.academic_year = s.academic_year
        left join (
            select sum(amount) as amount,is_dsa,ay,year_of_admission
            from tbl_fee_structure group by is_dsa,ay,year_of_admission) as fs on fs.is_dsa = a.is_dsa and s.academic_year = fs.ay and fs.year_of_admission = a.year_of_admission
        where s.stud_clg_id = ? and s.academic_year = ?
        group by fs.ay ,a.name,b.bname, p.programm_name, a.cat_id,ss.scholership_amount, fr.stud_clg_id, mi.amount
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
    )
}

exports.webhook = async(req,res)=>{
    const { addedon, txnid, bank_ref_num, amount, firstname, productinfo, status, udf1, udf2, udf3, } = req.body;
    
    console.log(udf1,udf2,status,amount)
    

    if(status=='success'){
        connection.query(
            'select * from tbl_fee_receipt where transaction_number = ?'
            ,[txnid]
            ,async(err,tr)=>{
                if(err) console.log(err);
                else{
                    if(tr.length>1)
                    {
                        res.status(409).json({msg:'duplicate transaction'});
                        return res.end()
                    }
                    else{
                        let updated_amount = Number(amount);

                        connection.query(
                            `
                            select
                                a.name as name,
                                b.bname as branch,
                                p.programm_name as program,
                                a.cat_id as category,
                                fr.installment,
                                coalesce(sum(fs.amount),0) as total_fee,
                                coalesce(ss.scholership_amount,0) as scholership,
                                (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)) as amt_afterscholership,
                                coalesce(sum(fr.amount),0) as total_paid,
                                abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0))) as balance_amount,
                                coalesce(mi.amount,abs(coalesce(sum(fr.amount),0) - (coalesce(sum(fs.amount),0) - coalesce(ss.scholership_amount,0)))) as payable
                            from students as s
                            left join allowed_application as a on s.stud_clg_id = a.application_number
                            left join branch as b on b.branch_id = s.branch_id
                            left join programm_type as p on p.programm_id = s.programm_id
                            left join student_scholership as ss on ss.stud_clg_id = s.stud_clg_id and ss.ay = s.academic_year
                            left join tbl_multi_installment as mi on mi.stud_clg_id = s.stud_clg_id and mi.ay = s.academic_year and mi.status = 0
                            left join (
                                select sum(amount) as amount, stud_clg_id, academic_year, count(*) as installment
                                from tbl_fee_receipt
                                group by stud_clg_id, academic_year) as fr on fr.stud_clg_id = s.stud_clg_id and fr.academic_year = s.academic_year
                            left join (
                                select sum(amount) as amount,is_dsa,ay,year_of_admission
                                from tbl_fee_structure group by is_dsa,ay,year_of_admission) as fs on fs.is_dsa = a.is_dsa and s.academic_year = fs.ay and fs.year_of_admission = a.year_of_admission
                            where s.stud_clg_id = ? and s.academic_year = ?
                            group by fs.ay ,a.name,b.bname, p.programm_name, a.cat_id,ss.scholership_amount, fr.stud_clg_id, mi.amount, fr.installment
                            `,[udf1, udf2],async(err,Details)=>{
                                if(err) {
                                    res.status(500).json({msg : "Internal Server Error"})
                                    console.log(err)
                                    return res.end()
                                }
                                else{
                                    if(Details.length > 0)
                                    {
                                        let updated_amount = Number(amount);
                                        let new_balance = Number(Details[0].balance_amount)-Number(amount);
                                        let installment = Number(Details[0].installment)+1
                                        await connection.query(
                                            `
                                            select 
                                                fs.*,
                                                coalesce(coalesce(fs.amount,0)-coalesce(fr.paid_amount,0),0) as to_pay,
                                                fr.academic_year
                                            from tbl_fee_structure as fs
                                            left join allowed_application as a  on a.year_of_admission = fs.year_of_admission and a.is_dsa =fs.is_dsa
                                            left join (select fh_id, stud_clg_id,academic_year, sum(amount) as paid_amount from tbl_fee_head_receipts group by fh_id, stud_clg_id, academic_year) as fr on a.application_number = fr.stud_clg_id and fs.ay = fr.academic_year and fs.fh_id = fr.fh_id
                                            where fs.ay = '2023-24' and a.application_number = 'vu1f1920106' order by fs.priority;
                                            `,[udf2,udf1],async (err,feeStructure)=>{
                                        
                                                let fh_id = []

                                                if(err) console.log(err);
                                                else{
                                                    await feeStructure.forEach(element => {
                                                        if(updated_amount>0)
                                                        {
                                                            
                                                            tmp_amt = updated_amount-Number(element.to_pay) <= 0 ? updated_amount : Number(element.to_pay)
            
                                                            temp = {'feeHeads':element.fh_id, 'amount':tmp_amt}
                                
                                                            fh_id = [...fh_id, temp]
                                
                                                            updated_amount = updated_amount-tmp_amt;
                                                        }
                                                    });
                                                    
                                                    setTimeout(()=>{
                                                        this.tbl_fee_insert(udf1,amount,txnid,udf2,fh_id,new_balance,installment,"Payment Gateway").then(
                                                            r=>{
                                                                tbl_head_insert(udf1,txnid,udf2,fh_id,new_balance,installment,"Payment Gateway").then(
                                                                    r=>{
                                                                        res.status(200).json({msg:'Success'})

                                                                        res.end();
                                                                    }
                                                                )
                                                            }
                                                        )
                                                    },1000)
                                                    
                                                }
                                            }
                                        )
                                    }
                                    else{
                                        res.status(400).json({msg:'err'})
                                    }
                                }
                            }
                        )    
                    }
                }
            }
        )
    }
    
}

exports.tbl_fee_insert = async(clgId, amt,utr,ay,payment, balance_amount,installment,mop)=>{
    let overall_receipt = [clgId, amt,utr,ay,JSON.stringify(payment),mop,balance_amount,installment]

    try {
        await connection.query(
            `
            INSERT INTO tbl_fee_receipt (
                stud_clg_id, amount, trancation_number, academic_year, fh_id, mop,balance_amount, installment_number, date_of_payment
            ) VALUES (?,now())
            `,
            [overall_receipt],(err,done)=>{
            }
        );
    }
    catch{
        console.log(err)
    }
    
}

exports.tbl_head_insert = async(clgId, utr,ay,payment, balance_amount,installment,mop)=>{

    let headwise = [clgId,utr, ay, mop,balance_amount, installment];

    try{
        await payment.forEach(element=>{
            var temp = [...headwise,element.feeHeads, element.amount, element.quantity]
            
            connection.query(`
                INSERT INTO tbl_fee_head_receipts (
                    stud_clg_id, trancation_number, academic_year,  mop,balance_amount, installment_number, fh_id, amount, quantity, date_of_payment
                ) VALUES (?,now())
                
                `,
                [temp]
            );
        })

        return true;
    }
    catch{
        return false;
    }
}