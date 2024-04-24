const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')
const favTruck = require('./favourite_truck');
const reportData = require('./report_data')

const truck = sequelize.define("truck", {
    truck_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    vendor_id: {
        type: DataTypes.INTEGER,
        references : {
            model : "vendors",
            key : 'vendor_id',
        }
    },
    truck_name: {
        type: DataTypes.STRING
    },
    username: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.STRING
    },
    avatar_id: {
        type: DataTypes.INTEGER,
        defaultValue : 1
    },
    lat: {
        type: DataTypes.STRING
    },
    long: {
        type: DataTypes.STRING 
    },
    long: {
        type: DataTypes.STRING 
    },
    fcm_token: {
        type: DataTypes.STRING
    },
    is_primary: {
        type: DataTypes.BOOLEAN
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    },
    is_suspended: {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue : false
    },
    suspend_msg: {
        type: DataTypes.STRING,
        defaultValue : ""
    },
    opt_out: {
      type: DataTypes.BOOLEAN,
      defaultValue : false
    },
    min_dollar: {
        type: DataTypes.STRING,
        defaultValue: "0"
    },
    u_turn: {
        type: DataTypes.STRING,
        defaultValue: "0"
    },
    first_alert: {
        type: DataTypes.STRING,
        defaultValue: ".5"
    },
    second_alert: {
        type: DataTypes.STRING,
        defaultValue: ".25"
    },
    last_distance: {
        type: DataTypes.STRING,
        defaultValue : "0"
    },
    avatar_approved: {
        type: DataTypes.INTEGER,
        defaultValue : 0 
    },
    avatar_url: {
        type: DataTypes.STRING
    },
    reject_reason: {
        type: DataTypes.STRING
    },
    is_online: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},
{
    freezeTableName: true
})

favTruck.belongsTo(truck, {foreignKey : 'truck_id', targetKey: 'truck_id'});
reportData.belongsTo(truck, {foreignKey : 'truck_id', targetKey: 'truck_id'});
truck.sync({alter : false})
module.exports = truck