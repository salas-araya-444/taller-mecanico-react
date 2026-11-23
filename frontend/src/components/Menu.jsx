/** Componente para mostrar el menú principal. */
import { NavLink } from "react-router-dom";

/**--------------------------------------------------------------------------------------------*/

export default function Menu({ usuario, onCerrarSesion }) {
    return (
        <nav className="navbar navbar-dark bg-dark">
            <div className="container flex-wrap gap-2">
                <span className="navbar-brand">Taller Mecánico</span>

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
    );
}

/**--------------------------------------------------------------------------------------------*/
