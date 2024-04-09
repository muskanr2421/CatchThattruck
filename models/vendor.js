'use strict';
const sequelize = require('./index')
const {Sequelize, DataTypes} = require('sequelize');
const truck = require('./truck')
const contactData = require('./contact_data')

const vendor = sequelize.define('vendors', {
    vendor_id: {
      primaryKey : true,
      autoIncrement : true,
      type: DataTypes.INTEGER,
    },    
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    username: {
      type: DataTypes.STRING
    },
    company_name: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.BIGINT
    }, 
    city: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    country_id: {
      type: DataTypes.STRING
    },  
    zip_code: {
      type : DataTypes.STRING
    },
    state: {
      type : DataTypes.STRING
    },
    device_id: {
      type : DataTypes.STRING
    },
    email_otp: {
      type: DataTypes.INTEGER
    },
    truck_count: {
      type: DataTypes.INTEGER
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_verified: {
      type : DataTypes.BOOLEAN,
      defaultValue : false
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
},                                                                                   
{
    freezeTableName: true,
})

contactData.belongsTo(vendor, {foreignKey : 'vendor_id'});
truck.belongsTo(vendor, {foreignKey : 'vendor_id'});
vendor.hasMany(truck , {foreignKey : 'vendor_id'} )
vendor.sync({alter : false})
module.exports = vendor