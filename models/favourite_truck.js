const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')
const truck = require('./truck')
// Dump20240403
const favTruck = sequelize.define("favourite_truck", {
    fav_truck_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    truck_id: {
        type: DataTypes.INTEGER,
        references : {
            model : "truck",
            key : 'truck_id',
        }
    },
    user_id: {
        type: DataTypes.INTEGER
    },
    notifi: {
        type: DataTypes.BOOLEAN,
        defaultValue : true
    }
},
{
    freezeTableName: true
})

// truck.hasMany(favTruck , {foreignKey : 'truck_id'} );
// favTruck.belongsTo(truck, {foreignKey : 'truck_id'});

favTruck.sync({alter : false})
module.exports = favTruck

