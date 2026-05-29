import { Navigate } from 'react-router-dom'

function PrivateRoute({ children, rolesPermitidos }) {

    const token = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const rolUsuario = Number(usuario.id_rol)

    if (!token) return <Navigate to="/" />

    if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario)) {
        return <Navigate to="/dashboard" replace />
    }

    return children

}

export default PrivateRoute
