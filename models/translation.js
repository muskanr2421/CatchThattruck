const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const lang_string = sequelize.define("translation", {
    name: {
        type: DataTypes.STRING
    },
    en_value: {
        type: DataTypes.TEXT
    },
    es_value: {
        type: DataTypes.TEXT
    }
},
{
    freezeTableName: true
})

lang_string.sync({alter : false})
module.exports = lang_string