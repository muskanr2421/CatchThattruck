const { Sequelize } = require('sequelize')
const sequelize = require('../models/index')
const vendor = require("../models/vendor")
const truck = require("../models/truck")
const User = require('../models/user')
const Otp = require('../models/otp')
const cities = require('../models/city')
const state = require('../models/state')
const country = require('../models/country')
const translation = require('../models/translation')
const favTruck = require("../models/favourite_truck")
const contact = require("../models/contact")
const privateEvent = require("../models/private_events")
const contactData = require("../models/contact_data")
const route = require("../models/route")
const avatar = require('../models/avatar')

const md5 = require('md5')
const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const algorithm = 'aes-256-cbc'; //Using AES encryption
const encryptionKey = "EncryptionKey";
const moment = require('moment')
const multer = require('multer');
const sizeOf = require('image-size');
const path = require("path");
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');

const baseUrl = "https://catchthattruck.onrender.com/"

const response = require('../utils/response')
const middleware = require('../common/Utility')
const config = require('../config/otherConfig.json')
const language = require('../utils/data.json')
const city = require("../utils/cities.json")
const country_code = require("../utils/CountryCodes.json")
const reportData = require('../models/report_data')

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
            console.log("Error", error)
        }
        
    },
})

// Encryption function
function encrypt(text) {
    try {
        const cipher = crypto.createCipher(algorithm, encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return null; // Return null or throw an error as appropriate
    }
}

// Decryption function
function decrypt(encryptedText) {
    try {
        const decipher = crypto.createDecipher(algorithm, encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return null; // Return null or throw an error as appropriate
    }
}

const signUp = async(req,res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        const data = req.body;

        // let cityData = await cities.findOne({
        //     attributes: [ 'state_id' ],
        //     where: {
        //         city_id: data.city_id
        //     }
        // })

        // let stateData = await state.findOne({
        //     attributes: ['en'],
        //     where: {
        //         state_id: cityData.state_id
        //     }
        // })
        // var stateName = stateData.en

        var info = {
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            email: data.email,
            device_id: data.device_id,
            phone: data.phone,
            country_id: data.country_id,
            company_name: data.company_name,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            password: md5(data.password),
        }

        let phoneExists = await vendor.findOne({
            attributes: ['phone', 'country_id'],
            where : {
                phone : data.phone
            }
        })
        let emailExists = await vendor.findOne({
            attributes: ['email'],
            where: {
                email: data.email  
            }
        })
        let usernameExists = await vendor.findOne({
            attributes: ['username'],
            where: {
                username: data.username
            }
        }) 
        
        if(phoneExists && (phoneExists.country_id == data.country_id)){
            return response.sendBadRequestResponse(res, language.phone_registered[lang_id])
        }
        if(emailExists){
            return response.sendBadRequestResponse(res, language.email_registered[lang_id])
        } 
        if(usernameExists){
            return response.sendBadRequestResponse(res, language.username_exist[lang_id])
        }

        let result = await vendor.create(info);
        const truckInfo = {
            vendor_id: result.vendor_id,
            truck_name: result.company_name,
            username: result.username+' Primary',
            password: encrypt(data.password),
            avatar_id: 1,
            is_primary: true
        }
        await truck.create(truckInfo)

        const payload = {
            email: data.email,
            // exp: Math.floor(Date.now() / 1000) + (60 * 10) // expires in 10 min
        };

        var token = jwt.sign(payload, secretKey, {
            algorithm: config.common.algo
        })

        const link = `https://catchthattruck.onrender.com/api/dev/vendor/verify?token=${token}`

        middleware.mailSender(req.body.email, language.verify_email[lang_id], `${language.email_link[lang_id]} ${link}`)
            .then((data) => {
                return response.sendSuccessResponseMobile(res, [], language.account_created[lang_id])
            })
            .catch((err) => {
                return response.sendBadRequestResponse(res, language.otp_error[lang_id])
            })     
    } catch(err) {
        console.log(err)
        return res.send(err)
    }
}

const login = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        const data = req.body;

        //sequelize query function for selecting data from database
        let result = await vendor.findOne({
            where: {
                username: data.username
            }
        })

        let truckExists = await truck.findOne({
            where: {
                username: data.username
            }
        })
      
        if (!result && !truckExists) {
            return response.sendBadRequestResponse(res, language.username_not_exist[lang_id])
        }

        if(result){
            if(result.password !== md5(data.password)){
                return response.sendBadRequestResponse(res, language.pass_incorrect[lang_id])
            }
            if(!result.is_verified){
                return response.sendBadRequestResponse(res, language.email_not_verified[lang_id])
            }
            if(result.is_deleted){
                return response.sendBadRequestResponse(res, language.user_deleted[lang_id])
            }
            if(result.is_blocked){
                return response.sendBadRequestResponse(res, language.user_deactivate[lang_id])
            }
            if(result.is_suspended){
                return response.sendBadRequestResponse(res, language.user_suspend[lang_id])
            }
            if(result.is_admin){
                return response.sendBadRequestResponse(res, language.no_vendor[lang_id])
            }

            // let userData = await User.findOne({ where: { device_id: data.device_id}})
            // if(userData){
            //     await User.update({fcm_token: ""}, { where: {device_id: data.device_id}})
            // }
                
            const payload = {
                email: result.email,
                vendor_id: result.vendor_id,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // expires in 1 day
            };
    
            var token = jwt.sign(payload, secretKey, {
                algorithm: config.common.algo
            })

            let primayTruck = await truck.findOne({ where: {vendor_id: result.vendor_id, is_primary: true} })
    
            var info = {
                vendor_id: result.vendor_id,
                first_name: result.first_name,
                last_name: result.last_name,
                username: result.username,
                email: result.email,
                phone: result.phone,
                role_id: 3,
                lang_id: lang_id,
                device_id: result.device_id,
                country_id : typeof (result.country_id) === 'string' ? (result.country_id) : "",
                company_name: result.company_name,
                city: result.city,
                state: typeof (result.state) === 'string' ? (result.state) : "",
                zip_code: typeof (result.zip_code) === 'string' ? (result.zip_code) : "",
                primary_truck_id: primayTruck.truck_id
            }

            // let deviceData = await User.findOne({ where: {device_id: data.device_id}})
            // if(deviceData){
            //     await User.destroy({where: {device_id: data.device_id}})
            // }
    
            return res.status(200).json({
                message: language.success_login[lang_id],
                status: true,
                status_code: 200,
                token: token,
                data : [info]
            })
        } else {
            if(truckExists.password !== encrypt(data.password)){
                return response.sendBadRequestResponse(res, language.pass_incorrect[lang_id])
            }
            if(truckExists.is_deleted){
                return response.sendBadRequestResponse(res, language.user_deleted[lang_id])
            }
            if(truckExists.is_blocked){
                return response.sendBadRequestResponse(res, language.user_deactivate[lang_id])
            }
            if(truckExists.is_suspended){
                return response.sendBadRequestResponse(res, language.user_suspend[lang_id])
            }
                
            const payload = {
                username: truckExists.username,
                truck_id: truckExists.truck_id,
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // expires in 1 day
            }
    
            var token = jwt.sign(payload, secretKey, {
                algorithm: config.common.algo
            })
    
            var info = {
                truck_id: truckExists.truck_id,
                username: truckExists.username,
                truck_name: truckExists.truck_name,
                role_id: 4,
                lang_id: lang_id,
            }

            // let deviceData = await User.findOne({ where: {device_id: data.device_id}})
            // if(deviceData){
            //     await User.destroy({where: {device_id: device_id}})
            // }
    
            return res.status(200).json({
                message: language.success_login[lang_id],
                status: true,
                status_code: 200,
                token: token,
                data : [info]
            }) 
        }                       
    } catch(err){
        console.log(err)
        return res.send(err)
    }
} 

const getCities = async(req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        if(lang_id){
            return response.sendSuccessResponseMobile(res, city, "Cities Fetched")
        } else{
            return response.sendBadRequestResponse(res, "lang_id required")
        }
        
    } catch(err) {
        console.log(err)
        return res.send(err)
    }
}

const getUpdatedCity = async(req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        
        let city = await cities.findAll({
            include: [
                {
                    model: state,
                    on: {
                        state_id: sequelize.where(sequelize.col('state.state_id'), '=', sequelize.col('city.state_id'))
                    },
                },
            ],
        });
        const formattedData = city.map((item) => ({
            city_id: item.city_id,
            city_name: item[lang_id],
            state_id: item.state_id,
            state_name: item.state[lang_id]
        }));

        for(const data of formattedData ){
            let stateData = await state.findOne({
                include: [
                    {
                        model: country,
                        on: {
                            state_id: sequelize.where(sequelize.col('country.country_id'), '=', sequelize.col('state.country_id'))
                        },
                    }
                ],
                where: { state_id: data.state_id}
            });
            data.country_name = stateData.country[lang_id]
            data.country_id = stateData.country.country_id
            data.country_code = stateData.country.country_code;
            data.dial_code = stateData.country.dial_code;
            data.number_length = stateData.country.number_length;
            data.image =  `https://flagsapi.com/${stateData.country.country_code}/flat/64.png`
            // formattedData[i].image = `https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${stateData.country.country_code}.svg`
        }

        return response.sendSuccessResponseMobile(res, formattedData, language.success[lang_id])
    } catch(err) {
        console.log(err)
        return res.send(err)
    }
}

const getCountryCodes = async(req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        if(lang_id){
            let nextId = 1;
            for(i in country_code){
                country_code[i].country_id = nextId++;
                
                country_code[i].image = `https://flagsapi.com/${country_code[i].code}/flat/64.png`
            }
            // Insert JSON data into MySQL database
            //   country_code.forEach(async (item) => {
            //     try {
            //       const createdCountry = await CountryCode.create(item);
            //       console.log(`Inserted country with ID ${createdCountry}`);
            //     } catch (error) {
            //       console.error('Error inserting country:', error);
            //     }
            //   });
            return response.sendSuccessResponseMobile(res, country_code, "Country Codes Fetched")

        } else{
            return response.sendBadRequestResponse(res, "lang_id required")
        }
        
    } catch(err) {
        console.log(err)
        return res.send(err)
    }
}

function generateOTP() {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 4; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

function jsToEpoch(date) {
    const currentDate = new Date(date);
    const epochTime = currentDate.getTime();
    return epochTime;
}

const forgotPassword = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)

        if(!req.body.email){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const emailExists = await vendor.findOne({ where: { email: req.body.email } })
        if(!emailExists){
            return response.sendBadRequestResponse(res, language.email_not_exist[lang_id])
        }

        if(!(emailExists.is_verified)){
            return response.sendBadRequestResponse(res, language.email_not_verified[lang_id])
        }
            
        const otp = generateOTP();
        const date1 = new Date();
        const finalDate = jsToEpoch(date1) + 10 * 60 * 1000;

        const token = crypto.randomBytes(20).toString("hex");

        var data = {
            otp: otp,
            expire_time: finalDate,
            vendor_id: emailExists.vendor_id,
            token: token,
            is_email: false
        }

        Otp.create(data).
            then((result) => {
                middleware.mailSender(req.body.email, language.reset_pass[lang_id], `${language.reset_pass_otp[lang_id]} ${otp}`)
                    .then((data) => {
                        return response.sendSuccessResponseMobile(res, [{ id: result.vendor_id}], language.otp_sent[lang_id])
                    })
            })       
    
    }catch(err) {
        console.log("error", err)
        return res.send(err)
    }
}

const verifyResetPasswordOtp = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { otp, id } = req.body;

        if(!otp || !id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const otpRecord = await Otp.findOne({
            where: { vendor_id: id },
            order: [['createdAt', 'DESC']]
        });

        if (!otpRecord) {
            return response.sendBadRequestResponse(res, language.otp_not_found[lang_id])
        }

        if(otpRecord.dataValues.otp !== otp){
            return response.sendBadRequestResponse(res, language.otp_invalid[lang_id])
        }
        
        const date1 = new Date();
        const finalTime = jsToEpoch(date1);

        // condition to check OTP expire time
        if (finalTime < otpRecord.dataValues.expire_time) {
            if (otpRecord.dataValues.vendor_id !== id){
                return response.sendBadRequestResponse(res, language.otp_invalid[lang_id])
            }
            const token = otpRecord.dataValues.token;
            return response.sendSuccessResponseMobile(res, [{ token: token }], language.otp_verified[lang_id])  
        } else {
            return response.sendBadRequestResponse(res, language.otp_expired[lang_id])
        }       
    
    } catch (error) {
        return response.sendErrorResponse(res);
    }

}

const resetPassword = async (req, res) => {
    try {
        const lang_id = req.header(langHeaderKey)
        const { token, password } = req.body;

        if(!token || !password){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        Otp.findOne({ where: { token: token } })
            .then((data) => {
                const vendor_id = data.dataValues.vendor_id;

                vendor.findOne({ where: { vendor_id: vendor_id } })
                    .then(async (data) => {
                        await vendor.update({ password: md5(password) }, { where: { vendor_id: vendor_id } })
                        await Otp.destroy({ where: { token: token} })
                        return response.sendSuccessResponseMobile(res, [], language.pass_changed[lang_id])
                    })
            })

    } catch (error) {
        return response.sendErrorResponse(res);
    }
}

const verifyEmail = async (req, res) => {
    try{
        var token = req.query.token;
        var email;
        if(token == null) return response.sendBadRequestResponse(res, "Token is missing")

        jwt.verify(token, secretKey, (err, user) => {
            email = user.email
            if(err) return response.sendBadRequestResponse(res, "Invalid Token")
        })
        
        vendor.update({ is_verified: true }, { where: { email: email } })
        res.send("Email verified")
    } catch(err) {
        return response.sendErrorResponse(res);
    }
}

const forgotUsername = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)

        if(!req.body.email){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }
      
        const emailExists = await vendor.findOne({ where: { email: req.body.email } })
        if(!emailExists){
            return response.sendBadRequestResponse(res, language.email_not_exist[lang_id])
        }

        if(!(emailExists.is_verified)){
            return response.sendBadRequestResponse(res, language.email_not_verified[lang_id])
        }

        middleware.mailSender(req.body.email, language.forgot_username[lang_id], `${language.your_username[lang_id]} ${emailExists.username}`)
        .then((data) => {
            return response.sendSuccessResponseMobile(res, [], language.sent_username[lang_id])
        })
    
    } catch(err) {
        return response.sendErrorResponse(res);
    }
}

const verifyToken = async (req, res, next) => {
    const lang_id = req.header(langHeaderKey)
    const token = req.header(tokenHeaderKey)

    if(!token){
        return response.sendBadRequestResponse(res, language.token_required[lang_id])
    }

    if(!lang_id){
        return response.sendBadRequestResponse(res, language.lang_id_required[lang_id])
    }

    if(token == null) return response.sendBadRequestResponse(res, language.token_missing[lang_id])

    jwt.verify(token, secretKey, async (err, user) => {
        if(err) return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
        req.user = user

        if(user.vendor_id){
            let vendorData = await vendor.findOne({ where: { vendor_id: user.vendor_id}})

            if(!vendorData){
                return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
            }
            
            if(vendorData.is_deleted){
                return response.sendBadRequestResponse(res, language.user_deleted[lang_id])
            } else if(vendorData.is_blocked){
                return response.sendBadRequestResponse(res, language.user_deactivate[lang_id])
            } else if(vendorData.is_suspended){
                return response.sendBadRequestResponse(res, language.user_suspend[lang_id])
            }
        }
    
        if(user.truck_id){
            let truckData = await truck.findOne({ where: {truck_id: user.truck_id}})
            
            if(!truckData){
                return response.sendBadRequestResponse(res, language.invalid_token[lang_id])
            }

            if(truckData.is_deleted){
                return response.sendBadRequestResponse(res, language.user_deleted[lang_id])
            } else if(truckData.is_blocked){
                return response.sendBadRequestResponse(res, language.user_deactivate[lang_id])
            } else if(truckData.is_suspended){
                return response.sendBadRequestResponse(res, language.user_suspend[lang_id])
            }
        }
    
        next()
    })
}

const editDetails = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const token = req.header(tokenHeaderKey);

        const { email, first_name, last_name, phone, company_name, country_id, city, state, zip_code } = req.body;
        const { email: mail, vendor_id } = req.user;
        console.log(mail)

        // let cityData = await cities.findOne({
        //     attributes: [ 'state_id' ],
        //     where: {
        //         city_id: city_id
        //     }
        // })

        // let stateData = await state.findOne({
        //     attributes: ['en'],
        //     where: {
        //         state_id: cityData.state_id
        //     }
        // })
        // var stateName = stateData.en

        const info = {
            first_name,
            last_name,
            email,
            phone,
            company_name,
            country_id,
            city,
            state,
            zip_code
        };

        const emailExists = await vendor.findOne({where: { email: email }})
        if(emailExists){
            if(email !== emailExists.email){
                return response.sendBadRequestResponse(res, language.email_exist[lang_id])
            }
            let primayTruck = await truck.findOne({ where: {vendor_id: emailExists.vendor_id, is_primary: true} })
            const dataInfo = {
                vendor_id: emailExists.vendor_id,
                first_name,
                last_name,
                username: emailExists.username,
                email,
                phone,
                lang_id,
                device_id: emailExists.device_id,
                role_id: 3,
                country_id,
                company_name,
                city,
                state,
                zip_code,
                primary_truck_id: primayTruck.truck_id
            };
            var phoneExists = await vendor.findOne({ where: { phone: phone }}) 
            if(phoneExists){
                if(phone == phoneExists.phone){
                    await vendor.update(info, { where: { email: mail, vendor_id: vendor_id } })
                }else{
                    return response.sendBadRequestResponse(res, language.phone_exist[lang_id])
                }
            }else{
                await vendor.update(info, { where: { email: mail, vendor_id: vendor_id } })
            }
            return res.status(200).json({
                message: language.details_updated[lang_id],
                status: true,
                status_code: 200,
                token: token,
                data : [dataInfo]
            })    
    
        } else{
            const info1 = {
                first_name,
                last_name,
                email,
                phone,
                company_name,
                country_id,
                city,
                state,
                zip_code,
                is_verified: false
            };
            
            var phoneExists = await vendor.findOne({ where: { phone: phone }}) 
            if(phoneExists){
                if(phone !== phoneExists.phone){
                    return response.sendBadRequestResponse(res, "Phone Number already exists")
                }
                console.log("1")
                await vendor.update(info1, { where: { email: mail, vendor_id: vendor_id } })
            }else{
                console.log("2")
                console.log(info1)
                console.log(mail)
                console.log(vendor_id)
                await vendor.update(info1, { where: { email: mail, vendor_id: vendor_id } })
            }

            const payload = {
                email: email,
                exp: Math.floor(Date.now() / 1000) + (60 * 10) // expires in 10 min
            };

            var jwtToken = jwt.sign(payload, secretKey, {
                algorithm: config.common.algo
            })

            const link = `https://clean-penguin-constantly.ngrok-free.app/api/dev/vendor/verify?token=${jwtToken}`

            middleware.mailSender(req.body.email, language.verify_email[lang_id], `${language.email_link[lang_id]} ${link}`)
                .then((data) => {
                    return res.status(200).json({
                        status: true,
                        status_code: 204,
                        message: "Details Updated Successfully, Please verify your updated email.",
                        data: [],
                    });
                })
            
        }
    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const changePassword = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey)
        const { oldPass, newPass } = req.body;
        const email = req.user.email;

        if(!oldPass || !newPass){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let result = await vendor.findOne({ where: {email: email}})
        if(md5(oldPass) !== result.password){
            return response.sendBadRequestResponse(res, language.old_pass_incorrect[lang_id])
        }

        await vendor.update({password: md5(newPass)}, {where: {email: email}})
        return response.sendSuccessResponseMobile(res, [], language.pass_changed[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const addTruck = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const data = req.body;
        const vendor_id = req.user.vendor_id;

        let info;
        if(req.file && req.file.filename){
            const fileName = req.file.filename;

            const imagePath = 'images'; // Folder path where you want to save the thumbnail
            const imageUrl = baseUrl + fileName; // URL of the original image
            const thumbnailName = `thumbnail_${fileName}`
            const thumbnailPath = path.join(imagePath, thumbnailName); // Path to save the thumbnail
            let options = { width: 56, height: 57 }
        
            const thumbnail = await imageThumbnail({ uri: imageUrl }, options);
            fs.writeFileSync(thumbnailPath, thumbnail); // Write thumbnail data to file
    
            // Generate URL for the thumbnail
            const thumbnailUrl = baseUrl+thumbnailName;
            console.log('Thumbnail URL:', thumbnailUrl);

            info = {
                vendor_id: vendor_id,
                truck_name: data.truck_name,
                username: data.username,
                password: encrypt(data.password),
                is_primary: false,
                avatar_url: imageUrl, 
                thumbnail_url: thumbnailUrl,
                avatar_approved: 1
            } 
        } else{
            info = {
                vendor_id: vendor_id,
                truck_name: data.truck_name,
                username: data.username,
                password: encrypt(data.password),
                is_primary: false,
                avatar_id: data.avatar_id,
                avatar_approved: 0
            }
        }

        let vendorExists = await vendor.findOne({
            where: {
                username: data.username
            }
        })

        const result = await truck.findOne({
            where: {
                username: data.username
            }
        });

        if (vendorExists || result) {
            return response.sendBadRequestResponse(res, language.username_exist[lang_id]);
        }

        var entryCount = await truck.count({
            where: {
              vendor_id: vendor_id
            }
        });

        if(entryCount >= 15){
            return response.sendBadRequestResponse(res, language.vendor_cannot_manage[lang_id]);
        }

        await truck.create(info);
        await vendor.update({truck_count: ++entryCount}, { where: { vendor_id: vendor_id}})
        return response.sendSuccessResponseMobile(res, [], language.truck_created[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const editTruck = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const data = req.body;
        const vendor_id = req.user.vendor_id;
        const info = {
            truck_name: data.truck_name,
            username: data.username,
            password: encrypt(data.password),
            avatar_id: data.avatar_id
        }

        const result = await truck.findOne({
            where: {
                username: data.username, 
                vendor_id: vendor_id
            }
        });

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id]);
        }

        await truck.update(info, {
            where: {
                username: data.username, 
                vendor_id: vendor_id
            }
        });
        return response.sendSuccessResponseMobile(res, [], language.truck_details[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const deleteTruck = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id } = req.body;
        const vendor_id = req.user.vendor_id;

        if(!truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const result = await truck.findOne({
            where: {
                truck_id: truck_id, 
                vendor_id: vendor_id
            }
        });

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id]);
        }

        if(result.is_primary){
            return response.sendBadRequestResponse(res, language.primary_truck_delete[lang_id]);
        }

        await reportData.destroy({ where: { truck_id: truck_id}})
        await route.destroy({ where: { truck_id: truck_id}})
        await favTruck.destroy({where: { truck_id: truck_id}})
        await truck.destroy({where: { truck_id: truck_id, vendor_id: vendor_id}})
        return response.sendSuccessResponseMobile(res, [], language.truck_delete[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getVendorTruck = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const vendor_id = req.user.vendor_id;

        // var text = "111111"
        // var encrpytedText = encrypt(text)
        // var decryptedText = decrypt(encrpytedText)
        // console.log("encrypt", encrpytedText)
        // console.log("encrypt", decryptedText)

        var result = await truck.findAll({
            attributes: ["truck_id", "truck_name", "username", "avatar_id", "is_primary", "password", "avatar_approved", "avatar_url", "thumbnail_url", "reject_reason"],
            where: {
                vendor_id: vendor_id
            },
            order: [
                ['is_primary', 'DESC'], // Sort by is_primary in descending order
                ['createdAt', 'DESC']   // Then sort by createdAt in descending order
            ]
        });

        // result.forEach(result => {
        //     result.password = decrypt(result.password);
        // });
        // console.log("Password----->", result)
        // console.log("Password----->", result.password)
        // console.log("Password----->", decrypt(result.password))
        // for(i in result){
        //     let avatarResult = await avatar.findOne({
        //         where: { avatar_id: result[i].avatar_id }
        //     })
        //     result[i].password = decrypt(result[i].password);
        //     if(result[i].avatar_approved == 2){
        //         result[i].dataValues.image_url = result[i].avatar_url;
        //     } else{
        //         result[i].dataValues.image_url = avatarResult.image_url;
        //     }
        //     result[i].dataValues.thumbnail = avatarResult.thumbnail;
        //     delete result[i].avatar_url;
        // }

        const formattedData = await Promise.all(result.map(async (item) => {
            const truck = item;
            let avatarResult = await avatar.findOne({
                where: { avatar_id: truck.avatar_id }
            })
            let imageUrl, thumbnailUrl;
            console.log("Thumbnail", thumbnailUrl)
            if(truck.avatar_approved == 2){
                imageUrl = truck.avatar_url;
                thumbnailUrl = truck.thumbnail_url;
            } else{
                imageUrl = avatarResult.image_url;
                thumbnailUrl = avatarResult.thumbnail;
            }
            console.log("Thumbnail", thumbnailUrl)

            let avatarId;
            if(truck.avatar_approved == 0){
                avatarId = truck.avatar_id;
            } else {
                avatarId = "";
            }

            return {
                truck_id: truck.truck_id,
                truck_name: truck.truck_name,
                username: truck.username,
                avatar_id: avatarId,
                is_primary: truck.is_primary,
                password: decrypt(truck.password),
                thumbnail: thumbnailUrl,
                image_url: imageUrl,
                avatar_approved: truck.avatar_approved,
                reject_reason: truck.reject_reason
            };

        }));

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id]);
        }

        return response.sendSuccessResponseMobile(res, formattedData, language.trucks_fetched[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getTranslations = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        let transformedResult;

        let result = await translation.findAll({
            attributes: ["name", "en_value", "es_value"],
        });
        
        if(lang_id == "en"){
            transformedResult = result.reduce((acc, translation) => {
                acc[translation.name] = translation.en_value;
                return acc;
              }, {});
        } else{
            transformedResult = result.reduce((acc, translation) => {
                acc[translation.name] = translation.es_value;
                return acc;
              }, {});
        }

        return response.sendSuccessResponseMobile(res, [transformedResult], language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const contactContent = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        
        const result = await contact.findAll({
            attributes: ['id', 'en', 'es']
        })

        const formattedData = result.map((item) => ({
            id: item.id,
            value: item[lang_id],
        }));

        return response.sendSuccessResponseMobile(res, formattedData, language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const contactAdmin = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { vendor_id } = req.user;
        const { msg_id, contact_msg } = req.body;

        if(!msg_id || !contact_msg){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        const vendorData = await vendor.findOne({ where: {vendor_id: vendor_id}})

        const adminResult = await vendor.findOne({ where: { is_admin: true}})
        const msg = await contact.findOne({ where: {id: msg_id}})

        middleware.mailSender(adminResult.email, language.feedback[lang_id], `<html>${vendorData.username}<br>${vendorData.email}<br>${msg[lang_id]}<br>${contact_msg}</html>`)
                .then(async (data) => {
                    await contactData.create({vendor_id: vendor_id, msg_id: msg_id, text: contact_msg})
                    return response.sendSuccessResponseMobile(res, [], language.feedback_submitted[lang_id])
                })
    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getEvents = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id } = req.body;

        if(!truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }
        // console.log(localisation.length)

        const currentDate = new Date(); 
        const formattedCurrentDate = moment(currentDate).format('YYYY/MM/DD'); 

        var result = await privateEvent.findAll({
            attributes: ['user_id', 'event_id', 'event_name', 'country_code', 'phone', 'email', 'address', 'event_type', 'event_date', 'guest_count'],
            where: {
                event_date: {
                    [Sequelize.Op.gte]: moment(formattedCurrentDate, 'YYYY/MM/DD').toDate()
                }
            },
            order: [
                ['createdAt', 'DESC'] // Order by event_date in descending order to get the latest events first
            ]
        })

        let favData = await favTruck.findAll({
            attributes: ['user_id'],
            where: { truck_id: truck_id }
        }) 

        const favUserIds = favData.map(data => data.user_id);

        const filteredResult = result.filter(event => favUserIds.includes(event.user_id));

        const finalResult = filteredResult.map(event => {
            // return a new object with only the desired attributes
            return {
            event_id: event.event_id,
            event_name: event.event_name,
            country_code: event.country_code,
            phone: event.phone,
            email: event.email,
            address: event.address,
            event_type: event.event_type,
            event_date: event.event_date,
            guest_count: event.guest_count
            };
        });

        return response.sendSuccessResponseMobile(res, finalResult, language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const createRoute = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, route_name, route_string, coordinates } = req.body;

        let truckExists = await truck.findOne({ where: { truck_id}})
        if(!truckExists){
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }
        
        await route.create({ truck_id, route_name, route_string, coordinates })

        return response.sendSuccessResponseMobile(res, [], language.route_create[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getRoute = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id } = req.body;

        if(!truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let truckExists = await truck.findOne({ where: { truck_id}})
        if(!truckExists){
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }
        
        let routeResult = await route.findAll({
            attributes: ['route_id', 'route_name', 'route_string', 'coordinates'],
            where: {
                truck_id: truck_id
            }
        })

        return response.sendSuccessResponseMobile(res, routeResult, language.route_fetch[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const updateRoute = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, route_id, route_name, route_string, coordinates } = req.body;

        let routeExists = await route.findOne({ where: { truck_id, route_id }})
        if(!routeExists){
            return response.sendBadRequestResponse(res, language.no_data[lang_id])
        }
        
        await route.update({ route_name, route_string, coordinates }, { where: {truck_id: truck_id, route_id: route_id}})

        return response.sendSuccessResponseMobile(res, [], language.route_updated[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const deleteRoute = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, route_id } = req.body;

        if(!truck_id || !route_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        let routeExists = await route.findOne({ where: { truck_id, route_id }})
        if(!routeExists){
            return response.sendBadRequestResponse(res, language.no_data[lang_id])
        }
        
        await route.destroy({ where: {truck_id: truck_id, route_id: route_id}})

        return response.sendSuccessResponseMobile(res, [], language.route_deleted[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const vendorOptOut = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, opt_out, min_dollar } = req.body;

        if(!truck_id || !min_dollar){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        if (!(req.body.hasOwnProperty("opt_out"))) {
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }
        
        let truckExists = await truck.findOne({ where: { truck_id: truck_id}})
        if(!truckExists){
            return response.sendBadRequestResponse(res, language.no_truck[lang_id])
        }

        await truck.update({opt_out, min_dollar}, {
            where: {
                truck_id: truck_id
            }
        })

        return response.sendSuccessResponseMobile(res, [], language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getTruckAvatar = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        
        let result = await avatar.findAll({
            attributes: ['avatar_id', 'image_url', 'thumbnail'],
            where: Sequelize.literal('avatar_id <> 1')
        })

        return response.sendSuccessResponseMobile(res, result, language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const updateAlertRadius = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, first_alert, second_alert } = req.body;

        if(!first_alert || !second_alert || !truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        await truck.update({ first_alert, second_alert }, {
            where: { truck_id: truck_id }
        })

        return response.sendSuccessResponseMobile(res, [], language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const updateUTurn = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id, u_turn } = req.body;

        if(!truck_id || !u_turn){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        await truck.update({ u_turn }, {
            where: { truck_id: truck_id }
        })

        return response.sendSuccessResponseMobile(res, [], language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const getDetails = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const { truck_id } = req.body;
        const { vendor_id } = req.user;

        if(!truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }

        // if(vendor_id){
        //     let result = truck.findOne({ where: { truck_id: truck_id, vendor_id: vendor_id, is_primary: true}})
        //     if(!result) {
        //         return response.sendBadRequestResponse(res, "Vendor has no such Truck")
        //         // return response.sendBadRequestResponse(res, language.vendor_no_truck[lang_id])
        //     }
        // }

        let truckData = await truck.findOne({
            attributes: ['min_dollar', 'opt_out', 'first_alert', 'second_alert', 'u_turn'],
            where: { truck_id: truck_id}
        })

        return response.sendSuccessResponseMobile(res, [truckData], language.success[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const uploadAvatar = async (req, res) => {
    try{
        const lang_id = req.header(langHeaderKey);
        const truck_id = req.body.truck_id;
        const fileName = req.file.filename

        if(!truck_id){
            return response.sendBadRequestResponse(res, language.invalid_details[lang_id])
        }
        
        // uploadSingle(req, res, async (err) => { // call as a normal function
        //     if (err) return response.sendBadRequestResponse(res, err.message)
        //     const file = req.file; 
        //     console.log("File Name", fileName)
        //     if (!file) {
        //       return response.sendBadRequestResponse(res, "Please upload a file")
        //     }
        //   })

        const imagePath = 'images'; // Folder path where you want to save the thumbnail
        const imageUrl = baseUrl + fileName; // URL of the original image
        const thumbnailName = `thumbnail_${fileName}`
        const thumbnailPath = path.join(imagePath, thumbnailName); // Path to save the thumbnail
        let options = { width: 56, height: 57 }
    
        const thumbnail = await imageThumbnail({ uri: imageUrl }, options);
        fs.writeFileSync(thumbnailPath, thumbnail); // Write thumbnail data to file

        // Generate URL for the thumbnail
        const thumbnailUrl = baseUrl+thumbnailName;
        console.log('Thumbnail URL:', thumbnailUrl);
        
        await truck.update({ avatar_url: baseUrl+fileName, thumbnail_url: thumbnailUrl, avatar_approved: 1 }, { where: { truck_id: truck_id}})
        return response.sendSuccessResponseMobile(res, [], language.image_uploaded[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

const editTruckUpdated = async (req, res) => {
    
    try{
        const lang_id = req.header(langHeaderKey);
        const data = req.body;
        const vendor_id = req.user.vendor_id;
        
        let info;
        if(req.file && req.file.filename){
            const fileName = req.file.filename;

            const imagePath = 'images'; 
            const imageUrl = baseUrl + fileName; 
            const thumbnailName = `thumbnail_${fileName}`
            const thumbnailPath = path.join(imagePath, thumbnailName);
            let options = { width: 56, height: 57 }
        
            const thumbnail = await imageThumbnail({ uri: imageUrl }, options);
            fs.writeFileSync(thumbnailPath, thumbnail);
    
            const thumbnailUrl = baseUrl+thumbnailName;

            info = {
                truck_name: data.truck_name,
                username: data.username,
                password: encrypt(data.password),
                avatar_url: imageUrl, 
                thumbnail_url: thumbnailUrl,
                avatar_approved: 1
            }
        } else{
            if(data.avatar_id){
                console.log("here")
                info = {
                    truck_name: data.truck_name,
                    username: data.username,
                    password: encrypt(data.password),
                    avatar_id: data.avatar_id,
                    avatar_approved: 0
                }  
            } else {
                console.log("Here")
                info = {
                    truck_name: data.truck_name,
                    username: data.username,
                    password: encrypt(data.password)
                }  
            }
        }
        
        const result = await truck.findOne({
            where: {
                username: data.username, 
                vendor_id: vendor_id
            }
        });

        if (!result) {
            return response.sendBadRequestResponse(res, language.no_truck[lang_id]);
        }

        await truck.update(info, {
            where: {
                username: data.username, 
                vendor_id: vendor_id
            }
        });
        return response.sendSuccessResponseMobile(res, [], language.truck_details[lang_id])

    } catch(err){
        console.log(err)
        return res.send(err)
    }
}

module.exports = {
    signUp,
    login,
    getCountryCodes,
    getCities,
    forgotPassword,
    verifyResetPasswordOtp,
    resetPassword,
    forgotUsername,
    verifyToken,
    editDetails,
    verifyEmail,
    changePassword,
    addTruck,
    editTruck,
    deleteTruck,
    getVendorTruck,
    getUpdatedCity,
    getTranslations,
    contactContent,
    contactAdmin,
    getEvents,
    createRoute,
    getRoute,
    updateRoute,
    deleteRoute,
    vendorOptOut,
    getTruckAvatar,
    updateAlertRadius,
    updateUTurn,
    getDetails,
    uploadImg,
    uploadAvatar,
    editTruckUpdated
}

// try{
//     const lang_id = req.header(langHeaderKey);
//     const token = req.header(tokenHeaderKey);

//     const { email, first_name, last_name, phone, company_name, country_id, city_id, zip_code } = req.body;
//     const { email: mail, vendor_id } = req.user;

//     let state;
//     for(i in city){
//         if(city[i].id === data.city_id){
//             state = city[i].state
//         }
//     }

//     const info = {
//         first_name,
//         last_name,
//         email,
//         phone,
//         company_name,
//         country_id,
//         city_id,
//         state,
//         zip_code
//     };

//     const emailExists = await vendor.findOne({where: { email: data.email }})
//     if(emailExists){
//         if(data.email !== emailExists.email){
//             return response.sendBadRequestResponse(res, "Email already exists")
//         }
//         if(data.email == emailExists.email){
//             const dataInfo = {
//                 id: emailExists.vendor_id,
//                 first_name,
//                 last_name,
//                 username: emailExists.username,
//                 email,
//                 phone,
//                 lang_id,
//                 country_id,
//                 company_name,
//                 city_id,
//                 state,
//                 zip_code,
//             };
//             var phoneExists = await vendor.findOne({ where: { phone: data.phone }}) 
//             if(phoneExists){
//                 if(data.phone == phoneExists.phone){
//                     await vendor.update(info, { where: { email: mail, vendor_id: vendor_id } })
//                 }else{
//                     return response.sendBadRequestResponse(res, "Phone Number already exists")
//                 }
//             }else{
//                 await vendor.update(info, { where: { email: mail, vendor_id: vendor_id } })
//             }
//             return res.status(200).json({
//                 message: "Details Updated Successfully",
//                 status: true,
//                 status_code: 200,
//                 token: token,
//                 data : [dataInfo]
//             })
//         } else{
            
//         }
//     } else{
//         const info1 = {
//             first_name,
//             last_name,
//             email,
//             phone,
//             company_name,
//             country_id,
//             city_id,
//             zip_code,
//             is_verified: false
//         };

//         const payload = {
//             email: data.email,
//             exp: Math.floor(Date.now() / 1000) + (60 * 10) // expires in 10 min
//         };

//         var token = jwt.sign(payload, secretKey, {
//             algorithm: config.common.algo
//         })

//         const link = `https://clean-penguin-constantly.ngrok-free.app/api/dev/vendor/verify?token=${token}`
        
//         var phoneExists = await vendor.findOne({ where: { phone: data.phone }}) 
//         if(phoneExists){
//             if(data.phone == phoneExists.phone){
//                 await vendor.update(info1, { where: { email: mail, vendor_id: vendor_id } })
//             }else{
//                 return response.sendBadRequestResponse(res, "Phone Number already exists")
//             }
//         }else{
//             await vendor.update(info1, { where: { email: mail, vendor_id: vendor_id } })
//         }

//         middleware.mailSender(req.body.email, language.verify_email[lang_id], `${language.email_link[lang_id]} ${link}`)
//             .then((data) => {
//                  return response.sendSuccessResponseMobile(res, [], language.account_created[lang_id])
//             })
//             .catch((err) => {
//                 return response.sendBadRequestResponse(res, language.otp_error[lang_id])
//             })
//         return res.status(200).json({
//             status: true,
//             status_code: 204,
//             message: "Details Updated Successfully, Please verify your updated email.",
//             data: [],
//         });
//     }
// } catch(err){
//     console.log(err)
//     return res.send(err)
// }