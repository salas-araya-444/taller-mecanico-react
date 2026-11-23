/** Pantalla que administra los clientes del taller. */
import { useEffect, useState } from "react";
import Alerta from "../components/Alerta";
import Paginacion from "../components/Paginacion";
import { pedirApi, tieneRol } from "../services/api";

/**--------------------------------------------------------------------------------------------*/

const formularioInicial = {
    nombre: "",
    cedula: "",
    telefono: "",
    correo: "",
};

export default function Clientes({ usuario }) {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    /** Solo el administrador y la recepcionista pueden modificar clientes. */
    const puedeModificar = tieneRol(usuario, ["Administrador", "Recepcionista"]);

    /** Carga los clientes una sola vez, al abrir la pantalla. */
    useEffect(() => {
        cargarClientes();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar los clientes (con búsqueda por nombre y paginación).
*/

    async function cargarClientes(pagina = 1, texto = buscar) {
        try {
            setCargando(true);
            setError("");

            /** encodeURIComponent arregla los espacios y tildes de la búsqueda. */
            const datos = await pedirApi(`/clientes/?page=${pagina}&buscar=${encodeURIComponent(texto)}`);

            /** La API devuelve los clientes dentro de resultados. */
            setClientes(datos.resultados);
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
 * Funciones para buscar y limpiar la búsqueda.
*/

    function buscarClientes(e) {
        e.preventDefault();
        cargarClientes(1);
    }

    function limpiarBusqueda() {
        setBuscar("");
        cargarClientes(1, "");
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
 * Django vuelve a validar todo; esto solo ayuda al usuario a corregir antes.
*/

    function validarFormulario() {
        if (!formulario.nombre.trim() || !formulario.correo.trim()) {
            setError("Debe completar el nombre y el correo...");
            return false;
        }

        /** isNaN revisa si el texto NO es un número. */
        if (isNaN(formulario.cedula) || formulario.cedula.length < 9) {
            setError("La cédula debe tener solo números y al menos 9 dígitos...");
            return false;
        }

        if (isNaN(formulario.telefono) || formulario.telefono.length < 8) {
            setError("El teléfono debe tener solo números y al menos 8 dígitos...");
            return false;
        }

        return true;
    }

/**----------------------------------------------------------------------------------------------
 * Función para guardar un cliente (crearlo o actualizarlo).
*/

    async function guardarCliente(e) {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (!validarFormulario()) return;

        try {
            setProcesando(true);

            if (editandoId === null) {
                await pedirApi("/clientes/", "POST", formulario);
                setMensaje("Cliente creado correctamente!");
                await cargarClientes(1);
            } else {
                await pedirApi(`/clientes/${editandoId}/`, "PATCH", formulario);
                setMensaje("Cliente actualizado correctamente!");
                await cargarClientes(paginaActual);
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
 * Función para cargar un cliente en el formulario y editarlo.
*/

    function iniciarEdicion(cliente) {
        setEditandoId(cliente.id);
        setFormulario({
            nombre: cliente.nombre,
            cedula: cliente.cedula,
            telefono: cliente.telefono,
            correo: cliente.correo,
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
 * Función para eliminar un cliente.
 * Si el cliente tiene vehículos, Django responde 409 y se muestra el mensaje.
*/

    async function eliminarCliente(cliente) {
        const confirmar = window.confirm(`¿Desea eliminar al cliente ${cliente.nombre}?`);

        if (!confirmar) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await pedirApi(`/clientes/${cliente.id}/`, "DELETE");

            if (editandoId === cliente.id) {
                cancelarEdicion();
            }

            await cargarClientes(paginaActual);
            setMensaje("Cliente eliminado correctamente!");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-4">Clientes</h1>

            {/* Muestra mensajes de éxito o error */}
            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {/* Formulario para crear y editar (solo administrador y recepcionista) */}
            {puedeModificar && (
                <form onSubmit={guardarCliente} className="card card-body mb-4">
                    <h2 className="h5 mb-3">
                        {editandoId === null ? "Nuevo cliente" : "Editar cliente"}
                    </h2>

                    <fieldset disabled={procesando}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="nombre">Nombre</label>
                                <input id="nombre" className="form-control"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="cedula">Cédula</label>
                                <input id="cedula" className="form-control"
                                    name="cedula"
                                    inputMode="numeric"
                                    value={formulario.cedula}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="telefono">Teléfono</label>
                                <input id="telefono" type="tel" className="form-control"
                                    name="telefono"
                                    value={formulario.telefono}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="correo">Correo</label>
                                <input id="correo" type="email" className="form-control"
                                    name="correo"
                                    value={formulario.correo}
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

            {/* Búsqueda por nombre */}
            <form onSubmit={buscarClientes} className="d-flex flex-wrap gap-2 mb-3">
                <input className="form-control w-auto"
                    placeholder="Buscar por nombre"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)} />
                <button className="btn btn-outline-primary">Buscar</button>
                <button className="btn btn-outline-secondary" type="button" onClick={limpiarBusqueda}>
                    Limpiar
                </button>
            </form>

            {/* Muestra la carga, el estado vacío o la tabla */}
            {cargando ? (
                <p>Cargando clientes...</p>
            ) : clientes.length === 0 ? (
                <p>No hay clientes registrados.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Nombre</th>
                                <th>Cédula</th>
                                <th>Teléfono</th>
                                <th>Correo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map((cliente) => (
                                <tr key={cliente.id}>
                                    <td>{cliente.nombre}</td>
                                    <td>{cliente.cedula}</td>
                                    <td>{cliente.telefono}</td>
                                    <td>{cliente.correo}</td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1">
                                            {puedeModificar && (
                                                <>
                                                    <button className="btn btn-outline-primary btn-sm"
                                                        disabled={procesando}
                                                        onClick={() => iniciarEdicion(cliente)}>
                                                        Editar
                                                    </button>
                                                    <button className="btn btn-danger btn-sm"
                                                        disabled={procesando}
                                                        onClick={() => eliminarCliente(cliente)}>
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
                onCambiarPagina={(pagina) => cargarClientes(pagina)}
                deshabilitado={cargando || procesando}
            />
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
