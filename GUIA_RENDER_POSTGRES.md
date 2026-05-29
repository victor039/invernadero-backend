# Pasar la base de datos a PostgreSQL en Render

## 1. Crear la base en Render

En Render crea una base de datos PostgreSQL. Cuando Render te muestre las conexiones, usa la **Internal Database URL** si tu backend tambien estara en Render.

## 2. Variables de entorno del backend

En el servicio del backend agrega:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:5432/BASE
DB_DIALECT=postgres
DB_SYNC=true
JWT_SECRET=tu_clave
```

`DB_SYNC=true` permite que Sequelize cree las tablas en la base vacia. Despues del primer arranque puedes cambiarlo a `false`.

## 3. Generar el respaldo para PostgreSQL

En el sistema entra como administrador:

```txt
/respaldo
```

Presiona **Para PostgreSQL**. Eso descarga un archivo `.sql` con los registros en formato compatible con PostgreSQL.

## 4. Importar datos

Abre la base PostgreSQL en una herramienta como DBeaver, TablePlus o pgAdmin y ejecuta el archivo `.sql` descargado.

Flujo recomendado:

1. Arrancar el backend con `DB_SYNC=true` para que cree tablas.
2. Ejecutar el `.sql` de respaldo para PostgreSQL.
3. Cambiar `DB_SYNC=false` para evitar cambios automaticos en tablas.

## 5. Nota para el frontend

Si tambien subes el frontend a internet, agrega esta variable:

```env
VITE_API_URL=https://TU-BACKEND.onrender.com/api
```

En local no necesitas ponerla porque el proyecto usa `http://localhost:3000/api` como valor por defecto.
