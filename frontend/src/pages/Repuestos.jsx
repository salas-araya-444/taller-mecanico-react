/** Pantalla que administra el inventario de repuestos. */
import { useEffect, useState } from "react";
import Alerta from "../components/Alerta";
import Paginacion from "../components/Paginacion";
import { pedirApi, tieneRol } from "../services/api";
import { formatearMonto } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

const formularioInicial = {
    codigo: "",
    nombre: "",
    precio: "",
    stock: 0,
    stock_minimo: 0,
};

// Opciones de ordenamiento que acepta la API (el "-" ordena de mayor a menor)
const opcionesOrden = [
    { valor: "nombre", texto: "Nombre (A-Z)" },
    { valor: "precio", texto: "Precio (menor a mayor)" },
    { valor: "-precio", texto: "Precio (mayor a menor)" },
    { valor: "stock", texto: "Stock (menor a mayor)" },
    { valor: "-stock", texto: "Stock (mayor a menor)" },
];

export default function Repuestos({ usuario }) {
    const [repuestos, setRepuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesando, setProcesando] = useState(false);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [buscar, setBuscar] = useState("");
    const [ordenar, setOrdenar] = useState("nombre");
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalRegistros, setTotalRegistros] = useState(0);

    /** Solo el administrador puede modificar el inventario. */
    const puedeModificar = tieneRol(usuario, ["Administrador"]);

    /** Carga los repuestos una sola vez, al abrir la pantalla. */
    useEffect(() => {
        cargarRepuestos();
        // El [] va vacío para que solo cargue una vez (la línea de abajo quita el aviso de ESLint)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/**----------------------------------------------------------------------------------------------
 * Función para consultar los repuestos (búsqueda, ordenamiento y paginación).
*/

    async function cargarRepuestos(pagina = 1, texto = buscar, orden = ordenar) {
        try {
            setCargando(true);
            setError("");

            /** encodeURIComponent arregla los espacios y tildes de la búsqueda. */
            const datos = await pedirApi(
                `/repuestos/?page=${pagina}&buscar=${encodeURIComponent(texto)}&ordenar=${orden}`
            );

            setRepuestos(datos.resultados);
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
 * Funciones para buscar y ordenar.
*/

    function buscarRepuestos(e) {
        e.preventDefault();
        cargarRepuestos(1);
    }

    function limpiarBusqueda() {
        setBuscar("");
        setOrdenar("nombre");
        cargarRepuestos(1, "", "nombre");
    }

    /** Al cambiar el orden se vuelve a consultar la API con el nuevo valor. */
    function cambiarOrden(e) {
        setOrdenar(e.target.value);
        cargarRepuestos(1, buscar, e.target.value);
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
        if (!formulario.codigo.trim() || !formulario.nombre.trim()) {
            setError("Debe completar el código y el nombre...");
            return false;
        }

        if (formulario.precio === "" || Number(formulario.precio) < 0) {
            setError("El precio no puede estar vacío ni ser negativo...");
            return false;
        }

        if (Number(formulario.stock) < 0 || Number(formulario.stock_minimo) < 0) {
            setError("El stock y el stock mínimo no pueden ser negativos...");
            return false;
        }

        return true;
    }

/**----------------------------------------------------------------------------------------------
 * Función para guardar un repuesto (crearlo o actualizarlo).
*/

    async function guardarRepuesto(e) {
        e.preventDefault();
        setError("");
        setMensaje("");

        if (!validarFormulario()) return;

        const datos = {
            ...formulario,
            stock: Number(formulario.stock),
            stock_minimo: Number(formulario.stock_minimo),
        };

        try {
            setProcesando(true);

            if (editandoId === null) {
                await pedirApi("/repuestos/", "POST", datos);
                setMensaje("Repuesto creado correctamente!");
                await cargarRepuestos(1);
            } else {
                await pedirApi(`/repuestos/${editandoId}/`, "PATCH", datos);
                setMensaje("Repuesto actualizado correctamente!");
                await cargarRepuestos(paginaActual);
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

    function iniciarEdicion(repuesto) {
        setEditandoId(repuesto.id);
        setFormulario({
            codigo: repuesto.codigo,
            nombre: repuesto.nombre,
            precio: repuesto.precio,
            stock: repuesto.stock,
            stock_minimo: repuesto.stock_minimo,
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
 * Función para eliminar un repuesto.
 * Si ya se usó en órdenes, Django responde 409 y se muestra el mensaje.
*/

    async function eliminarRepuesto(repuesto) {
        const confirmar = window.confirm(`¿Desea eliminar el repuesto ${repuesto.nombre}?`);

        if (!confirmar) return;

        try {
            setProcesando(true);
            setError("");
            setMensaje("");

            await pedirApi(`/repuestos/${repuesto.id}/`, "DELETE");

            if (editandoId === repuesto.id) {
                cancelarEdicion();
            }

            await cargarRepuestos(paginaActual);
            setMensaje("Repuesto eliminado correctamente!");

        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-4">Repuestos</h1>

            <Alerta tipo="success" mensaje={mensaje} />
            <Alerta tipo="danger" mensaje={error} />

            {/* Formulario para crear y editar (solo administrador) */}
            {puedeModificar ? (
                <form onSubmit={guardarRepuesto} className="card card-body mb-4">
                    <h2 className="h5 mb-3">
                        {editandoId === null ? "Nuevo repuesto" : "Editar repuesto"}
                    </h2>

                    <fieldset disabled={procesando}>
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="codigo">Código</label>
                                <input id="codigo" className="form-control"
                                    name="codigo"
                                    value={formulario.codigo}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label" htmlFor="nombre">Nombre</label>
                                <input id="nombre" className="form-control"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="precio">Precio (₡)</label>
                                <input id="precio" type="number" className="form-control"
                                    name="precio"
                                    min="0"
                                    step="0.01"
                                    value={formulario.precio}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="stock">Stock</label>
                                <input id="stock" type="number" className="form-control"
                                    name="stock"
                                    min="0"
                                    value={formulario.stock}
                                    onChange={manejarCambio}
                                    required />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label" htmlFor="stock_minimo">Stock mínimo</label>
                                <input id="stock_minimo" type="number" className="form-control"
                                    name="stock_minimo"
                                    min="0"
                                    value={formulario.stock_minimo}
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
            ) : (
                <p className="text-muted">Solo el administrador puede modificar el inventario.</p>
            )}

            {/* Búsqueda por nombre y ordenamiento */}
            <form onSubmit={buscarRepuestos} className="d-flex flex-wrap gap-2 mb-3">
                <input className="form-control w-auto"
                    placeholder="Buscar por nombre"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)} />
                <button className="btn btn-outline-primary">Buscar</button>

                <select className="form-select w-auto"
                    aria-label="Ordenar por"
                    value={ordenar}
                    onChange={cambiarOrden}>
                    {opcionesOrden.map((opcion) => (
                        <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
                    ))}
                </select>

                <button className="btn btn-outline-secondary" type="button" onClick={limpiarBusqueda}>
                    Limpiar
                </button>
            </form>

            {cargando ? (
                <p>Cargando repuestos...</p>
            ) : repuestos.length === 0 ? (
                <p>No hay repuestos registrados.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Stock mínimo</th>
                                {puedeModificar && <th>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {repuestos.map((repuesto) => (
                                <tr key={repuesto.id}>
                                    <td>{repuesto.codigo}</td>
                                    <td>{repuesto.nombre}</td>
                                    <td>{formatearMonto(repuesto.precio)}</td>
                                    <td>
                                        {repuesto.stock}{" "}
                                        {/* Avisa cuando el stock llegó al mínimo */}
                                        {repuesto.stock <= repuesto.stock_minimo && (
                                            <span className="badge text-bg-danger">Stock bajo</span>
                                        )}
                                    </td>
                                    <td>{repuesto.stock_minimo}</td>
                                    {puedeModificar && (
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <button className="btn btn-outline-primary btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => iniciarEdicion(repuesto)}>
                                                    Editar
                                                </button>
                                                <button className="btn btn-danger btn-sm"
                                                    disabled={procesando}
                                                    onClick={() => eliminarRepuesto(repuesto)}>
                                                    Eliminar
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

            <Paginacion
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                totalRegistros={totalRegistros}
                onCambiarPagina={(pagina) => cargarRepuestos(pagina)}
                deshabilitado={cargando || procesando}
            />
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
