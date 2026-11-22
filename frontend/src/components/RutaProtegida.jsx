/** Componente que protege las pantallas privadas. */
import { Navigate } from "react-router-dom";

/**--------------------------------------------------------------------------------------------*/

export default function RutaProtegida({ usuario, children }) {
    /** Si no hay sesión se manda al login (replace evita volver con el botón Atrás). */
    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    /** Con sesión se muestra la pantalla solicitada. */
    return children;
}

/**--------------------------------------------------------------------------------------------*/
