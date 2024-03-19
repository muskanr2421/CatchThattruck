const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const user = sequelize.define("user", {
    user_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    device_id: {
        type: DataTypes.STRING
    },
    lat: {
        type: DataTypes.STRING
    },
    long: {
        type: DataTypes.STRING
    },
    fcm_token: {
        type: DataTypes.STRING
    },
    firebase_uid: {
        type: DataTypes.STRING
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    opt_out: {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    },
    notifi: {
        type : DataTypes.INTEGER,
        defaultValue : 1
    },
    ringtone_id: {
        type : DataTypes.INTEGER,
        defaultValue : 1
    },
    isCompass: {
        type : DataTypes.BOOLEAN,
        defaultValue: false
    }
},
{
    freezeTableName: true
})

user.sync({alter : true})
module.exports = user

