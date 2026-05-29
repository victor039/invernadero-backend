const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Cliente = sequelize.define('clientes', {

    id_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },

    apellido: {
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
    },

    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

}, {
    tableName: 'clientes',
    timestamps: false
})

module.exports = Cliente
