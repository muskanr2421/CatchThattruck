const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const reportData = sequelize.define("report_data", {
    report_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    user_id: {
        type: DataTypes.INTEGER,
    },
    truck_id: {
        type: DataTypes.INTEGER,
        references : {
            model : "truck",
            key : 'truck_id',
        }
    },
    msg_id: {
        type: DataTypes.INTEGER
    }
},
{
    freezeTableName: true
})

reportData.sync({alter : false})
module.exports = reportData