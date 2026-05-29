const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Planta = sequelize.define('plantas', {

    id_planta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre_comun: {
        type: DataTypes.STRING,
        allowNull: false
    },

    nombre_cientifico: {
        type: DataTypes.STRING
    },

    precio: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },

    stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    descripcion: {
        type: DataTypes.TEXT
    },

    imagen: {
        type: DataTypes.STRING
    },

    id_categoria: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

}, {
    timestamps: false
});

module.exports = Planta;
