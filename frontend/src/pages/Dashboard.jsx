/** Pantalla de inicio: accesos a los módulos e indicadores del taller. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alerta from "../components/Alerta";
import { pedirApi, tieneRol } from "../services/api";
import { formatearMonto } from "../services/formato";

/**--------------------------------------------------------------------------------------------*/

// Accesos directos a cada módulo
const modulos = [
    { ruta: "/clientes", titulo: "Clientes", texto: "Registrar y consultar clientes." },
    { ruta: "/vehiculos", titulo: "Vehículos", texto: "Vehículos de cada cliente e historial." },
    { ruta: "/repuestos", titulo: "Repuestos", texto: "Inventario y stock disponible." },
    { ruta: "/ordenes", titulo: "Órdenes", texto: "Reparaciones y repuestos usados." },
];

export default function Dashboard({ usuario }) {
    const [indicadores, setIndicadores] = useState(null);
    const [reportes, setReportes] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const esAdministrador = tieneRol(usuario, ["Administrador"]);

/**----------------------------------------------------------------------------------------------
 * Consulta los indicadores al abrir la pantalla (igual que en la clase de useEffect + fetch).
 * Se usa total_registros de cada listado, así los números vienen de la base de datos.
*/

    useEffect(() => {
        async function cargarIndicadores() {
            try {
                /** Promise.all hace todas las consultas a la vez y espera a que terminen. */
                const [clientes, vehiculos, recibidas, enReparacion, finalizadas] = await Promise.all([
                    pedirApi("/clientes/"),
                    pedirApi("/vehiculos/"),
                    pedirApi("/ordenes/?estado=RECIBIDA"),
                    pedirApi("/ordenes/?estado=EN_REPARACION"),
                    pedirApi("/ordenes/?estado=FINALIZADA"),
                ]);

                setIndicadores({
                    clientes: clientes.total_registros,
                    vehiculos: vehiculos.total_registros,
                    recibidas: recibidas.total_registros,
                    enReparacion: enReparacion.total_registros,
                    finalizadas: finalizadas.total_registros,
                });

                /** Los reportes solo los puede ver el administrador. */
                if (esAdministrador) {
                    setReportes(await pedirApi("/reportes/"));
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setCargando(false);
            }
        }

        cargarIndicadores();
    }, [esAdministrador]);

/**--------------------------------------------------------------------------------------------*/

    return (
        <section>
            <h1 className="h3 mb-1">Bienvenido, {usuario.username}</h1>
            <p className="text-muted mb-4">Rol: {usuario.rol}</p>

            <Alerta tipo="danger" mensaje={error} />

            {/* Indicadores obtenidos desde la API */}
            {cargando ? (
                <p>Cargando indicadores...</p>
            ) : indicadores && (
                <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-3">
                        <div className="card card-body text-center h-100">
                            <span className="text-muted">Clientes</span>
                            <span className="fs-2 fw-bold">{indicadores.clientes}</span>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card card-body text-center h-100">
                            <span className="text-muted">Vehículos</span>
                            <span className="fs-2 fw-bold">{indicadores.vehiculos}</span>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card card-body text-center h-100">
                            <span className="text-muted">Órdenes en taller</span>
                            <span className="fs-2 fw-bold">{indicadores.recibidas + indicadores.enReparacion}</span>
                            <span className="small">
                                {indicadores.recibidas} recibidas · {indicadores.enReparacion} en reparación
                            </span>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="card card-body text-center h-100">
                            <span className="text-muted">Listas para facturar</span>
                            <span className="fs-2 fw-bold">{indicadores.finalizadas}</span>
                        </div>
                    </div>

                    {/* Indicadores extra del administrador (reportes) */}
                    {reportes && (
                        <>
                            <div className="col-6 col-lg-3">
                                <div className="card card-body text-center h-100">
                                    <span className="text-muted">Repuestos con stock bajo</span>
                                    <span className="fs-2 fw-bold text-danger">
                                        {reportes.repuestos_bajo_stock.length}
                                    </span>
                                </div>
                            </div>
                            <div className="col-6 col-lg-3">
                                <div className="card card-body text-center h-100">
                                    <span className="text-muted">Total facturado</span>
                                    <span className="fs-5 fw-bold">
                                        {formatearMonto(reportes.facturacion.total_facturado || 0)}
                                    </span>
                                    <span className="small">{reportes.facturacion.cantidad_facturas} facturas</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Detalle de repuestos con stock bajo (solo administrador) */}
            {reportes && reportes.repuestos_bajo_stock.length > 0 && (
                <div className="alert alert-warning">
                    <strong>Repuestos por reponer: </strong>
                    {reportes.repuestos_bajo_stock
                        .map((repuesto) => `${repuesto.nombre} (quedan ${repuesto.stock})`)
                        .join(", ")}
                </div>
            )}

            {/* Accesos directos a los módulos */}
            <h2 className="h5 mb-3">Módulos</h2>
            <div className="row g-3">
                {modulos
                    .map((modulo) => (
                        <div key={modulo.ruta} className="col-sm-6 col-lg-4">
                            <Link to={modulo.ruta} className="card card-body h-100 text-decoration-none">
                                <span className="fw-bold">{modulo.titulo}</span>
                                <span className="text-muted small">{modulo.texto}</span>
                            </Link>
                        </div>
                    ))}
            </div>
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
