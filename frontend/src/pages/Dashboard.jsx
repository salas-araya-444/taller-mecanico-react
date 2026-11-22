/** Pantalla de inicio después de iniciar sesión. */

/**--------------------------------------------------------------------------------------------*/

export default function Dashboard({ usuario }) {
    return (
        <section>
            <h1 className="h3 mb-1">Bienvenido, {usuario.username}</h1>
            <p className="text-muted mb-4">Rol: {usuario.rol}</p>

            <p>Use el menú superior para ingresar a cada módulo del taller.</p>
        </section>
    );
}

/**--------------------------------------------------------------------------------------------*/
