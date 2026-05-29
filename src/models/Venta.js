const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Venta = sequelize.define('ventas', {

    id_venta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    id_empleado: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    fecha_venta: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },

    total: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    }

}, {
    timestamps: false
});

module.exports = Venta;