const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const truckRingtone = sequelize.define("truck_ringtone", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    truck_id: {
        type: DataTypes.INTEGER,
        allowNull:false
    },
    ringtone_id: {
        type: DataTypes.INTEGER
    },
    user_id: {
        type: DataTypes.TEXT
    }
},
{
    freezeTableName: true,
})

 
truckRingtone.sync({alter:true})
module.exports = truckRingtone