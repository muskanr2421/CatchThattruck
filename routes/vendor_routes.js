const vendor = require('../controllers/vendor_controller');

const express = require('express');
const router = express.Router();

const validator = require('../middlewares/validators/userValidator');

// Authentication Routes
router.post('/auth/signup', validator.addNewUserInput, vendor.signUp);
router.post('/auth/login', validator.loginValidation, vendor.login);
router.get('/auth/getCities', vendor.getCities);
router.get('/auth/getCountryCodes', vendor.getCountryCodes);
router.post('/auth/forgotPassword', vendor.forgotPassword);
router.post('/auth/verifyResetPassword', vendor.verifyResetPasswordOtp);
router.post('/auth/resetPassword', vendor.resetPassword);
router.post('/auth/forgotUsername', vendor.forgotUsername);
router.get('/auth/locationInfoAPI', vendor.getUpdatedCity);

// Profile Routes
router.post('/editDetails', vendor.verifyToken, validator.editDetailsValidation, vendor.editDetails);
router.get('/verify', vendor.verifyEmail);
router.post('/changePassword', vendor.verifyToken, vendor.changePassword);
router.post('/addTruck', vendor.verifyToken, validator.truckValidation, vendor.addTruck);
router.post('/editTruckDetails', vendor.verifyToken, validator.truckValidation, vendor.editTruck)
router.post('/deleteTruck', vendor.verifyToken, vendor.deleteTruck)
router.get('/getVendorTruck', vendor.verifyToken, vendor.getVendorTruck)
router.get('/getContent', vendor.verifyToken, vendor.getTranslations)
router.get('/getContactContent', vendor.verifyToken, vendor.contactContent)
router.post('/sendFeedback', vendor.verifyToken, vendor.contactAdmin)
router.post('/getVendorEvents', vendor.verifyToken, vendor.getEvents)
router.post('/createRoute', vendor.verifyToken, validator.routeValidation, vendor.createRoute)
router.post('/updateRoute', vendor.verifyToken, validator.updateRouteValidation, vendor.updateRoute)
router.post('/getRoute', vendor.verifyToken, vendor.getRoute)
router.post('/deleteRoute', vendor.verifyToken, vendor.deleteRoute)
router.post('/vendorOptOut', vendor.verifyToken, vendor.vendorOptOut)
router.get('/getTruckAvatar', vendor.verifyToken, vendor.getTruckAvatar)
router.post('/updateAlertRadius', vendor.verifyToken, vendor.updateAlertRadius)
router.post('/updateUTurn', vendor.verifyToken, vendor.updateUTurn)
router.post('/getDetails', vendor.verifyToken, vendor.getDetails)

module.exports = router;
