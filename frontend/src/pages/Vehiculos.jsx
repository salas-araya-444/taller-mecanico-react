/** Pantalla que administra los vehículos de los clientes. */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Alerta from "../components/Alerta";
import Paginacion from "../components/Paginacion";
import { obtenerTodos, pedirApi, tieneRol } from "../services/api";
import { ESTADOS, formatearFecha } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

const formularioInicial = {
    cliente: "",
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    kilometraje: 0,
};

const filtrosIniciales = {
    cliente: "",
    marca: "",
    anio: "",
    buscar: "",
};

export default function Vehiculos({ usuario }) {
    /** useSearchParams lee el ?cliente= que viene desde la pantalla de Clientes. */
    const [parametros] = useSearchParams();

    const [vehiculos, setVehiculos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [filtros, setFiltros] = useState({
        ...filtrosIniciales,
        cliente: parametros.get("cliente") || "",
    });
    const [historial, setHistorial] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    /** Solo el administrador y la recepcionista pueden modificar vehículos. */
    const puedeModificar = tieneRol(usuario, ["Administrador", "Recepcionista"]);

    /** Carga los vehículos y la lista de clientes una sola vez, al abrir la pantalla. */
    useEffect(() => {
        cargarVehiculos();
        cargarClientes();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar los clientes del selector.
*/

    async function cargarClientes() {
        try {
            setClientes(await obtenerTodos("/clientes/"));
        } catch (err) {
            setError(err.message);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para consultar los vehículos con los filtros combinados.
*/

    async function cargarVehiculos(pagina = 1, filtrosUsados = filtros) {
        try {
            setCargando(true);
            setError("");

            /** Los filtros se agregan a la URL solo si tienen un valor. */
            let ruta = `/vehiculos/?page=${pagina}`;
            if (filtrosUsados.cliente) ruta += `&cliente=${filtrosUsados.cliente}`;
            if (filtrosUsados.marca) ruta += `&marca=${encodeURIComponent(filtrosUsados.marca)}`;
            if (filtrosUsados.anio) ruta += `&anio=${filtrosUsados.anio}`;
            if (filtrosUsados.buscar) ruta += `&buscar=${encodeURIComponent(filtrosUsados.buscar)}`;

            const datos = await pedirApi(ruta);

            setVehiculos(datos.resultados);
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
        cargarVehiculos(1);
    }

    function limpiarFiltros() {
        setFiltros(filtrosIniciales);
        cargarVehiculos(1, filtrosIniciales);
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
        if (!formulario.cliente || !formulario.placa.trim()
            || !formulario.marca.trim() || !formulario.modelo.trim()) {
            setError("Debe completar el cliente, la placa, la marca y el modelo...");
            return false;
        }

        const anio = Number(formulario.anio);
        if (anio < 1950 || anio > 2027) {
            setError("El año debe estar entre 1950 y 2027...");
            return false;
        }

        if (formulario.kilometraje === "" || Number(formulario.kilometraje) < 0) {
            setError("El kilometraje no puede ser negativo...");
            return false;
        }

        return true;
    }

/**----------------------------------------------------------------------------------------------
 * Función para guardar un vehículo (crearlo o actualizarlo).
*/

    async function guardarVehiculo(e) {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (!validarFormulario()) return;

        const datos = {
            ...formulario,
            cliente: Number(formulario.cliente),
            placa: formulario.placa.toUpperCase(),
            anio: Number(formulario.anio),
            kilometraje: Number(formulario.kilometraje),
        };

        try {
            setProcesando(true);

            if (editandoId === null) {
                await pedirApi("/vehiculos/", "POST", datos);
                setMensaje("Vehículo creado correctamente!");
                await cargarVehiculos(1);
            } else {
                await pedirApi(`/vehiculos/${editandoId}/`, "PATCH", datos);
                setMensaje("Vehículo actualizado correctamente!");
                await cargarVehiculos(paginaActual);
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

    function iniciarEdicion(vehiculo) {
        setEditandoId(vehiculo.id);

        /** String pasa el id a texto porque el select usa texto. */
        setFormulario({
            cliente: String(vehiculo.cliente),
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo,
            anio: vehiculo.anio,
            kilometraje: vehiculo.kilometraje,
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
 * Función para eliminar un vehículo.
 * Si el vehículo tiene órdenes, Django responde 409 y se muestra el mensaje.
*/

    async function eliminarVehiculo(vehiculo) {
        const confirmar = window.confirm(`¿Desea eliminar el vehículo ${vehiculo.placa}?`);

        if (!confirmar) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await pedirApi(`/vehiculos/${vehiculo.id}/`, "DELETE");

            if (editandoId === vehiculo.id) {
                cancelarEdicion();
            }

            await cargarVehiculos(paginaActual);
            setMensaje("Vehículo eliminado correctamente!");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**----------------------------------------------------------------------------------------------
 * Función para consultar el historial de reparaciones de un vehículo.
*/

    async function verHistorial(vehiculo) {
        try {
            setError("");
            setHistorial(await pedirApi(`/vehiculos/${vehiculo.id}/historial/`));
        } catch (err) {
            setError(err.message);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-4">Vehículos</h1>

            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {/* Formulario para crear y editar (solo administrador y recepcionista) */}
            {puedeModificar && (
                <form onSubmit={guardarVehiculo} className="card card-body mb-4">
                    <h2 className="h5 mb-3">
                        {editandoId === null ? "Nuevo vehículo" : "Editar vehículo"}
                    </h2>

                    <fieldset disabled={procesando}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                {/* Selector con los clientes consultados desde la API */}
                                <label className="form-label" htmlFor="cliente">Cliente</label>
                                <select id="cliente" className="form-select"
                                    name="cliente"
                                    value={formulario.cliente}
                                    onChange={manejarCambio}
                                    required>
                                    <option value="">Seleccione un cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>
                                            {cliente.nombre} ({cliente.cedula})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="placa">Placa</label>
                                <input id="placa" className="form-control"
                                    name="placa"
                                    value={formulario.placa}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="marca">Marca</label>
                                <input id="marca" className="form-control"
                                    name="marca"
                                    value={formulario.marca}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="modelo">Modelo</label>
                                <input id="modelo" className="form-control"
                                    name="modelo"
                                    value={formulario.modelo}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="anio">Año</label>
                                <input id="anio" type="number" className="form-control"
                                    name="anio"
                                    min="1950"
                                    max="2027"
                                    value={formulario.anio}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="kilometraje">Kilometraje</label>
                                <input id="kilometraje" type="number" className="form-control"
                                    name="kilometraje"
                                    min="0"
                                    value={formulario.kilometraje}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-primary">
                                {procesando
                                    ? "Procesando..."
                                    : editandoId === null ? "Guardar" : "Actualizar"}
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

            {/* Filtros (se pueden combinar) */}
            <form onSubmit={aplicarFiltros} className="row g-2 align-items-end mb-3">
                <div className="col-sm-6 col-lg-3">
                    <label className="form-label" htmlFor="filtro-cliente">Cliente</label>
                    <select id="filtro-cliente" className="form-select"
                        name="cliente"
                        value={filtros.cliente}
                        onChange={manejarCambioFiltro}>
                        <option value="">Todos</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="col-sm-6 col-lg-2">
                    <label className="form-label" htmlFor="filtro-marca">Marca</label>
                    <input id="filtro-marca" className="form-control"
                        name="marca"
                        value={filtros.marca}
                        onChange={manejarCambioFiltro} />
                </div>
                <div className="col-sm-6 col-lg-2">
                    <label className="form-label" htmlFor="filtro-anio">Año</label>
                    <input id="filtro-anio" type="number" className="form-control"
                        name="anio"
                        value={filtros.anio}
                        onChange={manejarCambioFiltro} />
                </div>
                <div className="col-sm-6 col-lg-2">
                    <label className="form-label" htmlFor="filtro-buscar">Placa</label>
                    <input id="filtro-buscar" className="form-control"
                        name="buscar"
                        placeholder="Buscar placa"
                        value={filtros.buscar}
                        onChange={manejarCambioFiltro} />
                </div>
                <div className="col-lg-3 d-flex gap-2">
                    <button className="btn btn-outline-primary">Filtrar</button>
                    <button className="btn btn-outline-secondary" type="button" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                </div>
            </form>

            {/* Muestra la carga, el estado vacío o la tabla */}
            {cargando ? (
                <p>Cargando vehículos...</p>
            ) : vehiculos.length === 0 ? (
                <p>No hay vehículos con esos filtros.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Placa</th>
                                <th>Vehículo</th>
                                <th>Año</th>
                                <th>Kilometraje</th>
                                <th>Cliente</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiculos.map((vehiculo) => (
                                <tr key={vehiculo.id}>
                                    <td>{vehiculo.placa}</td>
                                    <td>{vehiculo.marca} {vehiculo.modelo}</td>
                                    <td>{vehiculo.anio}</td>
                                    <td>{vehiculo.kilometraje} km</td>
                                    <td>{vehiculo.cliente_nombre}</td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1">
                                            <button className="btn btn-outline-dark btn-sm"
                                                onClick={() => verHistorial(vehiculo)}>
                                                Historial
                                            </button>

                                            {puedeModificar && (
                                                <>
                                                    <button className="btn btn-outline-primary btn-sm"
                                                        disabled={procesando}
                                                        onClick={() => iniciarEdicion(vehiculo)}>
                                                        Editar
                                                    </button>
                                                    <button className="btn btn-danger btn-sm"
                                                        disabled={procesando}
                                                        onClick={() => eliminarVehiculo(vehiculo)}>
                                                        Eliminar
                                                    </button>
                                                </>
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
                onCambiarPagina={(pagina) => cargarVehiculos(pagina)}
                deshabilitado={cargando || procesando}
            />

            {/* Historial: todas las órdenes del vehículo con sus repuestos */}
            {historial && (
                <div className="card card-body mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h5 mb-0">
                            Historial de {historial.vehiculo.placa} ({historial.vehiculo.cliente_nombre})
                        </h2>
                        <button className="btn btn-outline-secondary btn-sm"
                            onClick={() => setHistorial(null)}>
                            Cerrar
                        </button>
                    </div>

                    {historial.ordenes.length === 0 ? (
                        <p className="mb-0">Este vehículo todavía no tiene órdenes.</p>
                    ) : (
                        historial.ordenes.map((orden) => (
                            <div key={orden.id} className="border rounded p-2 mb-2">
                                <p className="mb-1">
                                    <strong>Orden #{orden.id}</strong>{" "}
                                    <span className={`badge text-bg-${ESTADOS[orden.estado].color}`}>
                                        {ESTADOS[orden.estado].nombre}
                                    </span>{" "}
                                    · {formatearFecha(orden.fecha_ingreso)} · Mecánico: {orden.mecanico_nombre}
                                </p>
                                <p className="mb-1">Falla: {orden.falla_reportada}</p>
                                {orden.detalles.length > 0 && (
                                    <p className="mb-0 small">
                                        Repuestos: {orden.detalles
                                            .map((detalle) => `${detalle.repuesto_nombre} (x${detalle.cantidad})`)
                                            .join(", ")}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
