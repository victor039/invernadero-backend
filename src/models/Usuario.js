const { DataTypes } = require('sequelize')

const sequelize = require('../config/database')

const Usuario = sequelize.define('usuarios', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },

    correo: {
        type: DataTypes.STRING,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    rol: {
        type: DataTypes.STRING,
        defaultValue: 'empleado'
    }
}, {
    timestamps: false
})

module.exports = Usuario
