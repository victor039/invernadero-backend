const { DataTypes } = require('sequelize')

const sequelize = require('../config/database')

const Envio = sequelize.define('envios', {
    id_envio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_venta: {
        type: DataTypes.INTEGER
    },

    direccion_envio: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    fecha_envio: {
        type: DataTypes.DATEONLY
    },

    estado: {
        type: DataTypes.ENUM('Pendiente', 'Enviado', 'Entregado'),
        defaultValue: 'Pendiente'
    }
}, {
    timestamps: false
})

module.exports = Envio
