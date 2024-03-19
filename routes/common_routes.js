const common = require('../controllers/common_controller');

var express = require('express');
var router = express.Router();

router.post('/refreshToken', common.refreshToken)
router.post('/updateFcmToken', common.verifyToken, common.getFcmToken)

module.exports = router;