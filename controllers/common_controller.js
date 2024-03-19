const sequelize = require('../models/index');
const User = require("../models/user")
const vendor = require('../models/vendor')
const truck = require('../models/truck')

const jwt = require('jsonwebtoken')

const response = require('../utils/response')
const language = require('../utils/data.json');
const config = require('../config/otherConfig.json')

const tokenHeaderKey = config.header.token;
const langHeaderKey = config.header.lang_id;
const secretKey = config.header.secret_key;

const refreshToken = async (req, res) => {
    try {
        const tokenHeader = req.header(tokenHeaderKey)
        const lang_id = req.header(langHeaderKey)
        const { role_id, id } = req.body;

        let result;

        if (!role_id || !id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const user = verifyTokenMsg(tokenHeader);

        if (user == "Invalid Token") {
            const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24)
            if (role_id == 2) {
                let userExists = await User.findOne({ where: { user_id: id } })
                if (!userExists) {
                    return response.sendBadRequestResponse(res, language.no_user[lang_id])
                }
                payload = {
                    user_id: id,
                    exp: exp
                };
            } else if (role_id == 3) {
                result = await vendor.findOne({ where: { vendor_id: id } })
                if (!result) {
                    return response.sendBadRequestResponse(res, language.no_vendor[lang_id])
                }
                payload = {
                    email: result.email,
                    vendor_id: result.vendor_id,
                    exp: exp
                }
            } else {
                result = await truck.findOne({ where: { truck_id: id } })
                if (!result) {
                    return response.sendBadRequestResponse(res, language.no_truck[lang_id])
                }
                payload = {
                    username: result.username,
                    truck_id: result.truck_id,
                    exp: exp
                };
            }

            var token = jwt.sign(payload, secretKey, {
                algorithm: config.common.algo
            })

            return response.sendSuccessResponseMobile(res, [{ token: token, id: id, role_id: role_id }], language.success[lang_id])
        }
        return response.sendSuccessResponseMobile(res, [{ token: tokenHeader, id: id, role_id: role_id }], language.success[lang_id])
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getFcmToken = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { role_id, id, fcm_token } = req.body;

        if (!role_id || !id || !fcm_token) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        if (role_id == 2) {
            let userExists = await User.findOne({ where: { user_id: id } })
            if (!userExists) {
                return response.sendBadRequestResponse(res, language.no_user[lang_id])
            }
            await User.update({ fcm_token: fcm_token }, {
                where: {
                    user_id: id
                }
            })
            let truckData = await truck.findOne({ where: { fcm_token: fcm_token}})
            if(truckData){
                await truck.update({fcm_token: ""}, { where: {
                    fcm_token: fcm_token
                }})
            }
        } else if (role_id == 3) {
            let vendorExists = await vendor.findOne({ where: { vendor_id: id } })
            if (!vendorExists) {
                return response.sendBadRequestResponse(res, language.no_vendor[lang_id])
            }
            let truckResult = await truck.findOne({ where: { is_primary: true, vendor_id: id } })
            await truck.update({ fcm_token: fcm_token }, {
                where: {
                    truck_id: truckResult.truck_id
                }
            })
            let userData = await User.findOne({ where: { fcm_token: fcm_token}})
            if(userData){ 
                await User.update({fcm_token: ""}, { where: { fcm_token: fcm_token }})
            }
        } else {
            let truckExists = await truck.findOne({ where: { truck_id: id } })
            if (!truckExists) {
                return response.sendBadRequestResponse(res, language.no_truck[lang_id])
            }
            await truck.update({ fcm_token: fcm_token }, {
                where: {
                    truck_id: id
                }
            })
            let userData = await User.findOne({ where: { fcm_token: fcm_token}})
            if(userData){ 
                await User.update({fcm_token: ""}, { where: { fcm_token: fcm_token }})
            }
        }

        return response.sendSuccessResponseMobile(res, [], language.success[lang_id])
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const verifyTokenMsg = (token) => {
    if (!token) {
        throw new Error("Token is missing");
    }

    try {
        const user = jwt.verify(token, secretKey);
        return user;
    } catch (err) {
        return "Invalid Token"
    }
};

const verifyToken = async (req, res, next) => {
    const lang_id = req.header(langHeaderKey)
    const token = req.header(tokenHeaderKey)

    if (token == null) return res.status(400).send({ message: language.token_missing[lang_id] })

    jwt.verify(token, secretKey, async (err, user) => {
        if (err) return res.status(400).send({ message: language.invalid_token[lang_id] })
        req.user = user

        if (user.vendor_id) {
            let vendorData = await vendor.findOne({ where: { vendor_id: user.vendor_id } })

            if(!vendorData){
                return res.status(400).send({ message: language.invalid_token[lang_id] })
            }

            if (vendorData.is_deleted) {
                return res.status(400).send({ message: language.user_deleted[lang_id] })
            } else if (vendorData.is_blocked) {
                return res.status(400).send({ message: language.user_deactivate[lang_id] })
            } else if (vendorData.is_suspended) {
                return res.status(400).send({ message: language.user_suspend[lang_id], reason: vendorData.suspend_msg })
            }
        }

        if (user.truck_id) {
            let truckData = await truck.findOne({ where: { truck_id: user.truck_id } })

            if(!truckData){
                return res.status(400).send({ message: language.invalid_token[lang_id] })
            }

            if (truckData.is_deleted) {
                return res.status(400).send({ message: language.user_deleted[lang_id] })
            } else if (truckData.is_blocked) {
                return res.status(400).send({ message: language.user_deactivate[lang_id] })
            } else if (truckData.is_suspended) {
                return res.status(400).send({ message: language.user_suspend[lang_id], reason: truckData.suspend_msg })
            }
        }

        next()
    })
}

module.exports = {
    refreshToken,
    verifyTokenMsg,
    getFcmToken,
    verifyToken,
}