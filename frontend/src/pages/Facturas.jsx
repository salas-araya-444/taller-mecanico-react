/** Pantalla para facturar órdenes finalizadas y consultar las facturas. */
import { useEffect, useState } from "react";
import Alerta from "../components/Alerta";
import Paginacion from "../components/Paginacion";
import { obtenerTodos, pedirApi, tieneRol } from "../services/api";
import { formatearFecha, formatearMonto } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

export default function Facturas({ usuario }) {
    const [facturas, setFacturas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [ordenesFinalizadas, setOrdenesFinalizadas] = useState([]);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState("");
    const [filtroCliente, setFiltroCliente] = useState("");
    const [facturaVista, setFacturaVista] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    /** Solo el administrador y la recepcionista facturan. */
    const puedeFacturar = tieneRol(usuario, ["Administrador", "Recepcionista"]);

    /** Carga las facturas y los selectores una sola vez, al abrir la pantalla. */
    useEffect(() => {
        cargarFacturas();
        cargarSelectores();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar los clientes (filtro) y las órdenes listas para facturar.
*/

    async function cargarSelectores() {
        if (!puedeFacturar) return;

        try {
            setClientes(await obtenerTodos("/clientes/"));
            setOrdenesFinalizadas(await obtenerTodos("/ordenes/?estado=FINALIZADA"));
        } catch (err) {
            setError(err.message);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para consultar las facturas (filtro por cliente y paginación).
 * Si el usuario es mecánico, Django responde 403 y se muestra el mensaje.
*/

    async function cargarFacturas(pagina = 1, cliente = filtroCliente) {
        try {
            setCargando(true);
            setError("");

            let ruta = `/facturas/?page=${pagina}`;
            if (cliente) ruta += `&cliente=${cliente}`;

            const datos = await pedirApi(ruta);

            setFacturas(datos.resultados);
            setPaginaActual(datos.pagina_actual);
            setTotalPaginas(datos.total_paginas);
            setTotalRegistros(datos.total_registros);

        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para filtrar por cliente.
*/

    function cambiarFiltroCliente(e) {
        setFiltroCliente(e.target.value);
        cargarFacturas(1, e.target.value);
    }

/**----------------------------------------------------------------------------------------------
 * Función para facturar una orden.
 * Solo se envía la orden: Django calcula el subtotal, el IVA (13 %) y el total.
*/

    async function facturarOrden(e) {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (!ordenSeleccionada) {
            setError("Seleccione la orden que desea facturar...");
            return;
        }

        const confirmar = window.confirm(`¿Desea facturar la orden #${ordenSeleccionada}? La orden quedará cerrada.`);
        if (!confirmar) return;

        try {
            setProcesando(true);

            const factura = await pedirApi("/facturas/", "POST", { orden: Number(ordenSeleccionada) });

            setMensaje(`Factura ${factura.numero} creada. Total: ${formatearMonto(factura.total)}`);
            setOrdenSeleccionada("");

            /** Se actualizan las facturas y las órdenes pendientes de facturar. */
            await cargarFacturas(1);
            setOrdenesFinalizadas(await obtenerTodos("/ordenes/?estado=FINALIZADA"));

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para ver una factura con los repuestos de su orden.
*/

    async function verFactura(factura) {
        try {
            setError("");
            const datos = await pedirApi(`/facturas/${factura.id}/`);
            const orden = await pedirApi(`/ordenes/${datos.orden}/`);
            setFacturaVista({ ...datos, ordenDatos: orden });
        } catch (err) {
            setError(err.message);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-4">Facturas</h1>

            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {puedeFacturar && (
                <>
                    {/* Formulario para facturar una orden finalizada */}
                    <form onSubmit={facturarOrden} className="card card-body mb-4">
                        <h2 className="h5 mb-3">Facturar orden</h2>

                        <fieldset disabled={procesando} className="row g-2 align-items-end">
                            <div className="col-md-8">
                                <label className="form-label" htmlFor="orden">Orden finalizada</label>
                                <select id="orden" className="form-select"
                                    value={ordenSeleccionada}
                                    onChange={(e) => setOrdenSeleccionada(e.target.value)}
                                    required>
                                    <option value="">Seleccione una orden</option>
                                    {ordenesFinalizadas.map((orden) => (
                                        <option key={orden.id} value={orden.id}>
                                            Orden #{orden.id} - {orden.vehiculo_placa} (mano de obra {formatearMonto(orden.mano_obra)})
                                        </option>
                                    ))}
                                </select>
                                {ordenesFinalizadas.length === 0 && (
                                    <div className="form-text">No hay órdenes finalizadas pendientes de facturar.</div>
                                )}
                            </div>
                            <div className="col-md-4">
                                <button className="btn btn-primary w-100">
                                    {procesando ? "Procesando..." : "Facturar"}
                                </button>
                            </div>
                        </fieldset>
                    </form>

                    {/* Filtro por cliente */}
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                        <label htmlFor="filtro-cliente">Cliente:</label>
                        <select id="filtro-cliente" className="form-select w-auto"
                            value={filtroCliente}
                            onChange={cambiarFiltroCliente}>
                            <option value="">Todos</option>
                            {clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            <p className="text-muted small">
                Las facturas no se pueden editar ni eliminar para conservar el historial del taller.
            </p>

            {cargando ? (
                <p>Cargando facturas...</p>
            ) : facturas.length === 0 ? (
                <p>No hay facturas para mostrar.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Número</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Subtotal</th>
                                <th>IVA</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facturas.map((factura) => (
                                <tr key={factura.id}>
                                    <td>{factura.numero}</td>
                                    <td>{formatearFecha(factura.fecha)}</td>
                                    <td>{factura.cliente_nombre}</td>
                                    <td><span className="placa">{factura.vehiculo_placa}</span></td>
                                    <td>{formatearMonto(factura.subtotal)}</td>
                                    <td>{formatearMonto(factura.iva)}</td>
                                    <td><strong>{formatearMonto(factura.total)}</strong></td>
                                    <td>
                                        <button className="btn btn-outline-dark btn-sm"
                                            onClick={() => verFactura(factura)}>
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Paginacion
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                totalRegistros={totalRegistros}
                onCambiarPagina={(pagina) => cargarFacturas(pagina)}
                deshabilitado={cargando || procesando}
            />

            {/* Detalle de la factura seleccionada */}
            {facturaVista && (
                <div className="card card-body mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h5 mb-0">Factura {facturaVista.numero}</h2>
                        <button className="btn btn-outline-secondary btn-sm"
                            onClick={() => setFacturaVista(null)}>
                            Cerrar
                        </button>
                    </div>

                    <p className="mb-1">Fecha: {formatearFecha(facturaVista.fecha)}</p>
                    <p className="mb-1">Cliente: {facturaVista.cliente_nombre}</p>
                    <p className="mb-1">Vehículo: {facturaVista.vehiculo_placa} - Orden #{facturaVista.orden}</p>
                    <p>Falla atendida: {facturaVista.ordenDatos.falla_reportada}</p>

                    <div className="table-responsive">
                        <table className="table table-sm mb-2">
                            <thead className="table-light">
                                <tr>
                                    <th>Detalle</th>
                                    <th>Cantidad</th>
                                    <th>Precio</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Mano de obra</td>
                                    <td>1</td>
                                    <td>{formatearMonto(facturaVista.ordenDatos.mano_obra)}</td>
                                    <td>{formatearMonto(facturaVista.ordenDatos.mano_obra)}</td>
                                </tr>
                                {facturaVista.ordenDatos.detalles.map((detalle) => (
                                    <tr key={detalle.id}>
                                        <td>{detalle.repuesto_nombre}</td>
                                        <td>{detalle.cantidad}</td>
                                        <td>{formatearMonto(detalle.precio_aplicado)}</td>
                                        <td>{formatearMonto(detalle.cantidad * Number(detalle.precio_aplicado))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="mb-0 text-end">
                        Subtotal: {formatearMonto(facturaVista.subtotal)}<br />
                        IVA (13 %): {formatearMonto(facturaVista.iva)}<br />
                        <strong>Total: {formatearMonto(facturaVista.total)}</strong>
                    </p>
                </div>
            )}
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
