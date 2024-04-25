const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const notifi = sequelize.define("notifi", {
    notifi_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    user_id: {
        type: DataTypes.INTEGER,
    },
    truck_id: {
        type: DataTypes.INTEGER,
    }
},
{
    freezeTableName: true
})

notifi.sync({alter : true})
module.exports = notifi

