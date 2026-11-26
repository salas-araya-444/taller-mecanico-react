# Documentación del frontend - Taller Mecánico

Proyecto Programado #2 - Desarrollo de Software IV (IF-0009), UCR Sede Regional del Pacífico.

---

## 1. Cómo funciona la aplicación

1. **Inicio de sesión:** la pantalla de login envía el usuario y la contraseña a `POST /api/token/`. Django devuelve un **token**.
2. **Sesión:** el token y los datos del usuario (con su rol) se guardan en el `localStorage` del navegador, así la sesión se mantiene aunque se recargue la página.
3. **Llamadas a la API:** todas pasan por `services/api.js` (función `pedirApi`), que agrega el encabezado `Authorization: Token <token>` y convierte los errores de la API (400, 401, 403, 404, 409) en mensajes en español.
4. **Rutas:** `App.jsx` define las rutas con React Router. Las pantallas privadas usan `RutaProtegida`, que manda al login si no hay sesión.
5. **Permisos:** el frontend oculta los botones y menús que el rol no puede usar, pero **quien decide siempre es el backend**. Si se intenta algo sin permiso, la API responde 403 y la pantalla muestra el aviso.
6. **Cerrar sesión:** llama a `POST /api/logout/`, que borra el token en el servidor, y limpia el `localStorage`.

**Cambios hechos al backend del Proyecto 1 para el frontend**

- `django-cors-headers`: permite que React (puerto 5173) llame a la API (puerto 8000).
- `POST /api/logout/`: borra el token del usuario.
- `GET /api/mecanicos/`: lista de mecánicos para el formulario de órdenes.
- Campos de solo lectura en los serializers (`cliente_nombre`, `vehiculo_placa`, `mecanico_nombre`, `repuesto_nombre`) para mostrar nombres en las tablas en lugar de solo números.
- El superusuario se muestra con el rol "Administrador".

---

## 2. Pantallas y endpoints que usan

| Pantalla | Ruta | Qué permite | Endpoints |
|---|---|---|---|
| Login | `/login` | Iniciar sesión | `POST /api/token/`, `GET /api/perfil/` |
| Inicio | `/` | Indicadores del taller y accesos a los módulos; reportes para el administrador | `GET /api/clientes/`, `GET /api/vehiculos/`, `GET /api/ordenes/?estado=...`, `GET /api/reportes/` |
| Clientes | `/clientes` | Listar, buscar, crear, editar y eliminar; ver los vehículos de un cliente | `GET/POST /api/clientes/`, `PUT/DELETE /api/clientes/{id}/` |
| Vehículos | `/vehiculos` | Listar con filtros (cliente, marca, año, placa), crear, editar, eliminar y ver historial | `GET/POST /api/vehiculos/`, `PUT/DELETE /api/vehiculos/{id}/`, `GET /api/vehiculos/{id}/historial/` |
| Repuestos | `/repuestos` | Listar, buscar, ordenar, crear, editar y eliminar; aviso de stock bajo | `GET/POST /api/repuestos/`, `PUT/DELETE /api/repuestos/{id}/` |
| Órdenes | `/ordenes` | Listar con filtros (estado, mecánico, vehículo), abrir, editar y eliminar órdenes | `GET/POST /api/ordenes/`, `PUT/DELETE /api/ordenes/{id}/`, `GET /api/mecanicos/` |
| Panel de la orden | `/ordenes` (botón Gestionar) | Cambiar el estado, agregar, cambiar y quitar repuestos, finalizar con la mano de obra | `GET /api/ordenes/{id}/`, `POST /api/ordenes/{id}/cambiar-estado/`, `POST /api/ordenes/{id}/detalles/`, `PUT/DELETE /api/ordenes/detalles/{id}/` |
| Facturas | `/facturas` | Facturar órdenes finalizadas, listar, filtrar por cliente y ver el detalle | `GET/POST /api/facturas/`, `GET /api/facturas/{id}/`, `GET /api/ordenes/?estado=FINALIZADA` |
| Menú | todas | Navegación y cerrar sesión | `POST /api/logout/` |

---

## 3. Matriz de permisos

| Acción | Administrador | Recepcionista | Mecánico |
|---|---|---|---|
| Ver clientes y vehículos | ✅ | ✅ | ✅ |
| Crear, editar y eliminar clientes y vehículos | ✅ | ✅ | ❌ |
| Ver repuestos | ✅ | ✅ | ✅ |
| Crear, editar y eliminar repuestos | ✅ | ❌ | ❌ |
| Ver órdenes | ✅ todas | ✅ todas | ✅ solo las suyas |
| Abrir y editar órdenes | ✅ | ✅ | ❌ |
| Eliminar órdenes (solo en estado Recibida) | ✅ | ❌ | ❌ |
| Cambiar estado y repuestos de la orden | ✅ | ❌ | ✅ solo las suyas |
| Facturar y ver facturas | ✅ | ✅ | ❌ |
| Ver reportes en el inicio | ✅ | ❌ | ❌ |

### Escenarios de prueba de permisos

| # | Usuario | Acción | Resultado esperado |
|---|---|---|---|
| 1 | Sin sesión | Entrar a `/clientes` | Lo manda al login |
| 2 | Cualquiera | Contraseña incorrecta | Mensaje "Usuario o contraseña incorrectos" |
| 3 | Administrador | Entrar al inicio | Ve indicadores, total facturado y repuestos por reponer |
| 4 | Recepcionista | Entrar al inicio | Ve indicadores, sin los reportes del administrador |
| 5 | Recepcionista | Entrar a Repuestos | Solo consulta: sin formulario ni botones de editar o eliminar |
| 6 | Recepcionista | Crear un cliente | Se guarda correctamente |
| 7 | Mecánico | Ver el menú | No aparece "Facturas" |
| 8 | Mecánico | Escribir `/facturas` en la barra | La API responde 403 y se muestra el aviso |
| 9 | Mecánico | Ver órdenes | Solo ve las órdenes asignadas a él |
| 10 | Mecánico | Gestionar su orden | Puede iniciar la reparación, agregar repuestos y finalizar |
| 11 | Administrador | Eliminar una orden que no está en Recibida | La API responde 409 y no se elimina |
| 12 | Cualquiera | Cerrar sesión | Se borra el token; si se usa otra vez, la API responde 401 |

---

## 4. Flujo de una orden

```
RECIBIDA  ->  EN REPARACIÓN  ->  FINALIZADA  ->  FACTURADA
 (se abre)    (se agregan        (se pone la     (se crea la factura;
              repuestos, baja    mano de obra    ya no se puede
              el stock)          final)          modificar)
```

- Los repuestos solo se agregan cuando la orden está **En reparación**, y al agregarlos se descuenta el stock.
- La factura calcula sola: subtotal (repuestos + mano de obra), IVA del 13 % y total.
- Una factura no se puede editar ni eliminar, para conservar el historial del taller.

---

## 5. Cosas que se usaron y no se vieron en clase

| Qué es | Para qué se usó | Dónde está |
|---|---|---|
| React Router (`Routes`, `Route`, `NavLink`, `Navigate`, `useNavigate`) | Rutas de la aplicación y navegación sin recargar la página | `App.jsx`, `Menu.jsx`, `RutaProtegida.jsx` |
| `useSearchParams` | Leer el `?cliente=` cuando se viene desde Clientes | `Vehiculos.jsx` |
| `Promise.all` | Hacer varias consultas a la vez en el inicio | `Dashboard.jsx` |
| `encodeURIComponent` | Enviar en la búsqueda nombres con espacios y tildes | `Clientes.jsx` |
| `key` en un componente | Que el panel se vuelva a cargar al abrir otra orden | `Ordenes.jsx` |
| Variables de entorno de Vite (`import.meta.env`) | Dirección de la API en el `.env` | `services/api.js` |
| `django-cors-headers` | Permitir que React llame a Django desde otro puerto | `backend/taller_backend/settings.py` |
| SVG dentro de JSX | Dibujar el logo y los íconos del inicio | `Logo.jsx`, `Icono.jsx` |
| Variables de CSS (`:root`, `var(--nombre)`) | Colores del diseño en un solo lugar | `index.css` |

---

## 6. Capturas de pantalla

Están en [`capturas/`](capturas/):

| Archivo | Qué muestra |
|---|---|
| `01-login.png` | Pantalla de inicio de sesión |
| `02-login-error.png` | Mensaje con contraseña incorrecta |
| `03-dashboard-admin.png` | Inicio del administrador con indicadores y reportes |
| `04-clientes.png` | Clientes |
| `05-vehiculos.png` | Vehículos con las placas |
| `06-historial-vehiculo.png` | Historial de reparaciones de un vehículo |
| `07-repuestos.png` | Repuestos con aviso de stock bajo |
| `08-ordenes.png` | Órdenes en distintos estados |
| `09-panel-orden.png` | Panel de una orden en reparación |
| `10-facturas.png` | Lista de facturas |
| `11-detalle-factura.png` | Detalle de una factura con subtotal, IVA y total |
| `12-dashboard-recepcion.png` | Inicio de la recepcionista |
| `13-repuestos-recepcion.png` | Repuestos en modo consulta (recepcionista) |
| `14-dashboard-mecanico.png` | Inicio del mecánico, sin Facturas en el menú |
| `15-facturas-mecanico.png` | Mecánico sin permiso para facturas (403) |
| `16-movil-1.png` a `16-movil-3.png` | Vista en celular |
