const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')

const avatar = sequelize.define("avatar", {
    avatar_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    thumbnail: {
        type: DataTypes.STRING,
    },
    image_url: {
        type: DataTypes.STRING,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
},
{
    freezeTableName: true,
    timeStamps: false
})

avatar.sync({alter : true})
module.exports = avatar

