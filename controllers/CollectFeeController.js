const connection = require("./db");
const { tbl_fee_insert, tbl_head_insert } = require("./onlineTransactionController");

exports.collectFee = async (req, res) => {
    try {
        const { clgId, bankDetails, payment, ay,payable,isFee,amount } = req.body;
        const { mop, bankName, bankBranch, checkDate, micr, code, utr, receiptDate,ddno } = bankDetails;
        let newCheckDate = (checkDate==undefined || checkDate==null || checkDate=='')? null : checkDate;

        console.log(mop)
        
        let amt = 0
        await payment.forEach(e => {
            amt += Number(e.amount);
        });

        const balance_amount= payable - amt;

        console.log(amt);
        console.log(newCheckDate);

        const overall_receipt = [clgId, amt, bankName, bankBranch, newCheckDate, ddno, utr, receiptDate, ay, JSON.stringify(payment),mop,balance_amount];
        
        let headwise = [clgId, bankName, bankBranch, newCheckDate, ddno, utr, receiptDate,ay, mop,balance_amount];

        let ddData = [bankName, bankBranch,micr,code,ddno,newCheckDate, clgId,amt];

        if(parseInt(isFee) == 0){
            await connection.query(
                'SELECT installment_number FROM tbl_fee_receipt WHERE stud_clg_id = ? AND academic_year = ? ORDER BY installment_number DESC',
                [clgId, ay],async (err,installments)=>{
                    if(err) console.log(err);
    
                    const installment = installments.length > 0 ? Number(installments[0].installment_number)+1 : 1;
                    overall_receipt.push(installment);
                    headwise.push(installment);
                    await connection.query(
                        `
                        INSERT INTO tbl_fee_receipt (
                            stud_clg_id, amount, bank_name, bank_branch, check_date, dd_no,  trancation_number, date_of_payment, academic_year, fh_id, mop,balance_amount, installment_number
                        ) VALUES (?)
                        `,
                        [overall_receipt]
                    );
    
                    await payment.forEach(element=>{
                        var temp = [...headwise,element.feeHeads, element.amount, element.quantity]
                        
                        connection.query(`
                            INSERT INTO tbl_fee_head_receipts (
                                stud_clg_id, bank_name, bank_branch, check_date,  dd_no,  trancation_number, date_of_payment, academic_year,  mop,balance_amount, installment_number, fh_id, amount, quantity
                            ) VALUES (?)
                            
                            `,
                            [temp]
                        );
                    })
    
                    if(ddno!='' || ddno!='undefined' || ddno!=undefined)
                    {
                        connection.query(
                            `insert into tbl_dd_info (bank_name, bank_branch, micr, dd_code, dd_number, dd_date, stud_clg_id,amount) values (?)`,
                            [ddData]
                        );
                    }
                }
            )
        res.status(200).json({ msg: "Success" });

        }
        else{
            let updated_amount = Number(amount);
            let balance_amount = payable-updated_amount;
            
           
            await connection.query(
                'SELECT installment_number FROM tbl_fee_receipt WHERE stud_clg_id = ? AND academic_year = ? ORDER BY installment_number DESC',
                [clgId, ay],async (err,installments)=>{
                    if(err) console.log(err);
    
                    const installment = installments.length > 0 ? Number(installments[0].installment_number)+1 : 1;
                    overall_receipt.push(installment);
                    headwise.push(installment);

                    await connection.query(
                        `
                        select 
                            fs.*,
                            coalesce(coalesce(fs.amount,0)-coalesce(fr.paid_amount,0),0) as to_pay,
                            fr.academic_year
                        from tbl_fee_structure as fs
                        left join allowed_application as a  on a.year_of_admission = fs.year_of_admission and a.is_dsa =fs.is_dsa
                        left join (select fh_id, stud_clg_id,academic_year, sum(amount) as paid_amount from tbl_fee_head_receipts group by fh_id, stud_clg_id, academic_year) as fr on a.application_number = fr.stud_clg_id and fs.ay = fr.academic_year and fs.fh_id = fr.fh_id
                        where fs.ay = ? and a.application_number = ? order by fs.priority;
                        `,[ay,clgId],async (err,feeStructure)=>{
                    
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
                                
                                setTimeout(async()=>{
                                    console.log(fh_id);
                                    tbl_fee_insert(clgId,amount,utr,ay,fh_id,balance_amount,installment,mop).then(
                                        tbl_head_insert(clgId,utr,ay,fh_id,balance_amount,installment,mop).then(
                                            e=>{
                                                res.status(200).json({msg:'Success'})
        
                                                res.end();
                                            }
                                        )
                                    )
                                },1000)
                                
                            }
                        }
                    )
                }
            )
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Something went wrong" });
    }
};

exports.allowMultipleInstallment = async(req,res)=>{
    const {stud_clg_id,amount,ay} = req.body;

    connection.query('select * from tbl_multi_installment where stud_clg_id = ? and ay = ?',[stud_clg_id, ay],(err,mult)=>{
        if(err) console.log(err);
        else {
            connection.query(`
                insert into tbl_multi_installment (stud_clg_id, amount, ay) values (?,?,?)
            `,[stud_clg_id,amount,ay],(err,multi)=>{
                if(err) console.log(err);
                res.status(200).json({msg:'Student Allowed!'})
                return res.end();
            })
        }
        
    })

}


exports.allowScholership = async(req,res)=>{
    const {stud_clg_id,amount,ay} = req.body;

    connection.query('select * from student_scholership where stud_clg_id = ? and ay = ?',[stud_clg_id, ay],(err,mult)=>{
        if(err) console.log(err);
        else if(mult.length==0){
            connection.query(`
                insert into student_scholership (stud_clg_id, scholership_amount, ay) values (?,?,?)
            `,[stud_clg_id,amount,ay],(err,multi)=>{
                if(err) console.log(err);
                res.status(200).json({msg:'Student Allowed!'})
                return res.end();
            })
        }
        else{
            connection.query(`
                update student_scholership set scholership_amount = ? where stud_clg_id = ? and ay = ?
            `,[amount, stud_clg_id,ay],(err,multi)=>{
                if(err) console.log(err);
                res.status(200).json({msg:'Student Allowed!'})
                return res.end();
            })
        }
        
    })

}