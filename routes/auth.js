const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const { fetchAllFh, fetchAllProgram, addFeeHead, mapcattofeehead } = require('../controllers/feeHeadController');
const { getFeeStructure, updateReceivedScholership } = require('../controllers/feeStructureController');
const { collectFee, allowMultipleInstallment, allowScholership } = require('../controllers/CollectFeeController');
const { getGeneralReceipt, fetchReceiptsId } = require('../controllers/receiptController');
const { fetchDDData, AddStatement, StatementDates, printStatement } = require('../controllers/bankStatementController');
const { webhook } = require('../controllers/onlineTransactionController');
const { getHeadwiseReport, getBranch, getBalReport, studentWiseReciept } = require('../controllers/reportController');
const { overview, headwiseOverview } = require('../controllers/dashboardController');
const { fetchAllFaculty, getSalaryData, salaryFormData, fetchAllPercenatge, frtchAllFixedComponents, updatePercentage, updateFixedComponents, generateSalarySlip, getSalarySlips, getSalarySlipsIndividual, addOtherDeductions, deleteOtherDeductions, getOtherDeductions } = require('../controllers/SalaryFormController');

router.post('/login', authController.login);
router.get('/profile', verifyToken, userController.getUserByEmail);
router.get('/single_fee_amounts', verifyToken, userController.getSingleFeeHeadsAmount);
router.get('/fetchAllFh', verifyToken, fetchAllFh);
router.get('/fetchAllProgram', verifyToken, fetchAllProgram);
router.post('/addFeeHead', verifyToken, addFeeHead);
router.post('/mapcattofeehead', verifyToken, mapcattofeehead);
router.post('/getFeeStructure',  getFeeStructure);
router.post('/collectFee', verifyToken, collectFee);
router.post('/getGeneralReceipt', verifyToken, getGeneralReceipt);
router.post('/fetchReceiptsId', verifyToken, fetchReceiptsId);
router.get('/fetchDDData', verifyToken, fetchDDData);
router.post('/AddStatement', verifyToken, AddStatement);
router.get('/StatementDates', verifyToken, StatementDates);
router.post('/printStatement', verifyToken, printStatement);
router.post('/webhook', verifyToken, webhook);
router.post('/getHeadwiseReport', verifyToken, getHeadwiseReport);
router.post('/getBalReport', verifyToken, getBalReport);
router.get('/getBranch', verifyToken, getBranch);
router.post('/allowMultipleInstallment', verifyToken, allowMultipleInstallment);
router.post('/allowScholership', verifyToken, allowScholership);
router.get('/overview', verifyToken, overview);
router.get('/headwiseOverview', verifyToken, headwiseOverview);
router.get('/fetchAllFaculty', verifyToken, fetchAllFaculty);
router.post('/getSalaryData', verifyToken, getSalaryData);
router.post('/salaryFormData', verifyToken, salaryFormData);
router.get('/fetchAllPercenatge', verifyToken, fetchAllPercenatge);
router.get('/frtchAllFixedComponents', verifyToken, frtchAllFixedComponents);
router.post('/updatePercentage', verifyToken, updatePercentage);
router.post('/updateFixedComponents', verifyToken, updateFixedComponents);
router.post('/generateSalarySlip', verifyToken, generateSalarySlip);
router.post('/getSalarySlips', verifyToken, getSalarySlips);
router.post('/updateReceivedScholership', verifyToken, updateReceivedScholership);
router.post('/getSalarySlipsIndividual', verifyToken, getSalarySlipsIndividual);
router.post('/addOtherDeductions', verifyToken, addOtherDeductions);
router.post('/deleteOtherDeductions', verifyToken, deleteOtherDeductions);
router.post('/getOtherDeductions', verifyToken, getOtherDeductions);
router.post('/studentWiseReciept', verifyToken, studentWiseReciept);



module.exports = router;