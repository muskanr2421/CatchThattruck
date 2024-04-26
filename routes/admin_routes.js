const vendor = require('../controllers/vendor_controller');
const admin = require('../controllers/admin_controller')

var express = require('express');
var router = express.Router();

var validator = require('../middlewares/validators/userValidator');

// Authentication Route
// router.post('/auth/signup',validator.addNewUserInput, vendor.signUp)
router.post('/auth/login',validator.adminLoginValidation, admin.adminLogin)
router.post('/auth/forgotPassword', vendor.forgotPassword)
router.post('/auth/verifyResetPassword', vendor.verifyResetPasswordOtp)
router.post('/auth/resetPassword', vendor.resetPassword)

// Profile Route
router.post('/activateTruck', admin.verifyToken, admin.activateTruck)
router.post('/deactivateTruck', admin.verifyToken, admin.deactivateTruck)
router.post('/suspendTruck', admin.verifyToken, admin.suspendTruck)
router.post('/unsuspendTruck', admin.verifyToken, admin.unsuspendTruck)
router.post('/deleteTruck', admin.verifyToken, admin.deleteTruck)
router.get('/getAllVendors', admin.verifyToken, admin.getAllVendors)
router.get("/getReportContent", admin.verifyToken, admin.reportContent)
router.get('/getQueryContent', admin.verifyToken, admin.contactContent)
router.get('/getReportDetails', admin.verifyToken, admin.getReportDetails)
router.get('/getQueryDetails', admin.verifyToken, admin.getContactDetails)
router.post('/getRefreshToken', admin.refreshToken)
router.post('/uploadAvatar', admin.verifyToken, admin.uploadAvatar)
router.post('/deleteAvatar', admin.verifyToken, admin.deleteAvatar)
router.get('/getAvatarImages', admin.verifyToken, admin.getAvatarList)
router.get('/getImageStatusList', admin.verifyToken, admin.getImageStatusList)
router.post('/updateImageStatus', admin.verifyToken, admin.updateImageStatus)
router.post('/uploadAvatarUpdated', admin.verifyToken, function(req, res, next) {
    admin.uploadImg.single('avatar')(req, res, function(err) {
        if (err) {
            console.error(err);
            return response.sendBadRequestResponse(res, err.message);
        }
        next();
    });
}, admin.uploadAvatarUpdated)

module.exports = router;