/** Pantalla para iniciar sesión. */
import { useState } from "react";
import Alerta from "../components/Alerta";
import { borrarSesion, guardarSesion, pedirApi } from "../services/api";

/**--------------------------------------------------------------------------------------------*/

export default function Login({ onLogin }) {
    const [credenciales, setCredenciales] = useState({
        username: "",
        password: "",
    });
    const [autenticando, setAutenticando] = useState(false);
    const [error, setError] = useState("");

/**----------------------------------------------------------------------------------------------
 * Función para actualizar las credenciales.
*/

    function manejarCambio(e) {
        setCredenciales({
            ...credenciales,
            [e.target.name]: e.target.value,
        });
    }

/**----------------------------------------------------------------------------------------------
 * Función para iniciar sesión.
*/

    async function iniciarSesion(e) {
        e.preventDefault();

        if (!credenciales.username.trim() || !credenciales.password) {
            setError("Debe escribir el usuario y la contraseña...");
            return;
        }

        try {
            setAutenticando(true);
            setError("");

            /** 1. Pide el token a Django con el usuario y la contraseña. */
            const datos = await pedirApi("/token/", "POST", credenciales);

            /** 2. Guarda el token y consulta el perfil para saber el rol. */
            guardarSesion(datos.token, null);
            const perfil = await pedirApi("/perfil/");
            guardarSesion(datos.token, perfil);

            /** 3. Avisa a App.jsx que ya hay un usuario conectado. */
            onLogin(perfil);

        } catch (err) {
            borrarSesion();

            /** Django responde 400 si el usuario o la contraseña están mal. */
            if (err.codigo === 400) {
                setError("Usuario o contraseña incorrectos...");
            } else {
                setError(err.message);
            }
        } finally {
            setAutenticando(false);
        }
    }

/**--------------------------------------------------------------------------------------------*/

    return (
        <section className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
                <h1 className="h3 mb-4 text-center">Taller Mecánico</h1>

                <form onSubmit={iniciarSesion} className="card card-body">
                    <h2 className="h5 mb-3">Iniciar sesión</h2>

                    <Alerta tipo="danger" mensaje={error} />

                    <div className="mb-3">
                        <label className="form-label" htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            className="form-control"
                            name="username"
                            value={credenciales.username}
                            onChange={manejarCambio}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            className="form-control"
                            name="password"
                            value={credenciales.password}
                            onChange={manejarCambio}
                            required
                        />
                    </div>

                    {/* Deshabilita el botón mientras se autentica */}
                    <button
                        type="submit"
                        className="btn btn-dark"
                        disabled={autenticando}
                    >
                        {autenticando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>
            </div>
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
