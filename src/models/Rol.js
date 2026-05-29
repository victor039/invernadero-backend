const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('roles', {

    id_rol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre_rol: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }

}, {
    timestamps: false
});

module.exports = Rol;