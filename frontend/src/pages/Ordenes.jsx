/** Pantalla que administra las órdenes de servicio. */
import { useEffect, useState } from "react";
import Alerta from "../components/Alerta";
import Paginacion from "../components/Paginacion";
import PanelOrden from "../components/PanelOrden";
import { obtenerTodos, pedirApi, tieneRol } from "../services/api";
import { ESTADOS, formatearFecha, formatearMonto } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

const formularioInicial = {
    vehiculo: "",
    mecanico: "",
    falla_reportada: "",
    mano_obra: 0,
};

const filtrosIniciales = {
    estado: "",
    mecanico: "",
    vehiculo: "",
};

export default function Ordenes({ usuario }) {
    const [ordenes, setOrdenes] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [mecanicos, setMecanicos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [filtros, setFiltros] = useState(filtrosIniciales);
    const [ordenAbiertaId, setOrdenAbiertaId] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    /** Permisos para mostrar u ocultar botones. */
    const puedeModificar = tieneRol(usuario, ["Administrador", "Recepcionista"]);
    const puedeEliminar = tieneRol(usuario, ["Administrador"]);
    const esMecanico = tieneRol(usuario, ["Mecanico"]);

    /** Carga las órdenes y los selectores una sola vez, al abrir la pantalla. */
    useEffect(() => {
        cargarOrdenes();
        cargarSelectores();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar los vehículos y mecánicos de los selectores.
*/

    async function cargarSelectores() {
        try {
            setVehiculos(await obtenerTodos("/vehiculos/"));
            setMecanicos(await pedirApi("/mecanicos/"));
        } catch (err) {
            setError(err.message);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para consultar las órdenes con los filtros combinados.
 * El mecánico solo recibe sus propias órdenes (lo decide Django).
*/

    async function cargarOrdenes(pagina = 1, filtrosUsados = filtros) {
        try {
            setCargando(true);
            setError("");

            /** Los filtros se agregan a la URL solo si tienen un valor. */
            let ruta = `/ordenes/?page=${pagina}`;
            if (filtrosUsados.estado) ruta += `&estado=${filtrosUsados.estado}`;
            if (filtrosUsados.mecanico) ruta += `&mecanico=${filtrosUsados.mecanico}`;
            if (filtrosUsados.vehiculo) ruta += `&vehiculo=${filtrosUsados.vehiculo}`;

            const datos = await pedirApi(ruta);

            setOrdenes(datos.resultados);
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
 * Funciones para los filtros.
*/

    function manejarCambioFiltro(e) {
        setFiltros({
            ...filtros,
            [e.target.name]: e.target.value,
        });
    }

    function aplicarFiltros(e) {
        e.preventDefault();
        cargarOrdenes(1);
    }

    function limpiarFiltros() {
        setFiltros(filtrosIniciales);
        cargarOrdenes(1, filtrosIniciales);
    }

/**----------------------------------------------------------------------------------------------
 * Función para manejar cambios del formulario.
*/

    function manejarCambio(e) {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value,
        });
    }

/**----------------------------------------------------------------------------------------------
 * Función para validar los campos antes de enviarlos.
*/

    function validarFormulario() {
        if (!formulario.vehiculo || !formulario.mecanico || !formulario.falla_reportada.trim()) {
            setError("Debe seleccionar el vehículo y el mecánico, y describir la falla...");
            return false;
        }

        if (formulario.mano_obra === "" || Number(formulario.mano_obra) < 0) {
            setError("La mano de obra no puede estar vacía ni ser negativa...");
            return false;
        }

        return true;
    }

/**----------------------------------------------------------------------------------------------
 * Función para guardar una orden (abrirla o actualizarla).
 * El estado no se envía: siempre inicia en RECIBIDA y se cambia desde "Gestionar".
*/

    async function guardarOrden(e) {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (!validarFormulario()) return;

        const datos = {
            vehiculo: Number(formulario.vehiculo),
            mecanico: Number(formulario.mecanico),
            falla_reportada: formulario.falla_reportada,
            mano_obra: formulario.mano_obra,
        };

        try {
            setProcesando(true);

            if (editandoId === null) {
                await pedirApi("/ordenes/", "POST", datos);
                setMensaje("Orden abierta correctamente!");
                await cargarOrdenes(1);
            } else {
                await pedirApi(`/ordenes/${editandoId}/`, "PATCH", datos);
                setMensaje("Orden actualizada correctamente!");
                await cargarOrdenes(paginaActual);
            }

            setFormulario(formularioInicial);
            setEditandoId(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Funciones para editar y cancelar la edición.
*/

    function iniciarEdicion(orden) {
        setEditandoId(orden.id);

        /** String pasa los id a texto porque el select usa texto. */
        setFormulario({
            vehiculo: String(orden.vehiculo),
            mecanico: String(orden.mecanico),
            falla_reportada: orden.falla_reportada,
            mano_obra: orden.mano_obra,
        });

        setMensaje("");
        setError("");
    }

    function cancelarEdicion() {
        setEditandoId(null);
        setFormulario(formularioInicial);
        setError("");
        setMensaje("");
    }

/**----------------------------------------------------------------------------------------------
 * Función para eliminar una orden.
 * Django solo permite eliminar órdenes en estado Recibida (si no, responde 409).
*/

    async function eliminarOrden(orden) {
        const confirmar = window.confirm(`¿Desea eliminar la orden #${orden.id}?`);

        if (!confirmar) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await pedirApi(`/ordenes/${orden.id}/`, "DELETE");

            if (editandoId === orden.id) {
                cancelarEdicion();
            }
            if (ordenAbiertaId === orden.id) {
                setOrdenAbiertaId(null);
            }

            await cargarOrdenes(paginaActual);
            setMensaje("Orden eliminada correctamente!");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-4">Órdenes de servicio</h1>

            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {/* Formulario para abrir y editar órdenes (administrador y recepcionista) */}
            {puedeModificar && (
                <form onSubmit={guardarOrden} className="card card-body mb-4">
                    <h2 className="h5 mb-3">
                        {editandoId === null ? "Abrir orden" : `Editar orden #${editandoId}`}
                    </h2>

                    <fieldset disabled={procesando}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="vehiculo">Vehículo</label>
                                <select id="vehiculo" className="form-select"
                                    name="vehiculo"
                                    value={formulario.vehiculo}
                                    onChange={manejarCambio}
                                    required>
                                    <option value="">Seleccione un vehículo</option>
                                    {vehiculos.map((vehiculo) => (
                                        <option key={vehiculo.id} value={vehiculo.id}>
                                            {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} ({vehiculo.cliente_nombre})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="mecanico">Mecánico</label>
                                <select id="mecanico" className="form-select"
                                    name="mecanico"
                                    value={formulario.mecanico}
                                    onChange={manejarCambio}
                                    required>
                                    <option value="">Seleccione un mecánico</option>
                                    {mecanicos.map((mecanico) => (
                                        <option key={mecanico.id} value={mecanico.id}>
                                            {mecanico.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-8">
                                <label className="form-label" htmlFor="falla_reportada">Falla reportada</label>
                                <textarea id="falla_reportada" className="form-control"
                                    name="falla_reportada"
                                    rows="2"
                                    value={formulario.falla_reportada}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="mano_obra">Mano de obra (₡)</label>
                                <input id="mano_obra" type="number" className="form-control"
                                    name="mano_obra"
                                    min="0"
                                    step="0.01"
                                    value={formulario.mano_obra}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-primary">
                                {procesando
                                    ? "Procesando..."
                                    : editandoId === null ? "Abrir orden" : "Actualizar"}
                            </button>

                            {editandoId !== null && (
                                <button className="btn btn-secondary" type="button"
                                    onClick={cancelarEdicion}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </fieldset>
                </form>
            )}

            {/* Filtros combinables: estado, mecánico y vehículo */}
            <form onSubmit={aplicarFiltros} className="row g-2 align-items-end mb-3">
                <div className="col-sm-4 col-lg-3">
                    <label className="form-label" htmlFor="filtro-estado">Estado</label>
                    <select id="filtro-estado" className="form-select"
                        name="estado"
                        value={filtros.estado}
                        onChange={manejarCambioFiltro}>
                        <option value="">Todos</option>
                        <option value="RECIBIDA">Recibida</option>
                        <option value="EN_REPARACION">En reparación</option>
                        <option value="FINALIZADA">Finalizada</option>
                        <option value="FACTURADA">Facturada</option>
                    </select>
                </div>

                {/* El mecánico ya ve solo sus órdenes, por eso no necesita este filtro */}
                {!esMecanico && (
                    <div className="col-sm-4 col-lg-3">
                        <label className="form-label" htmlFor="filtro-mecanico">Mecánico</label>
                        <select id="filtro-mecanico" className="form-select"
                            name="mecanico"
                            value={filtros.mecanico}
                            onChange={manejarCambioFiltro}>
                            <option value="">Todos</option>
                            {mecanicos.map((mecanico) => (
                                <option key={mecanico.id} value={mecanico.id}>{mecanico.username}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="col-sm-4 col-lg-3">
                    <label className="form-label" htmlFor="filtro-vehiculo">Vehículo</label>
                    <select id="filtro-vehiculo" className="form-select"
                        name="vehiculo"
                        value={filtros.vehiculo}
                        onChange={manejarCambioFiltro}>
                        <option value="">Todos</option>
                        {vehiculos.map((vehiculo) => (
                            <option key={vehiculo.id} value={vehiculo.id}>{vehiculo.placa}</option>
                        ))}
                    </select>
                </div>

                <div className="col-lg-3 d-flex gap-2">
                    <button className="btn btn-outline-primary">Filtrar</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                </div>
            </form>

            {cargando ? (
                <p>Cargando órdenes...</p>
            ) : ordenes.length === 0 ? (
                <p>No hay órdenes con esos filtros.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Vehículo</th>
                                <th>Mecánico</th>
                                <th>Estado</th>
                                <th>Ingreso</th>
                                <th>Mano de obra</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenes.map((orden) => (
                                <tr key={orden.id}>
                                    <td>{orden.id}</td>
                                    <td>{orden.vehiculo_placa}</td>
                                    <td>{orden.mecanico_nombre}</td>
                                    <td>
                                        <span className={`badge text-bg-${ESTADOS[orden.estado].color}`}>
                                            {ESTADOS[orden.estado].nombre}
                                        </span>
                                    </td>
                                    <td>{formatearFecha(orden.fecha_ingreso)}</td>
                                    <td>{formatearMonto(orden.mano_obra)}</td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1">
                                            {/* Abre el panel con los estados y los repuestos usados */}
                                            <button className="btn btn-outline-dark btn-sm"
                                                onClick={() => setOrdenAbiertaId(orden.id)}>
                                                Gestionar
                                            </button>

                                            {/* Una orden facturada ya no se modifica */}
                                            {puedeModificar && orden.estado !== "FACTURADA" && (
                                                <button className="btn btn-outline-primary btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => iniciarEdicion(orden)}>
                                                    Editar
                                                </button>
                                            )}

                                            {puedeEliminar && (
                                                <button className="btn btn-danger btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => eliminarOrden(orden)}>
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
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
                onCambiarPagina={(pagina) => cargarOrdenes(pagina)}
                deshabilitado={cargando || procesando}
            />

            {/* Panel de la orden seleccionada (estados y repuestos usados) */}
            {ordenAbiertaId !== null && (
                /* key hace que el panel se vuelva a cargar al abrir otra orden */
                <PanelOrden
                    key={ordenAbiertaId}
                    ordenId={ordenAbiertaId}
                    usuario={usuario}
                    onCambio={() => cargarOrdenes(paginaActual)}
                    onCerrar={() => setOrdenAbiertaId(null)}
                />
            )}
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
