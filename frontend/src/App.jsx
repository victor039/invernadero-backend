import { Routes, Route } from 'react-router-dom'

import Login from './pages/Login'

import Dashboard from './pages/Dashboard'

import Plantas from './pages/Plantas'

import PrivateRoute from './routes/PrivateRoute'

import Ventas from './pages/Ventas'

import Reportes from './pages/Reportes'

import Empleados from './pages/Empleados'

import Ganancias from './pages/Ganancias'

import Clientes from './pages/Clientes'

import Proveedores from './pages/Proveedores'

import Respaldo from './pages/Respaldo'

import NotFound from './pages/NotFound'
function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/plantas"
        element={
          <PrivateRoute>
            <Plantas />
          </PrivateRoute>
        }
      />

      <Route
        path="/ventas"
        element={
          <PrivateRoute>
            <Ventas />
          </PrivateRoute>
        }
      />

      <Route
        path="/reportes"
        element={
          <PrivateRoute>
            <Reportes />
          </PrivateRoute>
        }
      />

      <Route
        path="/empleados"
        element={
          <PrivateRoute rolesPermitidos={[1]}>
            <Empleados />
          </PrivateRoute>
        }
      />

      <Route
        path="/ganancias"
        element={
          <PrivateRoute rolesPermitidos={[1]}>
            <Ganancias />
          </PrivateRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <PrivateRoute rolesPermitidos={[1]}>
            <Clientes />
          </PrivateRoute>
        }
      />

      <Route
        path="/proveedores"
        element={
          <PrivateRoute rolesPermitidos={[1]}>
            <Proveedores />
          </PrivateRoute>
        }
      />

      <Route
        path="/respaldo"
        element={
          <PrivateRoute rolesPermitidos={[1]}>
            <Respaldo />
          </PrivateRoute>
        }
      />

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>

  )

}

export default App
