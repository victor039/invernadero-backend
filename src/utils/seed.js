const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const Rol = require('../models/Rol');
const Empleado = require('../models/Empleado');
const Categoria = require('../models/Categoria');
const Proveedor = require('../models/Proveedor');
const Planta = require('../models/Planta');
const Venta = require('../models/Venta');
const DetalleVenta = require('../models/DetalleVenta');

async function seed() {
    try {
        await sequelize.sync({ force: true });

        // Roles
        const adminRol = await Rol.create({ nombre_rol: 'Administrador' });
        const empRol = await Rol.create({ nombre_rol: 'Empleado' });

        // Empleados (passwords hashed)
        const hash1 = await bcrypt.hash('123456', 10);
        const hash2 = await bcrypt.hash('123456', 10);

        await Empleado.create({
            nombre: 'Victor',
            apellido: 'Navarrete',
            correo: 'admin@invernadero.com',
            telefono: '5551234567',
            foto: 'admin.jpg',
            usuario: 'admin',
            contraseña: hash1,
            id_rol: adminRol.id_rol
        });

        await Empleado.create({
            nombre: 'Carlos',
            apellido: 'Lopez',
            correo: 'empleado@invernadero.com',
            telefono: '5559876543',
            foto: 'empleado.jpg',
            usuario: 'empleado',
            contraseña: hash2,
            id_rol: empRol.id_rol
        });

        // Clientes
        await sequelize.query(`INSERT INTO clientes (nombre, apellido, correo, telefono, direccion) VALUES
            ('Juan','Perez','juan@gmail.com','5551112233','Ciudad de México'),
            ('Maria','Gonzalez','maria@gmail.com','5554445566','Puebla')
        `);

        // Proveedores
        await Proveedor.bulkCreate([
            { nombre_empresa: 'Vivero Central', contacto: 'Luis Ramirez', correo: 'vivero@gmail.com', telefono: '5551234567', direccion: 'Ciudad de México' },
            { nombre_empresa: 'Eco Garden', contacto: 'Ana Torres', correo: 'eco@gmail.com', telefono: '5559876543', direccion: 'Guadalajara' },
            { nombre_empresa: 'Naturaleza Viva', contacto: 'Pedro Martinez', correo: 'naturaleza@gmail.com', telefono: '5557778899', direccion: 'Monterrey' }
        ]);

        // Categorias
        await Categoria.bulkCreate([
            { nombre_categoria: 'Ornamentales', descripcion: 'Plantas decorativas' },
            { nombre_categoria: 'Medicinales', descripcion: 'Plantas medicinales' },
            { nombre_categoria: 'Suculentas', descripcion: 'Plantas resistentes' },
            { nombre_categoria: 'Interior', descripcion: 'Plantas para interiores' },
            { nombre_categoria: 'Exterior', descripcion: 'Plantas para exteriores' }
        ]);

        // Plantas
        await Planta.bulkCreate([
            { nombre_comun: 'Girasol', nombre_cientifico: 'Helianthus annuus', precio: 250.00, stock: 150, descripcion: 'Planta ornamental amarilla', imagen: 'girasol.jpg', id_categoria: 1, id_proveedor: 1 },
            { nombre_comun: 'Lavanda', nombre_cientifico: 'Lavandula angustifolia', precio: 180.00, stock: 80, descripcion: 'Planta medicinal aromática', imagen: 'lavanda.jpg', id_categoria: 2, id_proveedor: 2 },
            { nombre_comun: 'Aloe Vera', nombre_cientifico: 'Aloe barbadensis', precio: 120.00, stock: 60, descripcion: 'Planta medicinal decorativa', imagen: 'aloe.jpg', id_categoria: 2, id_proveedor: 1 },
            { nombre_comun: 'Cactus Bola', nombre_cientifico: 'Echinocactus grusonii', precio: 90.00, stock: 100, descripcion: 'Suculenta resistente', imagen: 'cactus.jpg', id_categoria: 3, id_proveedor: 3 },
            { nombre_comun: 'Monstera', nombre_cientifico: 'Monstera deliciosa', precio: 350.00, stock: 40, descripcion: 'Planta tropical de interior', imagen: 'monstera.jpg', id_categoria: 4, id_proveedor: 2 }
        ]);

        // Ventas
        await Venta.bulkCreate([
            { id_cliente: 1, id_empleado: 1, total: 500.00 },
            { id_cliente: 2, id_empleado: 2, total: 850.00 }
        ]);

        // Detalle Ventas
        await DetalleVenta.bulkCreate([
            { id_venta: 1, id_planta: 1, cantidad: 2, precio_unitario: 250.00, subtotal: 500.00 },
            { id_venta: 2, id_planta: 5, cantidad: 1, precio_unitario: 350.00, subtotal: 350.00 },
            { id_venta: 2, id_planta: 4, cantidad: 5, precio_unitario: 100.00, subtotal: 500.00 }
        ]);

        console.log('Seed completado.');
        process.exit(0);

    } catch (error) {
        console.error('Error en seed:', error);
        process.exit(1);
    }
}

seed();
