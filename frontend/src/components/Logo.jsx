/** Logo del taller: una llave de tuercas con dos granos de café dorados (dibujado con SVG). */

/**--------------------------------------------------------------------------------------------*/

export default function Logo({ tamano = 40 }) {
    return (
        <svg width={tamano} height={tamano} viewBox="6 6 88 88" aria-hidden="true">
            {/* La máscara recorta la boca de la llave */}
            <defs>
                <mask id="boca-llave">
                    <rect width="100" height="100" fill="white" />
                    <rect x="43" y="0" width="14" height="22" fill="black" />
                </mask>
            </defs>

            {/* Llave de tuercas inclinada */}
            <g transform="rotate(45 50 50)" mask="url(#boca-llave)">
                <circle cx="50" cy="22" r="18" fill="#c5ccd6" />
                <rect x="44" y="28" width="12" height="62" rx="6" fill="#c5ccd6" />
                <rect x="47" y="40" width="6" height="40" rx="3" fill="#8f99a8" />
            </g>

            {/* Dos granos de café dorados (grano de oro), uno a cada lado de la llave */}
            <g transform="rotate(-30 28 30)">
                <ellipse cx="28" cy="30" rx="12" ry="16" fill="#d4a72c" stroke="#7a5512" strokeWidth="2" />
                <path d="M28 15 C21 24, 35 36, 28 45" fill="none" stroke="#7a5512" strokeWidth="3" strokeLinecap="round" />
            </g>
            <g transform="rotate(-30 72 70)">
                <ellipse cx="72" cy="70" rx="12" ry="16" fill="#d4a72c" stroke="#7a5512" strokeWidth="2" />
                <path d="M72 55 C65 64, 79 76, 72 85" fill="none" stroke="#7a5512" strokeWidth="3" strokeLinecap="round" />
            </g>
        </svg>
    );
}

/**--------------------------------------------------------------------------------------------*/
