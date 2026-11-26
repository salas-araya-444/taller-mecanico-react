/** Íconos sencillos de taller para los accesos del dashboard (dibujados con SVG). */

/**--------------------------------------------------------------------------------------------*/

/** Los huecos (fill="#0b2a5b") van del mismo azul del círculo donde se pone el ícono. */
export default function Icono({ nombre }) {
    /** Cada nombre tiene su propio dibujo. */
    let dibujo = null;

    if (nombre === "clientes") {
        dibujo = (
            <>
                <circle cx="24" cy="16" r="8" />
                <path d="M8 40 C8 28, 40 28, 40 40 Z" />
            </>
        );
    } else if (nombre === "vehiculos") {
        /** Carro visto de frente (silueta): techo, espejos, focos, parrilla y llantas */
        dibujo = (
            <>
                <path d="M9.1 16.5 L13.3 10.9 Q14.5 9.5 16.6 9.5 L30.5 9.5 Q32.6 9.5 34.2 10.9 L38.4 16.5 L39.6 19.8 L7.9 19.8 Z" />
                <path d="M10 19.3 L14.7 12.1 Q15.2 11.5 16.1 11.5 L31 11.5 Q31.9 11.5 32.4 12.1 L37.5 19.3 Z" fill="#0b2a5b" />
                <rect x="4" y="16.5" width="6.5" height="2.8" rx="1.4" />
                <rect x="37" y="16.5" width="6.5" height="2.8" rx="1.4" />
                <path d="M6.3 19.3 L41.3 19.3 Q43.1 20.5 43.1 24 L43.1 34.6 L4.5 34.6 L4.5 24 Q4.5 20.5 6.3 19.3 Z" />
                <rect x="4.5" y="33" width="6" height="5.3" rx="1.2" />
                <rect x="37.1" y="33" width="6" height="5.3" rx="1.2" />
                <ellipse cx="10.5" cy="25.5" rx="3.4" ry="2" fill="#0b2a5b" transform="rotate(8 10.5 25.5)" />
                <ellipse cx="37" cy="25.5" rx="3.4" ry="2" fill="#0b2a5b" transform="rotate(-8 37 25.5)" />
                <rect x="18" y="29.8" width="11.6" height="2.2" rx="1.1" fill="#0b2a5b" />
            </>
        );
    } else if (nombre === "repuestos") {
        /** Tuerca: un hexágono con un hueco en el centro */
        dibujo = (
            <>
                <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" />
                <circle cx="24" cy="24" r="8" fill="#0b2a5b" />
            </>
        );
    } else if (nombre === "ordenes") {
        /** Tabla de apuntes sencilla con las líneas de la orden */
        dibujo = (
            <>
                <rect x="9" y="6" width="30" height="38" rx="3" />
                <rect x="17" y="2" width="14" height="8" rx="2" stroke="#0b2a5b" strokeWidth="2" />
                <rect x="15" y="17" width="18" height="3" fill="#0b2a5b" />
                <rect x="15" y="25" width="18" height="3" fill="#0b2a5b" />
                <rect x="15" y="33" width="12" height="3" fill="#0b2a5b" />
            </>
        );
    } else if (nombre === "facturas") {
        dibujo = (
            <>
                <path d="M10 4 L38 4 L38 44 L33 40 L28 44 L24 40 L20 44 L15 40 L10 44 Z" />
                <rect x="16" y="13" width="16" height="3" fill="#0b2a5b" />
                <rect x="16" y="21" width="16" height="3" fill="#0b2a5b" />
                <rect x="16" y="29" width="10" height="3" fill="#0b2a5b" />
            </>
        );
    }

    return (
        <svg width="40" height="40" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
            {dibujo}
        </svg>
    );
}

/**--------------------------------------------------------------------------------------------*/
