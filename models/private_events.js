const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const privateEvent = sequelize.define("private_event", {
    event_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    event_name: {
        type: DataTypes.STRING
    },
    country_code: {
        type: DataTypes.STRING   
    },
    phone: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING
    },
    address: {
        type: DataTypes.STRING
    },
    event_type: {
        type: DataTypes.STRING 
    },
    event_date: {
        type: DataTypes.STRING
    },
    guest_count: {
        type: DataTypes.INTEGER
    }
},
{
    freezeTableName: true
})

privateEvent.sync({alter : true})
module.exports = privateEvent

