const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const contactData = sequelize.define("contact_data", {
    contact_id: {
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
    msg_id: {
        type: DataTypes.INTEGER
    },
    text: {
        type: DataTypes.STRING
    }
},
{
    freezeTableName: true
})

contactData.sync({alter : true})
module.exports = contactData