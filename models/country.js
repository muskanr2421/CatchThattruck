const sequelize = require('./index')
const  DataTypes  = require('sequelize')
const state = require('./state')

const country = sequelize.define("country", {
    country_id: {
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
    country_code: {
        type: DataTypes.STRING
    },
    dial_code: {
        type: DataTypes.STRING
    },
    number_length: {
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
    timeStamps: false
})

state.belongsTo(country, {foreignKey : 'country_id'})
country.sync({alter : false})
module.exports = country

