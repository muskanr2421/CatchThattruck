const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const rington = sequelize.define("rington", {
    ringtone_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    en: {
        type: DataTypes.STRING
    },
    es: {
        type: DataTypes.STRING
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
{
    freezeTableName: true,
    timestamps: false
})

rington.sync({alter : true})
module.exports = rington