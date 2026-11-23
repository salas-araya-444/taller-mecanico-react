/** Componente principal: define las rutas de la aplicación. */
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Menu from "./components/Menu";
import RutaProtegida from "./components/RutaProtegida";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import { borrarSesion, obtenerUsuario, pedirApi } from "./services/api";

/**--------------------------------------------------------------------------------------------*/

export default function App() {
    /** Si ya había una sesión guardada en el navegador, se recupera. */
    const [usuario, setUsuario] = useState(obtenerUsuario());
    const navigate = useNavigate();

/**----------------------------------------------------------------------------------------------
 * Función para cerrar sesión.
*/

    async function cerrarSesion() {
        try {
            /** Borra el token en el servidor (Django). */
            await pedirApi("/logout/", "POST");
        } catch {
            /** Aunque falle (por ejemplo, sin conexión), se limpia la sesión local. */
        }

        /** Borra el token del navegador y vuelve al login. */
        borrarSesion();
        setUsuario(null);
        navigate("/login");
    }

/**--------------------------------------------------------------------------------------------*/

    /** <> </> sirve para agrupar sin agregar un div. */
    return (
        <>
            {/* El menú solo se muestra con una sesión iniciada */}
            {usuario && <Menu usuario={usuario} onCerrarSesion={cerrarSesion} />}

            <main className="container py-4">
                <Routes>
                    {/* Si ya inició sesión, el login lo envía al inicio */}
                    <Route
                        path="/login"
                        element={usuario ? <Navigate to="/" replace /> : <Login onLogin={setUsuario} />}
                    />

                    {/* Pantallas privadas: RutaProtegida pide iniciar sesión */}
                    <Route
                        path="/"
                        element={<RutaProtegida usuario={usuario}><Dashboard usuario={usuario} /></RutaProtegida>}
                    />
                    <Route
                        path="/clientes"
                        element={<RutaProtegida usuario={usuario}><Clientes usuario={usuario} /></RutaProtegida>}
                    />

                    {/* Cualquier otra dirección vuelve al inicio */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    );
}

/**--------------------------------------------------------------------------------------------*/
