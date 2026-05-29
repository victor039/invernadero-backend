const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware')

const {
    crearEmpleado,
    obtenerEmpleados,
    actualizarEmpleado,
    eliminarEmpleado
} = require('../controllers/empleadoController');

router.post('/', authMiddleware, crearEmpleado);

router.get('/', authMiddleware, obtenerEmpleados);

router.put('/:id', authMiddleware, actualizarEmpleado);

router.delete('/:id', authMiddleware, eliminarEmpleado);

module.exports = router;
