const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')
const state = require('./state')

const city = sequelize.define("city", {
    city_id: {
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
    state_id: {
        type: DataTypes.INTEGER,
        references : {
            model : "state",
            key : 'state_id',
        }
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
    timeStamps: false
})

city.sync({alter : false})
module.exports = city

