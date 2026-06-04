# Sincronizar Render/Postgres a MySQL local

MySQL y Postgres son bases separadas. Si una venta se hace desde otro celular usando Render, se guarda en Postgres y no aparece sola en MySQL local.

Para copiar lo nuevo de Postgres a MySQL:

```powershell
$env:SOURCE_DATABASE_URL="postgresql://usuario:password@host.render.com/base"
npm run sync:pg-to-mysql
```

Usa la **External Database URL** de Render en `SOURCE_DATABASE_URL`.

El comando refresca estas tablas en MySQL local:

- roles
- categorias
- proveedores
- clientes
- empleados
- plantas
- ventas
- detalle_ventas
- envios
- inventario
- usuarios

Nota: la sincronizacion reemplaza los datos locales de esas tablas con lo que existe en Postgres.
