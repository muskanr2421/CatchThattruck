const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const route = sequelize.define("route", {
    route_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    truck_id: {
        type: DataTypes.INTEGER,
        allowNull:false
    },
    route_name: {
        type: DataTypes.STRING
    },
    route_string: {
        type: DataTypes.TEXT
    },
    coordinates: {
        type: DataTypes.TEXT
    }
},
{
    freezeTableName: true,
})

 
route.sync({alter:true})
module.exports = route