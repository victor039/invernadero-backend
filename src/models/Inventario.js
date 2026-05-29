const { DataTypes } = require('sequelize')

const sequelize = require('../config/database')

const Inventario = sequelize.define('inventario', {
    id_inventario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_planta: {
        type: DataTypes.INTEGER
    },

    cantidad_ingresada: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    fecha_ingreso: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },

    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    freezeTableName: true,
    timestamps: false
})

module.exports = Inventario
