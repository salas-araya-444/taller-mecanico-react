/** Componente para mostrar el menú principal. */
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import { tieneRol } from "../services/api";

/**--------------------------------------------------------------------------------------------*/

export default function Menu({ usuario, onCerrarSesion }) {
    /** <> </> agrupa el menú y la franja de abajo sin agregar un div. */
    return (
        <>
            <nav className="navbar navbar-dark menu-taller">
                <div className="container flex-wrap gap-2">
                    <span className="navbar-brand">
                        <Logo tamano={38} />
                        {/* Nombre del taller con el apodo debajo */}
                        <span>
                            Taller Mecánico
                            <span className="menu-nombre">"El Yodito"</span>
                        </span>
                    </span>

                    {/* NavLink cambia de pantalla sin recargar la página */}
                    <div className="navbar-nav flex-row flex-wrap gap-3 me-auto">
                        <NavLink className="nav-link" to="/" end>
                            Inicio
                        </NavLink>
                        <NavLink className="nav-link" to="/clientes">
                            Clientes
                        </NavLink>
                        <NavLink className="nav-link" to="/vehiculos">
                            Vehículos
                        </NavLink>
                        <NavLink className="nav-link" to="/repuestos">
                            Repuestos
                        </NavLink>
                        <NavLink className="nav-link" to="/ordenes">
                            Órdenes
                        </NavLink>

                        {/* El mecánico no factura, por eso no se le muestra el enlace */}
                        {tieneRol(usuario, ["Administrador", "Recepcionista"]) && (
                            <NavLink className="nav-link" to="/facturas">
                                Facturas
                            </NavLink>
                        )}
                    </div>

                    {/* Usuario conectado y botón para cerrar sesión */}
                    <div className="d-flex align-items-center gap-2 text-white">
                        <span>
                            {usuario.username} ({usuario.rol})
                        </span>
                        <button
                            className="btn btn-outline-light btn-sm"
                            onClick={onCerrarSesion}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </nav>

            {/* Franja con los colores de la bandera de Costa Rica */}
            <div className="franja-bandera"></div>
        </>
    );
}

/**--------------------------------------------------------------------------------------------*/
