/** Componente para mostrar mensajes de éxito o de error. */

/**--------------------------------------------------------------------------------------------*/

export default function Alerta({ tipo, mensaje }) {
    /** Si no hay mensaje no se muestra nada. */
    if (!mensaje) return null;

    return (
        <div className={`alert alert-${tipo}`} role="alert">
            {mensaje}
        </div>
    );
}

/**--------------------------------------------------------------------------------------------*/
