const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const rateTruck = sequelize.define("rate_truck", {
    rate_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    truck_id: {
        type: DataTypes.INTEGER
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    star_count: {
        type: DataTypes.DOUBLE
    }
},
{
    freezeTableName: true
})

rateTruck.sync({alter : true})
module.exports = rateTruck

