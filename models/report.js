const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const report = sequelize.define("report", {
    id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    name: {
        type: DataTypes.STRING
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

report.sync({alter : true})
module.exports = report