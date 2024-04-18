const { Sequelize } = require('sequelize');
const sequelize = require('../models/index');
const vendor = require("../models/vendor");
const truck = require('../models/truck');
const report = require('../models/report');
const contact = require('../models/contact');
const reportData = require('../models/report_data');
const contactData = require('../models/contact_data');
const avatar = require('../models/avatar');

const jwt = require('jsonwebtoken');
const md5 = require("md5");
const multer = require('multer');
const path = require("path");

const response = require('../utils/response')
const config = require('../config/otherConfig.json')
const language = require('../utils/data.json');

const tokenHeaderKey = config.header.token;
const langHeaderKey = config.header.lang_id;
const secretKey = config.header.secret_key;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)  

    }
})

const uploadImg = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: async function (req, file, cb) {
        try{
            // Check file type (if needed)
            // Check file size
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                return cb(new Error('Only JPG, JPEG, and PNG files are allowed!'))
            }
            if (file.size > 2 * 1024 * 1024) {
                return cb(new Error('File size exceeds 2MB limit!'));
            }

            // Check aspect ratio (1:1)
            // const dimensions = sizeOf(file.path);
            // const width = dimensions.width;
            // const height = dimensions.height;
            // if (width !== height) {
            //     return cb(new Error('Image must have a 1:1 aspect ratio!'));
            // }

            // Pass the validation
            cb(null, true);
        } catch (error) {
            cb(error, true);
        }
        
    },
})

const adminLogin = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const data = req.body;

        var result = await vendor.findOne({
            where: {
                username: data.username
            }
        })

        if (!result) {
            return response.sendBadRequestResponse(res, language.username_not_exist[lang_id])
        }

        if (!result.is_admin) {
            return response.sendBadRequestResponse(res, language.no_admin[lang_id])
        }

        if (result.password !== md5(data.password)) {
            return response.sendBadRequestResponseAdmin(res, 400, language.wrong_credentials[lang_id])
        }

        const payload = {
            email: result.email,
            vendor_id: result.vendor_id,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // expires in 1 day 
        };

        var token = jwt.sign(payload, secretKey, {
            algorithm: config.common.algo
        })

        var info = {
            id: result.vendor_id,
            first_name: result.first_name,
            last_name: result.last_name,
            username: result.username,
            email: result.email,
            phone: result.phone,
            device_id: result.device_id,
            country_id: typeof (result.country_id) === 'string' ? (result.country_id) : "",
            company_name: result.company_name,
            city: result.city,
            state: typeof (result.state) === 'string' ? (result.state) : "",
            zip_code: typeof (result.zip_code) === 'string' ? (result.zip_code) : "",
        }

        return res.status(200).json({
            message: language.success_login[lang_id],
            status: true,
            status_code: 200,
            token: token,
            data: [info]
        })

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const deactivateTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckData = await truck.findOne({
            where: { truck_id: truck_id }
        })

        if (!truckData) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_truck[lang_id])
        }

        if (truckData.is_primary) {
            await vendor.update({ is_blocked: true }, { where: { vendor_id: truckData.vendor_id } })
            // return response.sendSuccessResponseMobile(res, [], "Truck Deativated Successfully");
        }

        await truck.update({ is_blocked: true }, { where: { truck_id: truck_id } })
        return response.sendSuccessResponseMobile(res, [], language.truck_deactivate[lang_id]);

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const suspendTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { truck_id, message } = req.body;

        if (!truck_id || !message) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckData = await truck.findOne({
            where: { truck_id: truck_id }
        })

        if (!truckData) {
            return response.sendBadRequestResponseAdmin(res,404, language.no_truck[lang_id])
        }

        if (truckData.is_primary) {
            await vendor.update({ is_suspended: true, suspend_msg: message }, { where: { vendor_id: truckData.vendor_id } })
            // return response.sendSuccessResponseMobile(res, [], "Truck Suspended Successfully");
        }

        await truck.update({ is_suspended: true, suspend_msg: message }, { where: { truck_id: truck_id } })
        return response.sendSuccessResponseMobile(res, [], language.truck_suspend[lang_id]);

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const activateTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckData = await truck.findOne({
            where: { truck_id: truck_id }
        })

        if (!truckData) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_truck[lang_id])
        }

        if (truckData.is_primary) {
            await vendor.update({ is_blocked: false }, { where: { vendor_id: truckData.vendor_id } })
            // return response.sendSuccessResponseMobile(res, [], "Truck Activated Successfully");
        }

        await truck.update({ is_blocked: false }, { where: { truck_id: truck_id } })
        return response.sendSuccessResponseMobile(res, [], language.truck_activate[lang_id]);

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const unsuspendTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { truck_id } = req.body;

        if (!truck_id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckData = await truck.findOne({
            where: { truck_id: truck_id }
        })

        if (!truckData) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_truck[lang_id])
        }

        if (truckData.is_primary) {
            await vendor.update({ is_suspended: false, suspend_msg: "" }, { where: { vendor_id: truckData.vendor_id } })
            // return response.sendSuccessResponseMobile(res, [], "Truck Activated Successfully");
        }

        await truck.update({ is_suspended: false, suspend_msg: "" }, { where: { truck_id: truck_id } })
        return response.sendSuccessResponseMobile(res, [], language.truck_activate[lang_id]);

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const deleteTruck = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { truck_id, password } = req.body;
        const { vendor_id } = req.user;

        let adminData = await vendor.findOne({
            attributes: ['password'],
            where: { vendor_id: vendor_id, is_admin: true }
        })

        if (!(md5(password) == adminData.password)) {
            return response.sendBadRequestResponse(res, language.pass_incorrect[lang_id])
        }

        if (!truck_id) {
            return response.sendBadRequestResponseAdmin(res,404, language.invalid_details[lang_id])
        }

        let truckData = await truck.findOne({
            where: { truck_id: truck_id }
        })

        if (!truckData) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_truck[lang_id])
        }

        if (truckData.is_primary) {
            await vendor.update({ is_deleted: true }, { where: { vendor_id: truckData.vendor_id } })
            // return response.sendSuccessResponseMobile(res, [], "Truck Deleted Successfully");
        }

        await truck.update({ is_deleted: true }, { where: { truck_id: truck_id } })
        return response.sendSuccessResponseMobile(res, [], language.truck_delete[lang_id]);

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const verifyToken = (req, res, next) => {
    const lang_id = req.header(langHeaderKey)
    const token = req.header(tokenHeaderKey)

    if (!token) {
        return response.sendBadRequestResponse(res, language.token_required[lang_id])
    }

    if (!lang_id) {
        return response.sendBadRequestResponse(res, language.lang_id_required[lang_id])
    }

    if (token == null) return response.sendBadRequestResponse(res, language.token_missing[lang_id])

    jwt.verify(token, secretKey, async (err, user) => {
        if (err) return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        if (!(user.vendor_id)) {
            return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        }
        req.user = user

        if (!(user.vendor_id)) {
            return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        }

        let vendorData = await vendor.findOne({ where: { vendor_id: user.vendor_id, is_admin: true } })

        if (!vendorData) {
            return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        }

        next()
    })
}

const getAllVendors = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)

        let data = await vendor.findAll({
            attributes: ['vendor_id', 'first_name', 'last_name', 'username', 'email'],
            include: [
                {
                    model: truck,
                    attributes: ['truck_id', 'truck_name', 'username', 'is_deleted', 'is_blocked', 'is_suspended', 'suspend_msg'
                    // ,[
                    //         sequelize.literal('(SELECT COUNT(*) FROM report_data WHERE report_data.truck_id = trucks.truck_id)'),
                    //         'is_reported'
                    //     ]
                    ],
                    where: {
                        vendor_id: sequelize.col('vendors.vendor_id')
                    },
                }
            ]
        })

        // Iterate over the result and check if each truck is reported or not
        for (const vendor of data) {
            for (const truck of vendor.trucks) {
                const reportCount = await reportData.count({
                    where: {
                        truck_id: truck.truck_id
                    }
                });
                truck.dataValues.is_reported = reportCount > 0;
            }
        }

        if (!data) {
            // return res.status(200).json({
            //     status: true,
            //     status_code: 404,
            //     message: language.no_data[lang_id],
            //     data: [],
            // });
            return response.sendBadRequestResponseAdmin(res, 404, language.no_data[lang_id])
        }

        return response.sendSuccessResponseMobile(res, data, language.vendors_fetched[lang_id]);
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

const contactContent = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);

        const result = await contact.findAll({
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

const getReportDetails = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);

        const result = await reportData.findAll({
            attributes: ['report_id', 'user_id', 'msg_id', 'createdAt'],
            include: [
                {
                    model: truck,
                    attributes: ['truck_id', 'truck_name', 'username'],
                    include: [
                        {
                            model: vendor,
                            attributes: ['vendor_id', 'username', 'first_name', 'last_name'],
                            where: {
                                vendor_id: sequelize.col('truck.vendor_id')
                            }
                        }
                    ]
                }
            ]
        })

        if (!result) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_data[lang_id])
        }

        return response.sendSuccessResponseMobile(res, result, language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getContactDetails = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey);

        const result = await contactData.findAll({
            attributes: ['contact_id', 'msg_id', 'text', 'createdAt'],
            include: [
                {
                    model: vendor,
                    attributes: ['vendor_id', 'username', 'first_name', 'last_name'],
                }
            ]
        })

        if (!result) {
            return response.sendBadRequestResponseAdmin(res, 404, language.no_data[lang_id])
        }

        return response.sendSuccessResponseMobile(res, result, language.success[lang_id])

    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const refreshToken = async (req, res) => {
    try {
        const tokenHeader = req.header(tokenHeaderKey)
        const lang_id = req.header(langHeaderKey)
        const { id } = req.body;

        if (!id) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let result = await vendor.findOne({ where: { vendor_id: id, is_admin: true } })
        if (!result) {
            return response.sendBadRequestResponse(res, language.no_admin[lang_id])
        }

        const user = verifyTokenMsg(tokenHeader);

        if (user == "Invalid Token") {
            const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24)

            payload = {
                email: result.email,
                vendor_id: result.vendor_id,
                exp: exp
            }

            var token = jwt.sign(payload, secretKey, {
                algorithm: config.common.algo
            })

            return response.sendSuccessResponseMobile(res, [{ token: token, id: id, role_id: 1 }], language.success[lang_id])
        }
        return response.sendSuccessResponseMobile(res, [{ token: tokenHeader, id: id, role_id: 1 }], language.success[lang_id])
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

const checkFile = (file, cb) => {
    try {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only JPG, JPEG, and PNG files are allowed!'));
        }
        if (file.size > 2 * 1024 * 1024) {
            return cb(new Error('File size exceeds 2MB limit!'));
        }

        // Add more checks if needed
        
        cb(null, true); // Pass the validation if all checks pass
    } catch (error) {
        cb(error); // Pass any errors to the callback
    }
};

const uploadAvatar = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)

          uploadImg.fields([
            { name: 'avatar', maxCount: 1, fileFilter: checkFile }, 
            { name: 'thumbnail', maxCount: 1, fileFilter: checkFile } 
        ])(req, res, async (err) => {
            if (err) {
                console.error(err);
                return response.sendBadRequestResponse(res, err.message)
            }

            const avatarFile = req.files['avatar'] ? req.files['avatar'][0] : null;
            const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

            if (!avatarFile || !thumbnailFile) {
                return response.sendBadRequestResponse(res, 'Please upload both avatar and thumbnail images.');
            }

            const avatarFileName = avatarFile.filename;
            const thumbnailFileName = thumbnailFile.filename;

            console.log("Avatar File Name", avatarFileName);
            console.log("Thumbnail File Name", thumbnailFileName);
            const baseUrl = "http://127.0.0.1:8080/"

            await avatar.create({ image_url: baseUrl+avatarFileName, thumbnail: baseUrl+thumbnailFileName });
            
            // Send success response
            return response.sendSuccessResponseMobile(res, [], "Images Uploaded Successfully");
        });
        
        // return response.sendSuccessResponseMobile(res, [{ token: tokenHeader, id: id, role_id: 1 }], language.success[lang_id])
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

const getAvatarList = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)

        let result = await avatar.findAll({
            attributes: ["avatar_id", "image_url", "thumbnail"],
        });

        return response.sendSuccessResponseMobile(res, result, language.success[lang_id]);
    } catch (err) {
        console.log(err)
        return res.send(err)
    }
}

module.exports = {
    adminLogin,
    deactivateTruck,
    suspendTruck,
    activateTruck,
    unsuspendTruck,
    deleteTruck,
    verifyToken,
    getAllVendors,
    reportContent,
    contactContent,
    getReportDetails,
    getContactDetails,
    refreshToken,
    uploadAvatar,
    getAvatarList
}