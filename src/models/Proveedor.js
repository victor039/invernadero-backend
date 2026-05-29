const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Proveedor = sequelize.define('proveedores', {

    id_proveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre_empresa: {
        type: DataTypes.STRING,
        allowNull: false
    },

    contacto: {
        type: DataTypes.STRING
    },

    correo: {
        type: DataTypes.STRING
    },

    telefono: {
        type: DataTypes.STRING
    },

    direccion: {
        type: DataTypes.TEXT
    }

}, {
    timestamps: false
});

module.exports = Proveedor;