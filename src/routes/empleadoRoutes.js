const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware')
const upload = require('../config/multer')

const {
    crearEmpleado,
    obtenerEmpleados,
    actualizarEmpleado,
    eliminarEmpleado
} = require('../controllers/empleadoController');

router.post('/', authMiddleware, upload.single('foto'), crearEmpleado);

router.get('/', authMiddleware, obtenerEmpleados);

router.put('/:id', authMiddleware, upload.single('foto'), actualizarEmpleado);

router.delete('/:id', authMiddleware, eliminarEmpleado);

module.exports = router;
