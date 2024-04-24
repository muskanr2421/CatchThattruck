const sequelize = require('../models/index')
const User = require("../models/user")
const truck = require("../models/truck")
const vendor = require("../models/vendor")
const favTruck = require('../models/favourite_truck')
const rate_truck = require('../models/rate_truck')
const privateEvent = require('../models/private_events')
const report = require('../models/report')
const report_data = require('../models/report_data')
const avatar = require('../models/avatar')
const rington = require('../models/ringtone')
const truckRingtone = require('../models/truck_ringtone')
const route = require("../models/route")

const response = require('../utils/response')
const language = require('../utils/data.json');
const config = require('../config/otherConfig.json')
const middleware = require('../common/Utility')

const jwt = require('jsonwebtoken');
const { where } = require('sequelize');

const secretKey = config.header.secret_key;
const tokenHeaderKey = config.header.token;
const langHeaderKey = config.header.lang_id;

const userToken = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { device_id, lat, long } = req.body;

        if (!device_id || !lat || !long) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let result = await User.findOne({
            where: {
                device_id: device_id
            }
        })

        if (!result) {
            result = await User.create({
                device_id: device_id,
                lat: lat,
                long: long
            });
        } else {
            await User.update({
                lat: lat,
                long: long
            }, { where: { device_id: device_id } });
        }

        const payload = {
            user_id: result.user_id,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // expires in 1 day
        };

        var token = jwt.sign(payload, secretKey, {
            algorithm: config.common.algo
        })

        return response.sendSuccessResponseMobile(res, [{ token: token, user_id: result.user_id, role_id: 2 }], language.success[lang_id])
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const updateLocation = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { lat, long } = req.body;
        const { user_id } = req.user;

        if (!lat || !long) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let result = await User.findOne({
            where: {
                user_id: user_id
            }
        })

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_user[lang_id])
        }

        await User.update({
            lat: lat,
            long: long
        }, { where: { user_id: user_id } });

        return response.sendSuccessResponseMobile(res, [], language.location_update[lang_id])
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getUserTrucks = async (req, res) => {
    try {
        const user_id = 26;
        const lang_id = req.header(langHeaderKey)

        const userLat = "22.736767113404927";
        const userLong = "75.9066966526162";
        const radius = 20; // 20km radius

        const query = `SELECT truck_id, truck_name, username, lat, \`long\`, avatar_id, avatar_approved, avatar_url FROM truck HAVING ${radius} >= (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(lat)) * COS(RADIANS(\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(lat))))`;
        sequelize.query(query, {
            replacements: { userLat, userLong },
            type: sequelize.QueryTypes.SELECT,
        })
            .then(async trucks => {

                let favTrucks = await favTruck.findAll({ where: { user_id: user_id } })
                const favTruckIds = favTrucks.map(favTruck => favTruck.truck_id);

                for (const truck of trucks) {
                    if (favTruckIds.includes(truck.truck_id)) {
                        truck.is_fav = true;
                    } else {
                        truck.is_fav = false;
                    }

                    const [userRating, rateDetail, reportData, avatarData] = await Promise.all([
                        rate_truck.findOne({
                            attributes: ['star_count'],
                            where: { user_id: user_id, truck_id: truck.truck_id }
                        }),
                        rate_truck.findAll({ where: { truck_id: truck.truck_id } }),
                        report_data.findOne({ where: { user_id: user_id, truck_id: truck.truck_id } }),
                        avatar.findOne({
                            attributes: ['thumbnail', 'image_url'],
                            where: { avatar_id: truck.avatar_id }
                        })
                    ]);

                    const countOfResult = rateDetail.length;

                    let totalRating = 0;
                    for (let i = 0; i < rateDetail.length; i++) {
                        totalRating += rateDetail[i].star_count;
                    }

                    const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;

                    truck.average_rating = parseFloat(averageRating.toFixed(2));

                    truck.user_rating = userRating ? userRating.star_count : 0;

                    if (reportData) {
                        truck.report_id = reportData.msg_id;
                    } else {
                        truck.report_id = 0;
                    }

                    if(truck.avatar_approved == 2){
                        truck.image_url = truck.avatar_url;
                    } else{
                        truck.image_url = avatarData.image_url;
                    }
                    truck.thumbnail = avatarData.thumbnail
                    // truck.image_url = avatarData.image_url
                }

                res.send(trucks)
            })

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const addFavouriteTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { user_id } = req.user;
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const truckExists = await truck.findOne({ where: { truck_id: truck_id } })
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        const favTruckExists = await favTruck.findOne({ where: { truck_id: truck_id, user_id: user_id } });
        if (favTruckExists) {
            return response.sendBadRequestResponse(res, language.truck_already_fav[lang_id])
        }

        await favTruck.create({ truck_id: truck_id, user_id: user_id })
        return response.sendSuccessResponseMobile(res, [], language.fav_add[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const removeFavouriteTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { user_id } = req.user;
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const truckExists = await favTruck.findOne({ where: { truck_id: truck_id, user_id: user_id } });
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        await favTruck.destroy({ where: { truck_id: truck_id, user_id: user_id } })
        return response.sendSuccessResponseMobile(res, [], language.fav_remove[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getFavouriteTruckList = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { user_id } = req.user;

        let userData = await User.findOne({ where: { user_id: user_id } })
        const userLat = userData.lat;
        const userLong = userData.long;

        const radius = 20; // 20km radius
        var truckIDs;

        // const query = `SELECT truck_id, truck_name, username, lat, \`long\`, avatar_id, vendor_id, avatar_approved, avatar_url FROM truck HAVING ${radius} >= (6371 * ACOS(COS(RADIANS(:userLat)) * COS(RADIANS(lat)) * COS(RADIANS(\`long\`) - RADIANS(:userLong)) + SIN(RADIANS(:userLat)) * SIN(RADIANS(lat))))`;
        // sequelize.query(query, {
        //     replacements: { userLat, userLong },
        //     type: sequelize.QueryTypes.SELECT,
        // })
        //     .then(async trucks => {
        //         truckIDs = trucks.map(truck => truck.truck_id);
        //     })

        let favTrucks = await favTruck.findAll({
            where: { user_id: user_id },
            include: [
                {
                    model: truck,
                    on: {
                        truck_id: sequelize.where(sequelize.col('truck.truck_id'), '=', sequelize.col('favourite_truck.truck_id'))
                    },
                }
            ],
        });

        const formattedData = await Promise.all(favTrucks.map(async (item) => {
            const truck = item.truck;

            const [userRating, rateDetail, reportData, avatarData, truckRingtoneData, userData, vendorData] = await Promise.all([
                rate_truck.findOne({
                    attributes: ['star_count'],
                    where: { user_id: user_id, truck_id: truck.truck_id }
                }),
                rate_truck.findAll({ where: { truck_id: truck.truck_id } }),
                report_data.findOne({ where: { user_id: user_id, truck_id: truck.truck_id } }),
                avatar.findOne({
                    attributes: ['thumbnail', 'image_url'],
                    where: { avatar_id: truck.avatar_id }
                }),
                truckRingtone.findOne({
                    attributes: ['ringtone_id'],
                    where: { truck_id: truck.truck_id, user_id: user_id }
                }),
                User.findOne({ attributes: ['ringtone_id'], where: { user_id: user_id } }),
                vendor.findOne({ attributes: ['company_name'], where: { vendor_id: truck.vendor_id } })
            ]);

            const countOfResult = rateDetail.length;

            let totalRating = 0;
            for (let i = 0; i < rateDetail.length; i++) {
                totalRating += rateDetail[i].star_count;
            }

            let truckRing;
            if (truckRingtoneData) {
                truckRing = await rington.findOne({ where: { ringtone_id: truckRingtoneData.ringtone_id } })
            } else {
                truckRing = await rington.findOne({ where: { ringtone_id: userData.ringtone_id } })
            }

            const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;

            const distance = calculateDistance(truck.lat, truck.long, userLat, userLong);
            const in_proximity = distance <= 20;

            let off_duty;
            if(truck.is_online){
                off_duty = true;
            } else{
                off_duty = false;
            }

            // for (const truckID of truckIDs) {
            //     if (truckID === truck.truck_id) {
            //         off_duty = false; // If a matching truck ID is found, the truck is not off duty
            //         break;
            //     }
            // }

            var imageUrl;
            if(truck.avatar_approved == 2){
                imageUrl = truck.avatar_url;
            } else{
                imageUrl = avatarData.image_url;
            }

            return {
                truck_id: truck.truck_id,
                truck_name: truck.truck_name,
                username: truck.username,
                company_name: vendorData.company_name,
                avatar_id: truck.avatar_id,
                average_rating: parseFloat(averageRating.toFixed(2)),
                user_rating: userRating ? userRating.star_count : 0,
                report_id: reportData ? reportData.msg_id : 0,
                thumbnail: avatarData.thumbnail,
                image_url: imageUrl,
                ringtone_id: truckRingtoneData ? truckRingtoneData.ringtone_id : userData.ringtone_id,
                ringtone_name: truckRing[lang_id],
                notifi: item.notifi,
                in_proximity: in_proximity,
                off_duty: off_duty
            };

        }));

        return response.sendSuccessResponseMobile(res, formattedData, language.fav_list[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Convert degrees to radians
    const toRadians = (deg) => deg * Math.PI / 180;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    // Haversine formula
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const radius = 6371000; // Radius of the Earth in meters
    const distance = radius * c;
    return distance;
}

const updateTruckRingtone = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { truck_id, ringtone_id } = req.body;
        console.log(user_id)

        if (!truck_id || !ringtone_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckExists = await favTruck.findOne({ where: { truck_id: truck_id, user_id: user_id } })
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_fav_truck[lang_id])
        }

        let result = await truckRingtone.findOne({
            where: {
                truck_id: truck_id,
                user_id: user_id
            }
        })

        if (result) {
            await truckRingtone.update({ ringtone_id }, {
                where: { truck_id: truck_id, user_id: user_id }
            })
        } else {
            await truckRingtone.create({ ringtone_id, truck_id, user_id })
        }

        return response.sendSuccessResponseMobile(res, [], language.ringtone_update[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const updateFavTruckNotification = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { truck_id, notifi } = req.body;
        console.log(user_id)

        if (!(req.body.hasOwnProperty("truck_id")) || !(req.body.hasOwnProperty("notifi"))) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckExists = await favTruck.findOne({ where: { truck_id: truck_id, user_id: user_id } })
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_fav_truck[lang_id])
        }

        await favTruck.update({ notifi: notifi }, { where: { truck_id: truck_id, user_id: user_id } })

        return response.sendSuccessResponseMobile(res, [], language.notifi_update[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const verifyToken = (req, res, next) => {
    const lang_id = req.header(langHeaderKey);
    const token = req.header(tokenHeaderKey)

    if (!token) {
        return response.sendBadRequestResponse(res, language.token_required[lang_id])
    }

    if (!lang_id) {
        return response.sendBadRequestResponse(res, language.lang_id_required[lang_id])
    }

    if (token == null) return response.sendBadRequestResponse(res, language.token_missing[lang_id])

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        req.user = user

        if (!(user.user_id)) {
            return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        }

        let userData = User.findOne({ where: { user_id: user.user_id } })
        if (!userData) {
            return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        }

        next()
    })
}

const getTruckDetail = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let result = await truck.findOne({
            attributes: ["truck_id", "truck_name", "username"],
            where: {
                truck_id: truck_id
            }
        })

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        const [userRating, rateDetail, reportData, avatarData] = await Promise.all([
            rate_truck.findOne({
                attributes: ['star_count'],
                where: { user_id: user_id, truck_id: truck.truck_id }
            }),
            rate_truck.findAll({ where: { truck_id: truck.truck_id } }),
            report_data.findOne({ where: { user_id: user_id, truck_id: truck.truck_id } }),
            avatar.findOne({
                attributes: ['thumbnail', 'image_url'],
                where: { avatar_id: truck.avatar_id }
            })
        ]);

        const countOfResult = rateDetail.length;

        let totalRating = 0;
        for (let i = 0; i < rateDetail.length; i++) {
            totalRating += rateDetail[i].star_count;
        }

        const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;
        result.dataValues.average_rating = parseFloat(averageRating.toFixed(2));
        result.dataValues.user_rating = userRating ? userRating.star_count : 0;

        var favTrucks = await favTruck.findAll({ where: { user_id: user_id } })
        const favTruckIds = favTrucks.map(favTruck => favTruck.truck_id);

        result.dataValues.is_fav = favTruckIds.includes(result.truck_id);

        if (reportData) {
            result.dataValues.report_id = reportData.msg_id;
        } else {
            result.dataValues.report_id = 0;
        }

        result.dataValues.thumbnail = avatarData.thumbnail
        result.dataValues.image_url = avatarData.image_url

        return response.sendSuccessResponseMobile(res, [result], language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const rateTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { truck_id, star_count } = req.body;

        if (!truck_id || !star_count) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckExists = await truck.findOne({ where: { truck_id: truck_id } })
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        let rateExist = await rate_truck.findOne({ where: { truck_id: truck_id, user_id: user_id } })

        if (rateExist) {
            await rate_truck.update({ star_count: star_count }, { where: { truck_id: truck_id, user_id: user_id } })
        } else {
            await rate_truck.create({ truck_id: truck_id, user_id: user_id, star_count: star_count })
        }

        return response.sendSuccessResponseMobile(res, [], language.success_rate[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const createPrivateEvent = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { event_name, phone, country_code, email, address, event_type, event_date, guest_count, truck_id } = req.body;

        await privateEvent.create({ user_id, event_name, phone, country_code, email, address, event_type, event_date, guest_count })

        truck_id.forEach(async id => {
            let truckData = await truck.findOne({
                attributes: ['fcm_token', 'opt_out'],
                where: {
                    truck_id: id
                }
            })
            console.log(truckData)
            if (truckData) {
                if (!truckData.opt_out) {
                    middleware.CustomNotification(event_name, language.new_event[lang_id], truckData.fcm_token)
                }
            }
        });

        return response.sendSuccessResponseMobile(res, [], language.event_created[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const reportContent = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);

        const result = await report.findAll({
            attributes: ['id', 'en', 'es']
        })

        const formattedData = result.map((item) => ({
            id: item.id,
            value: item[lang_id],
        }));

        return response.sendSuccessResponseMobile(res, formattedData, language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const reportAdmin = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;
        const { msg_id, truck_id } = req.body;

        if (!msg_id || !truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const adminResult = await vendor.findOne({ where: { is_admin: true } })
        const msg = await report.findOne({ where: { id: msg_id } })

        console.log()
        middleware.mailSender(adminResult.email, language.report_from_user[lang_id], `<html>${user_id}<br>${msg[lang_id]}</html>`)
            .then(async (data) => {
                let reportdata = await report_data.findOne({
                    where: {
                        user_id: user_id,
                        truck_id: truck_id
                    }
                })
                if (reportdata) {
                    await report_data.update({ msg_id }, { where: { truck_id: truck_id, user_id: user_id } })
                } else {
                    await report_data.create({ truck_id: truck_id, user_id: user_id, msg_id: msg_id })
                }
                return response.sendSuccessResponseMobile(res, [], language.report_submitted[lang_id])
            })

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getUserEvents = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;

        let result = await privateEvent.findAll({
            attributes: ['event_id', 'event_name', 'country_code', 'phone', 'email', 'address', 'event_type', 'event_date', 'guest_count'],
            where: { user_id: user_id },
            order: [
                ['createdAt', 'DESC'] // Order by event_date in descending order to get the latest events first
            ]
        })

        return response.sendSuccessResponseMobile(res, result, language.success[lang_id]);
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const userOptOut = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { opt_out, notifi, ringtone_id } = req.body;
        const { user_id } = req.user;

        if (!(req.body.hasOwnProperty("opt_out")) || !(req.body.hasOwnProperty("notifi")) || !(req.body.hasOwnProperty("ringtone_id"))) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        if (opt_out) {

        }

        let userExists = await User.findOne({ where: { user_id: user_id } })
        if (!userExists) {
            return response.sendBadRequestResponse(res, language.no_user[lang_id])
        }

        await User.update({ opt_out, notifi, ringtone_id }, {
            where: {
                user_id: user_id
            }
        })

        return response.sendSuccessResponseMobile(res, [], language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getNotifiData = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;

        let userExists = await User.findOne({ where: { user_id: user_id } })
        if (!userExists) {
            return response.sendBadRequestResponse(res, language.no_user[lang_id])
        }

        let userData = await User.findOne({
            attributes: ['opt_out', 'notifi', 'ringtone_id'],
            where: { user_id: user_id }
        })

        let ringtoneData = await rington.findAll({
            attributes: ['ringtone_id', 'en', 'es']
        })

        const formattedData = ringtoneData.map((item) => ({
            ringtone_id: item.ringtone_id,
            value: item[lang_id],
        }));

        const finalResponse = [{ opt_out: userData.opt_out, notifi: userData.notifi, ringtone_id: userData.ringtone_id, formattedData }]

        return response.sendSuccessResponseMobile(res, finalResponse, language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getEventTruckList = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { user_id } = req.user;

        // let truckData = await truck.findAll({
        //     attributes: ['vendor_id', 'truck_id', 'truck_name', 'username', 'min_dollar', 'avatar_id'],
        //     where: {
        //         opt_out: false
        //     }
        // })

        let favTrucks = await favTruck.findAll({
            where: { user_id: user_id },
            include: [
                {
                    model: truck,
                    where: {
                        opt_out: false
                    },
                    on: {
                        truck_id: sequelize.where(sequelize.col('truck.truck_id'), '=', sequelize.col('favourite_truck.truck_id'))
                    },
                }
            ],
        });

        const formattedData = await Promise.all(favTrucks.map(async (item) => {
            const data = item.truck;

            const [vendorData, rateDetail, ringdata, avatarData, userData] = await Promise.all([
                vendor.findOne({
                    attributes: ['company_name'],
                    where: { vendor_id: data.vendor_id }
                }),
                rate_truck.findAll({ where: { truck_id: data.truck_id } }),
                truckRingtone.findOne({
                    where: {
                        truck_id: data.truck_id,
                        user_id: user_id
                    }
                }),
                avatar.findOne({ where: { avatar_id: data.avatar_id } }),
                User.findOne({ attributes: ['ringtone_id'], where: { user_id: user_id } })
            ]);

            data.company_name = vendorData.company_name

            const countOfResult = rateDetail.length;
            let totalRating = 0;
            for (let i = 0; i < rateDetail.length; i++) {
                totalRating += rateDetail[i].star_count;
            }
            const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;
            data.average_rating = parseFloat(averageRating.toFixed(2));

            let truckRing;
            if (ringdata) {
                truckRing = await rington.findOne({ where: { ringtone_id: ringdata.ringtone_id } })
            } else {
                truckRing = await rington.findOne({ where: { ringtone_id: userData.ringtone_id } })
            }
            data.ringtone_name = truckRing[lang_id];

            var imageUrl;
            if(truck.avatar_approved == 2){
                imageUrl = truck.avatar_url;
            } else{
                imageUrl = avatarData.image_url;
            }

            return {
                truck_id: data.truck_id,
                truck_name: data.truck_name,
                username: data.username,
                company_name: vendorData.company_name,
                min_dollar: typeof (data.min_dollar) === 'string' ? (data.min_dollar) : "",
                avatar_id: data.avatar_id,
                average_rating: parseFloat(averageRating.toFixed(2)),
                thumbnail: avatarData.thumbnail,
                image_url: imageUrl,
                ringtone_name: truckRing[lang_id],
            };

        }));

        // for (const data of truckData) {

        //     const [vendorData, rateDetail, ringdata, avatarData] = await Promise.all([
        //         vendor.findOne({
        //             attributes: ['company_name'],
        //             where: { vendor_id: data.vendor_id }
        //         }),
        //         rate_truck.findAll({ where: { truck_id: data.truck_id } }),
        //         truckRingtone.findOne({
        //             where: {
        //                 truck_id: data.truck_id,
        //                 user_id: user_id
        //             }
        //         }),
        //         avatar.findOne({ where: { avatar_id: data.avatar_id } })
        //     ]);

        //     console.log("data----->", vendorData)
        //     data.company_name = vendorData.company_name

        //     const countOfResult = rateDetail.length;
        //     let totalRating = 0;
        //     for (let i = 0; i < rateDetail.length; i++) {
        //         totalRating += rateDetail[i].star_count;
        //     }
        //     const averageRating = countOfResult > 0 ? totalRating / countOfResult : 0;
        //     data.average_rating = parseFloat(averageRating.toFixed(2));

        //     let truckRing;
        //     if (ringdata) {
        //         truckRing = await rington.findOne({ where: { ringtone_id: ringdata.ringtone_id } })
        //     } else {
        //         truckRing = await rington.findOne({ where: { ringtone_id: 1 } })
        //     }
        //     data.ringtone_name = truckRing[lang_id];

        //     data.thumbnail = avatarData.thumbnail;
        //     data.image_url = avatarData.image_url;
        // }

        // const formattedData = truckData.map((item) => ({
        //     truck_id: item.truck_id,
        //     truck_name: item.truck_name,
        //     username: item.username,
        //     company_name: item.company_name,
        //     min_dollar: typeof (item.min_dollar) === 'string' ? (item.min_dollar) : "",
        //     average_rating: item.average_rating,
        //     ringtone_name: item.ringtone_name,
        //     thumbnail: item.thumbnail,
        //     image_url: item.image_url
        // }));

        return response.sendSuccessResponseMobile(res, formattedData, language.trucks_fetched[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getRoute = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckExists = await truck.findOne({ where: { truck_id } })
        if (!truckExists) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        let routeResult = await route.findAll({
            attributes: ['route_id', 'route_name', 'route_string', 'coordinates'],
            where: {
                truck_id: truck_id
            }
        })

        return response.sendSuccessResponseMobile(res, routeResult, language.route_fetch[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

module.exports = {
    userToken,
    getUserTrucks,
    addFavouriteTruck,
    verifyToken,
    removeFavouriteTruck,
    getFavouriteTruckList,
    getTruckDetail,
    rateTruck,
    createPrivateEvent,
    reportContent,
    reportAdmin,
    getUserEvents,
    userOptOut,
    getNotifiData,
    getEventTruckList,
    updateTruckRingtone,
    updateLocation,
    getRoute,
    updateFavTruckNotification
}