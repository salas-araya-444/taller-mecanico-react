/** Funciones para mostrar datos con un formato fácil de leer. */

/**--------------------------------------------------------------------------------------------*/

// Nombres y colores (clases de Bootstrap) de cada estado de una orden
export const ESTADOS = {
    RECIBIDA: { nombre: "Recibida", color: "secondary" },
    EN_REPARACION: { nombre: "En reparación", color: "warning" },
    FINALIZADA: { nombre: "Finalizada", color: "success" },
    FACTURADA: { nombre: "Facturada", color: "dark" },
};

/**----------------------------------------------------------------------------------------------
 * Función para mostrar un monto en colones. Ejemplo: 18000 -> ₡18 000,00
*/

export function formatearMonto(valor) {
    return Number(valor).toLocaleString("es-CR", {
        style: "currency",
        currency: "CRC",
    });
}

/**----------------------------------------------------------------------------------------------
 * Función para mostrar una fecha de la API. Ejemplo: 2026-11-22T10:30:00 -> 22/11/2026 10:30
*/

export function formatearFecha(fecha) {
    if (!fecha) return "-";

    return new Date(fecha).toLocaleString("es-CR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

/**--------------------------------------------------------------------------------------------*/
