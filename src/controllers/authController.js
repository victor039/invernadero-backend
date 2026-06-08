const Empleado = require('../models/Empleado')

const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')

const limpiarEmpleado = (empleado) => {

    const data = empleado.toJSON()

    delete data.contraseña
    delete data.password_hash

    return data

}

exports.login = async (req, res) => {

    try {

        const usuario = req.body.usuario
        const contraseña = req.body.contraseña || req.body.contrasena || req.body.password

        const empleado = await Empleado.findOne({

            where: {

                usuario

            }

        })

        if (!empleado) {

            return res.status(404).json({

                mensaje: 'Usuario no encontrado'

            })

        }

        const passwordGuardada = empleado.password_hash || empleado.contraseña || ''

        let passwordValida = false
        let requiereRehash = false

        if (passwordGuardada.startsWith('$2')) {
            try {
                passwordValida = await bcrypt.compare(contraseña, passwordGuardada)
            } catch (error) {
                passwordValida = false
            }
        } else {
            passwordValida = passwordGuardada === contraseña
            requiereRehash = passwordValida
        }

        if (!passwordValida) {

            return res.status(401).json({

                mensaje: 'Contraseña incorrecta'

            })

        }

        if (requiereRehash) {
            const passwordHash = await bcrypt.hash(contraseña, 10)
            await empleado.update({
                contraseña: passwordHash,
                password_hash: passwordHash
            })
        }

        const token = jwt.sign(

            {

                id: empleado.id_empleado,

                usuario: empleado.usuario,

                id_rol: empleado.id_rol

            },

            process.env.JWT_SECRET,

            {

                expiresIn: '8h'

            }

        )

        res.json({

            mensaje: 'Login correcto',

            token,

            empleado: limpiarEmpleado(empleado)

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({

            mensaje: 'Error en login'

        })

    }

}
