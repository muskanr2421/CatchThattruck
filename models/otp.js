const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const OTP = sequelize.define("otp", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    vendor_id: {
        type: DataTypes.INTEGER,
        allowNull:false
    },
    otp:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    expire_time:{
        type: DataTypes.BIGINT,
    },
    token:{
        type: DataTypes.STRING
    },
    is_email: {
        type: DataTypes.BOOLEAN
    }
},
{
    freezeTableName: true,
})

 
OTP.sync({alter:true})
module.exports = OTP