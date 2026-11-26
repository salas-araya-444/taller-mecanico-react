/** Componente para ver una orden, cambiar su estado y agregar los repuestos usados. */
import { useEffect, useState } from "react";
import Alerta from "./Alerta";
import { obtenerTodos, pedirApi, tieneRol } from "../services/api";
import { ESTADOS, formatearMonto } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

export default function PanelOrden({ ordenId, usuario, onCambio, onCerrar }) {
    const [orden, setOrden] = useState(null);
    const [repuestos, setRepuestos] = useState([]);
    const [nuevoDetalle, setNuevoDetalle] = useState({ repuesto: "", cantidad: 1 });
    const [cantidades, setCantidades] = useState({});
    const [manoObra, setManoObra] = useState(0);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);

    /** El administrador y el mecánico pueden trabajar la orden. */
    const puedeTrabajar = tieneRol(usuario, ["Administrador", "Mecanico"]);

    /** Carga la orden cuando se abre el panel. */
    useEffect(() => {
        cargarOrden();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar la orden (con sus repuestos) y el inventario.
*/

    async function cargarOrden() {
        try {
            setError("");

            const datos = await pedirApi(`/ordenes/${ordenId}/`);
            setOrden(datos);
            setManoObra(datos.mano_obra);

            /** Guarda las cantidades para poder editarlas en la tabla. */
            const cantidadesActuales = {};
            for (const detalle of datos.detalles) {
                cantidadesActuales[detalle.id] = detalle.cantidad;
            }
            setCantidades(cantidadesActuales);

            /** El inventario se consulta de nuevo para ver el stock actualizado. */
            setRepuestos(await obtenerTodos("/repuestos/"));

        } catch (err) {
            setError(err.message);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función general para enviar una acción a la API y actualizar la pantalla.
*/

    async function ejecutarAccion(ruta, metodo, datos, textoExito) {
        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await pedirApi(ruta, metodo, datos);

            setMensaje(textoExito);
            await cargarOrden();

            /** Avisa a Ordenes.jsx para que actualice el listado. */
            await onCambio();
            return true;

        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setProcesando(false);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Funciones para cambiar el estado: RECIBIDA -> EN_REPARACION -> FINALIZADA.
*/

    function iniciarReparacion() {
        ejecutarAccion(
            `/ordenes/${ordenId}/cambiar-estado/`, "POST",
            { estado: "EN_REPARACION" },
            "La orden pasó a En reparación!"
        );
    }

    function finalizarOrden() {
        if (manoObra === "" || Number(manoObra) < 0) {
            setError("La mano de obra no puede estar vacía ni ser negativa...");
            return;
        }

        const confirmar = window.confirm("¿Desea finalizar la orden? Ya no se podrán cambiar los repuestos.");
        if (!confirmar) return;

        ejecutarAccion(
            `/ordenes/${ordenId}/cambiar-estado/`, "POST",
            { estado: "FINALIZADA", mano_obra: manoObra },
            "La orden se finalizó y está lista para facturar!"
        );
    }

/**----------------------------------------------------------------------------------------------
 * Funciones para los repuestos usados (tabla intermedia DetalleOrden).
*/

    async function agregarRepuesto(e) {
        e.preventDefault();

        if (!nuevoDetalle.repuesto || Number(nuevoDetalle.cantidad) < 1) {
            setError("Seleccione un repuesto y una cantidad mayor que cero...");
            return;
        }

        const correcto = await ejecutarAccion(
            `/ordenes/${ordenId}/detalles/`, "POST",
            { repuesto: Number(nuevoDetalle.repuesto), cantidad: Number(nuevoDetalle.cantidad) },
            "Repuesto agregado. El stock se descontó del inventario!"
        );

        /** Si se agregó bien, se limpia el formulario. */
        if (correcto) {
            setNuevoDetalle({ repuesto: "", cantidad: 1 });
        }
    }

    function cambiarCantidad(detalle) {
        const cantidad = Number(cantidades[detalle.id]);

        if (cantidad < 1) {
            setError("La cantidad debe ser mayor que cero...");
            return;
        }

        ejecutarAccion(
            `/ordenes/detalles/${detalle.id}/`, "PATCH",
            { cantidad: cantidad },
            "Cantidad actualizada. El inventario se ajustó!"
        );
    }

    function quitarRepuesto(detalle) {
        const confirmar = window.confirm(`¿Desea quitar ${detalle.repuesto_nombre} de la orden?`);
        if (!confirmar) return;

        ejecutarAccion(
            `/ordenes/detalles/${detalle.id}/`, "DELETE",
            null,
            "Repuesto quitado. Las unidades volvieron al inventario!"
        );
    }

/**--------------------------------------------------------------------------------------------*/

    if (!orden) {
        return (
            <div className="card card-body mt-4">
                <Alerta tipo="danger" mensaje={error} />
                {!error && <p className="mb-0">Cargando orden...</p>}
                <button className="btn btn-outline-secondary btn-sm align-self-start" onClick={onCerrar}>
                    Cerrar
                </button>
            </div>
        );
    }

    /** Total de repuestos: cantidad x precio aplicado de cada uno. */
    let totalRepuestos = 0;
    for (const detalle of orden.detalles) {
        totalRepuestos += detalle.cantidad * Number(detalle.precio_aplicado);
    }
    const enReparacion = orden.estado === "EN_REPARACION";

    return (
        <div className="card card-body mt-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 mb-0">
                    Orden #{orden.id} - {orden.vehiculo_placa}{" "}
                    <span className={`badge text-bg-${ESTADOS[orden.estado].color}`}>
                        {ESTADOS[orden.estado].nombre}
                    </span>
                </h2>
                <button className="btn btn-outline-secondary btn-sm" onClick={onCerrar}>
                    Cerrar
                </button>
            </div>

            <p className="mb-1">Mecánico: {orden.mecanico_nombre}</p>
            <p>Falla reportada: {orden.falla_reportada}</p>

            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {/* Botón para avanzar al siguiente estado */}
            {puedeTrabajar && orden.estado === "RECIBIDA" && (
                <button className="btn btn-warning align-self-start mb-3"
                    disabled={procesando}
                    onClick={iniciarReparacion}>
                    Iniciar reparación
                </button>
            )}

            {orden.estado === "FINALIZADA" && (
                <p className="text-success">La orden está finalizada. Ya se puede facturar en la pantalla Facturas.</p>
            )}

            {/* Tabla de repuestos usados */}
            <h3 className="h6">Repuestos usados</h3>
            {orden.detalles.length === 0 ? (
                <p>Todavía no se han registrado repuestos.</p>
            ) : (
                <div className="table-responsive mb-2">
                    <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Repuesto</th>
                                <th>Cantidad</th>
                                <th>Precio aplicado</th>
                                <th>Subtotal</th>
                                {puedeTrabajar && enReparacion && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {orden.detalles.map((detalle) => (
                                <tr key={detalle.id}>
                                    <td>{detalle.repuesto_nombre}</td>
                                    <td>
                                        {puedeTrabajar && enReparacion ? (
                                            <input type="number" min="1"
                                                className="form-control form-control-sm w-auto"
                                                aria-label="Cantidad"
                                                value={cantidades[detalle.id]}
                                                onChange={(e) => setCantidades({
                                                    ...cantidades,
                                                    [detalle.id]: e.target.value,
                                                })} />
                                        ) : (
                                            detalle.cantidad
                                        )}
                                    </td>
                                    <td>{formatearMonto(detalle.precio_aplicado)}</td>
                                    <td>{formatearMonto(detalle.cantidad * Number(detalle.precio_aplicado))}</td>
                                    {puedeTrabajar && enReparacion && (
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <button className="btn btn-outline-primary btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => cambiarCantidad(detalle)}>
                                                    Cambiar
                                                </button>
                                                <button className="btn btn-outline-danger btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => quitarRepuesto(detalle)}>
                                                    Quitar
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p>
                Repuestos: {formatearMonto(totalRepuestos)} - Mano de obra: {formatearMonto(orden.mano_obra)}
            </p>

            {/* Agregar repuestos y finalizar (solo En reparación) */}
            {puedeTrabajar && enReparacion && (
                <>
                    <form onSubmit={agregarRepuesto} className="row g-2 align-items-end mb-3">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="nuevo-repuesto">Agregar repuesto</label>
                            <select id="nuevo-repuesto" className="form-select"
                                value={nuevoDetalle.repuesto}
                                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, repuesto: e.target.value })}>
                                <option value="">Seleccione un repuesto</option>
                                {repuestos.map((repuesto) => (
                                    <option key={repuesto.id} value={repuesto.id}>
                                        {repuesto.nombre} - {formatearMonto(repuesto.precio)} (stock: {repuesto.stock})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className="form-label" htmlFor="nuevo-cantidad">Cantidad</label>
                            <input id="nuevo-cantidad" type="number" min="1" className="form-control"
                                value={nuevoDetalle.cantidad}
                                onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, cantidad: e.target.value })} />
                        </div>
                        <div className="col-6 col-md-3">
                            <button className="btn btn-primary w-100" disabled={procesando}>Agregar</button>
                        </div>
                    </form>

                    <div className="row g-2 align-items-end">
                        <div className="col-md-6">
                            <label className="form-label" htmlFor="mano-obra-final">Mano de obra final (₡)</label>
                            <input id="mano-obra-final" type="number" min="0" step="0.01" className="form-control"
                                value={manoObra}
                                onChange={(e) => setManoObra(e.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <button className="btn btn-success w-100"
                                disabled={procesando}
                                onClick={finalizarOrden}>
                                Finalizar orden
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/**--------------------------------------------------------------------------------------------*/
