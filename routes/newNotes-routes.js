const express = require('express');
const router = express.Router();

const {
  getElectricity,
  postElectricity,
  deleteElectricity,
} = require('../controllers/newNoteBooks/electricity-controllers');

const {
  getEmployment,
  postEmployment,
  deleteEmployment,
  fixEmploymentBalance,
} = require('../controllers/newNoteBooks/employment-controllers');

const {
  getForks,
  postForks,
  deleteForks,
} = require('../controllers/newNoteBooks/forks-controllers');

const {
  getGas,
  postGas,
  deleteGas,
} = require('../controllers/newNoteBooks/gas-controllers');

const {
  getHospitality,
  postHospitality,
  deleteHospitality,
} = require('../controllers/newNoteBooks/hospitality-controllers');

const {
  getFixedSalary,
  postFixedSalary,
  deleteFixedSalary,
  fixFixedSalaryBalance,
} = require('../controllers/newNoteBooks/fixedSalary-controllers');

const {
  getRequirements,
  postRequirements,
  deleteRequirements,
  fixRequirementsBalance,
} = require('../controllers/newNoteBooks/requirements-controllers');

const {
  getWater,
  postWater,
  deleteWater,
  fixWaterBalance,
} = require('../controllers/newNoteBooks/water-controllers');

// const { getLoans, postLoan, deleteLoan } = require('../controllers/loan');

router.get('/electricity', getElectricity);
router.post('/electricity', postElectricity);
router.delete('/electricity/:_id', deleteElectricity);

router.get('/employment', getEmployment);
router.get('/employment/fix', fixEmploymentBalance);
router.post('/employment', postEmployment);
router.delete('/employment/:_id', deleteEmployment);

router.get('/fixed-salary', getFixedSalary);
router.get('/fixed-salary/fix', fixFixedSalaryBalance);
router.post('/fixed-salary', postFixedSalary);
router.delete('/fixed-salary/:_id', deleteFixedSalary);

router.get('/forks', getForks);
router.post('/forks', postForks);
router.delete('/forks/:_id', deleteForks);

router.get('/gas', getGas);
router.post('/gas', postGas);
router.delete('/gas/:_id', deleteGas);

router.get('/hospitality', getHospitality);
router.post('/hospitality', postHospitality);
router.delete('/hospitality/:_id', deleteHospitality);

router.get('/requirements', getRequirements);
router.get('/requirements/fix', fixRequirementsBalance);
router.post('/requirements', postRequirements);
router.delete('/requirements/:_id', deleteRequirements);

router.get('/water', getWater);
router.get('/water/fix', fixWaterBalance);
router.post('/water', postWater);
router.delete('/water/:_id', deleteWater);

// router.get('/loan', getLoans);
// router.post('/loan', postLoan);
// router.delete('/loan/:_id', deleteLoan);

module.exports = router;
