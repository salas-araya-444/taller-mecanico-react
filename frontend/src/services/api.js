/** Funciones para comunicarse con la API de Django. */

/**--------------------------------------------------------------------------------------------*/

// La URL base se lee del archivo .env (VITE_API_URL).
// Si no existe, se usa la dirección local de Django.
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

/**----------------------------------------------------------------------------------------------
 * Funciones para guardar la sesión en el navegador (localStorage).
*/

export function guardarSesion(token, usuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
}

export function obtenerToken() {
    return localStorage.getItem("token");
}

export function obtenerUsuario() {
    const usuario = localStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
}

export function borrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
}

/**----------------------------------------------------------------------------------------------
 * Función para saber si el usuario tiene alguno de los roles indicados.
 * Solo sirve para mostrar u ocultar botones: los permisos reales los revisa Django.
*/

export function tieneRol(usuario, roles) {
    return usuario !== null && roles.includes(usuario.rol);
}

/**----------------------------------------------------------------------------------------------
 * Función para convertir la respuesta de error de Django en un mensaje entendible.
*/

function crearMensajeError(codigo, datos) {
    let detalle = "";

    /** Django manda el error en "detail", en "error" o por cada campo. */
    if (datos) {
        if (datos.detail) {
            detalle = datos.detail;
        } else if (datos.error) {
            detalle = datos.error;
        } else {
            /** Recorre cada campo con error. */
            for (const campo in datos) {
                detalle += `${campo}: ${datos[campo]} `;
            }
        }
    }

    if (codigo === 400) return `Revise los datos (400). ${detalle}`;
    if (codigo === 401) return "Su sesión no es válida (401). Cierre sesión e ingrese de nuevo.";
    if (codigo === 403) return `No tiene permiso para esta acción (403). ${detalle}`;
    if (codigo === 404) return `El registro no existe (404). ${detalle}`;
    if (codigo === 409) return `No se puede realizar la acción (409). ${detalle}`;

    return `Error ${codigo}. ${detalle}`;
}

/**----------------------------------------------------------------------------------------------
 * Función principal para hacer peticiones a la API.
 * Agrega el token automáticamente y lanza un Error si la respuesta no es correcta.
*/

export async function pedirApi(ruta, metodo = "GET", datos = null) {
    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
        },
    };

    const token = obtenerToken();
    if (token) {
        opciones.headers.Authorization = `Token ${token}`;
    }

    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }

    let respuesta;

    try {
        respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    } catch {
        /** fetch falla aquí cuando no hay conexión con el servidor. */
        throw new Error("No se pudo conectar con el servidor. Revise que Django esté encendido...");
    }

    /** DELETE responde 204 sin contenido. */
    if (respuesta.status === 204) {
        return null;
    }

    /** Si la respuesta no trae JSON se deja en null. */
    const contenido = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        const error = new Error(crearMensajeError(respuesta.status, contenido));

        /** Se guarda el código (400, 401, 403...) para usarlo en las pantallas. */
        error.codigo = respuesta.status;
        throw error;
    }

    return contenido;
}

/**----------------------------------------------------------------------------------------------
 * Función para traer todos los registros de un listado paginado.
 * Se usa para llenar los selectores (por ejemplo, la lista de clientes de un vehículo).
*/

export async function obtenerTodos(ruta) {
    /** Si la ruta ya trae un filtro, la página se agrega con & */
    const separador = ruta.includes("?") ? "&" : "?";
    let pagina = 1;
    let totalPaginas = 1;
    let todos = [];

    /** Recorre página por página hasta llegar a la última. */
    while (pagina <= totalPaginas) {
        const datos = await pedirApi(`${ruta}${separador}page=${pagina}`);

        /** concat junta los registros de cada página. */
        todos = todos.concat(datos.resultados);
        totalPaginas = datos.total_paginas;
        pagina++;
    }

    return todos;
}

/**--------------------------------------------------------------------------------------------*/
