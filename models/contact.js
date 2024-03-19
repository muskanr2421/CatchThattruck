const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const contact = sequelize.define("contact", {
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

contact.sync({alter : true})
module.exports = contact