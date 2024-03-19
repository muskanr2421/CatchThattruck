const sequelize = require('./index')
const { Sequelize, DataTypes } = require('sequelize')
const country = require('./country')
const city = require('./city')

const state = sequelize.define("state", {
    state_id: {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true
    },
    en: {
        type: DataTypes.STRING
    },
    es: {
        type: DataTypes.STRING
    },
    country_id: {
        type: DataTypes.INTEGER,
        references : {
            model : "country",
            key : 'country_id',
        }
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
    timestamps: false
})

city.belongsTo(state, {foreignKey : 'state_id'})
state.sync({alter : false})
module.exports = state

