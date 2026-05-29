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
    },

    tipo_cliente: {
        type: DataTypes.STRING,
        defaultValue: 'registrado'
    },

    cliente_paso: {
        type: DataTypes.STRING,
        allowNull: true
    },

    metodo_pago: {
        type: DataTypes.STRING,
        allowNull: true
    },

    referencia_pago: {
        type: DataTypes.STRING,
        allowNull: true
    },

    ticket_descarga: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    ticket_whatsapp: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    ticket_correo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    telefono_ticket: {
        type: DataTypes.STRING,
        allowNull: true
    },

    correo_ticket: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, {
    timestamps: false
});

module.exports = Venta;
