const user = require('../controllers/user_controller');

var express = require('express');
var router = express.Router();

const validator = require('../middlewares/validators/userValidator');

// Authentication Route
router.post('/getUserToken', validator.userValidation, user.userToken)

// Profile Route
router.get('/getUserTruck', user.getUserTrucks)
router.post('/addFavouriteTruck', user.verifyToken, user.addFavouriteTruck)
router.post('/removeFavouriteTruck', user.verifyToken, user.removeFavouriteTruck)
router.get('/getFavouriteTrucks', user.verifyToken, user.getFavouriteTruckList)
router.post('/getTruckDetail', user.verifyToken, user.getTruckDetail)
router.post('/rateTruck', user.verifyToken, user.rateTruck)
router.post('/createEvent', user.verifyToken, validator.eventValidation, user.createPrivateEvent)
router.get('/getReportContent', user.verifyToken, user.reportContent)
router.post('/sendReport', user.verifyToken, user.reportAdmin)
router.get('/getUserEvents', user.verifyToken, user.getUserEvents)
router.post('/updateNotificationData', user.verifyToken, user.userOptOut)
router.get('/getNotificationData', user.verifyToken, user.getNotifiData)
router.get('/getEventTrucks', user.verifyToken, user.getEventTruckList)
router.post('/updateTruckRingtone', user.verifyToken, user.updateTruckRingtone)
router.post('/updateTruckNotification', user.verifyToken, user.updateFavTruckNotification)
router.post('/updateLocation', user.verifyToken, user.updateLocation)
router.post('/getRoute', user.verifyToken, user.getRoute)

module.exports = router;