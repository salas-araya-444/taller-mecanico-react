/** Componente con los botones para recorrer las páginas de un listado. */

/**--------------------------------------------------------------------------------------------*/

export default function Paginacion({
    paginaActual,
    totalPaginas,
    totalRegistros,
    onCambiarPagina,
    deshabilitado,
}) {
    return (
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
            {/* Consulta la página anterior en la API */}
            <button
                className="btn btn-outline-secondary btn-sm"
                disabled={paginaActual <= 1 || deshabilitado}
                onClick={() => onCambiarPagina(paginaActual - 1)}
            >
                Anterior
            </button>

            <span>
                Página {paginaActual} de {totalPaginas} ({totalRegistros} registros)
            </span>

            {/* Consulta la página siguiente en la API */}
            <button
                className="btn btn-outline-secondary btn-sm"
                disabled={paginaActual >= totalPaginas || deshabilitado}
                onClick={() => onCambiarPagina(paginaActual + 1)}
            >
                Siguiente
            </button>
        </div>
    );
}

/**--------------------------------------------------------------------------------------------*/
