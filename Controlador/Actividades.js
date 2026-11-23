const listaActividades = document.getElementById("listaActividades");
const formularioActividad = document.getElementById("formActividad");
const modalActividad = new bootstrap.Modal(document.getElementById("modalActividad"));
const buscadorInput = document.getElementById("buscador");
const filtroEstadoSelect = document.getElementById("filtroEstado");

let Administrador = false;
let Actividades = [];
let accionesConfiguradas = false;

async function solicitarApi(metodo, datos) {
    const opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json" }
    };
    if (datos) {
        opciones.body = JSON.stringify(datos);
    }

    const respuesta = await fetch("../Modelo/gestionarActividades.php", opciones);
    const resultado = await respuesta.json();

    if (respuesta.status === 401) {
        window.location.href = "Login.html";
        return;
    }
    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.mensaje || "Error en la solicitud");
    }
    return resultado;
}

function esProxima(fechaEvento) {
    if (!fechaEvento) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return String(fechaEvento).slice(0, 10) >= hoy;
}

function actualizarResumen(lista) {
    const totalEl = document.getElementById("resTotal");
    const proxEl = document.getElementById("resProximas");
    const recEl = document.getElementById("resRecaudado");

    if (totalEl) totalEl.textContent = lista.length;
    if (proxEl) {
        proxEl.textContent = lista.filter((a) => esProxima(a.fechaEvento)).length;
    }
    if (recEl) {
        const suma = lista.reduce((acc, a) => acc + (Number(a.totalRecaudado) || 0), 0);
        recEl.textContent = suma.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        });
    }
}

function obtenerActividadesFiltradas() {
    const texto = (buscadorInput?.value || "").trim().toLowerCase();
    const estado = filtroEstadoSelect?.value || "todas";

    return Actividades.filter((act) => {
        const coincideTexto =
            !texto ||
            String(act.nombreActividad || "").toLowerCase().includes(texto) ||
            String(act.municipio || "").toLowerCase().includes(texto);

        const proxima = esProxima(act.fechaEvento);
        const coincideEstado =
            estado === "todas" ||
            (estado === "proximas" && proxima) ||
            (estado === "finalizadas" && !proxima);

        return coincideTexto && coincideEstado;
    });
}

async function cargarActividad() {
    try {
        const resultado = await solicitarApi("GET");
        if (!resultado) return;

        Administrador = resultado.rol === "admin";
        Actividades = Array.isArray(resultado.actividades) ? resultado.actividades : [];

        configurarAcciones();
        actualizarResumen(Actividades);
        mostrarActividades();
    } catch (error) {
        alert("Error al cargar las actividades: " + error.message);
    }
}

function mostrarActividades() {
    listaActividades.replaceChildren();
    const filtradas = obtenerActividadesFiltradas();

    if (filtradas.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "No hay actividades disponibles.";
        fila.append(celda);
        listaActividades.append(fila);
        return;
    }

    filtradas.forEach((actividad) => {
        const fila = document.createElement("tr");
        const proxima = esProxima(actividad.fechaEvento);

        const celdaNombre = crearCelda(actividad.nombreActividad, "px-3 fw-medium");
        const celdaFecha = crearCelda(actividad.fechaEvento, "px-3 text-muted");
        const celdaMunicipio = crearCelda(actividad.municipio, "px-3");

        const celdaEstado = document.createElement("td");
        celdaEstado.className = "px-3";
        const badge = document.createElement("span");
        badge.className = `badge ${proxima ? "text-bg-primary" : "text-bg-secondary"}`;
        badge.textContent = proxima ? "Próxima" : "Finalizada";
        celdaEstado.append(badge);

        const inscritosValor = actividad.totalInscritos ?? actividad.inscritos ?? "-";
        const celdaInscritos = crearCelda(String(inscritosValor), "px-3 text-center");

        const tieneRecaudo = actividad.totalRecaudado !== null && actividad.totalRecaudado !== undefined && actividad.totalRecaudado !== "";
        const celdaTotal = crearCelda(
            !tieneRecaudo
                ? "Pendiente"
                : Number(actividad.totalRecaudado).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0
                  }),
            !tieneRecaudo
                ? "px-3 text-end text-muted fst-italic"
                : "px-3 text-end fw-semibold"
        );

        const acciones = document.createElement("td");
        acciones.className = "px-3 text-center text-nowrap";

        if (Administrador) {
            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.title = "Editar";
            botonEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
            botonEditar.addEventListener("click", () => abrirEdicion(actividad));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.title = "Eliminar";
            botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            botonEliminar.addEventListener("click", () => eliminarActividad(actividad));

            acciones.append(botonEditar, botonEliminar);
        } else {
            acciones.textContent = "-";
        }

        fila.append(
            celdaNombre,
            celdaFecha,
            celdaMunicipio,
            celdaEstado,
            celdaInscritos,
            celdaTotal,
            acciones
        );

        listaActividades.append(fila);
    });
}

function crearCelda(texto, clases = "") {
    const celda = document.createElement("td");
    if (clases) {
        celda.className = clases;
    }
    celda.textContent = texto;
    return celda;
}

async function eliminarActividad(actividad) {
    const confirmar = window.confirm(`¿Deseas eliminar la actividad "${actividad.nombreActividad}"?`);
    if (!confirmar) {
        return;
    }

    try {
        await solicitarApi("DELETE", { idActividad: actividad.idActividad });
        await cargarActividad();
        alert("Actividad eliminada correctamente");
    } catch (error) {
        alert(error.message);
    }
}

function configurarAcciones() {
    if (accionesConfiguradas) {
        return;
    }
    const botonNueva = document.getElementById("nuevaActividad");
    if (Administrador && botonNueva) {
        botonNueva.classList.remove("d-none");
        accionesConfiguradas = true;
    }
}

document.getElementById("nuevaActividad").addEventListener("click", () => {
    formularioActividad.reset();
    document.getElementById("idActividad").value = "";
    document.getElementById("tituloModalActividad").textContent = "Nueva actividad";
    document.getElementById("btnGuardar").textContent = "Guardar";
    modalActividad.show();
});

function abrirEdicion(actividad) {
    formularioActividad.reset();
    document.getElementById("idActividad").value = actividad.idActividad;
    document.getElementById("nombreActividad").value = actividad.nombreActividad;
    document.getElementById("fechaEvento").value = actividad.fechaEvento;
    document.getElementById("municipio").value = actividad.municipio;
    document.getElementById("totalRecaudado").value = actividad.totalRecaudado ?? "";
    document.getElementById("tituloModalActividad").textContent = "Editar actividad";
    document.getElementById("btnGuardar").textContent = "Guardar cambios";
    modalActividad.show();
}

formularioActividad.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const idActividad = document.getElementById("idActividad").value;
    const total = document.getElementById("totalRecaudado").value;

    const datos = {
        nombreActividad: document.getElementById("nombreActividad").value.trim(),
        fechaEvento: document.getElementById("fechaEvento").value,
        municipio: document.getElementById("municipio").value.trim(),
        totalRecaudado: total === "" ? null : Number(total)
    };

    if (idActividad) {
        datos.idActividad = Number(idActividad);
    }

    try {
        await solicitarApi(idActividad ? "PUT" : "POST", datos);
        modalActividad.hide();
        await cargarActividad();
        alert(idActividad ? "Actividad actualizada correctamente" : "Actividad creada correctamente");
    } catch (error) {
        alert(error.message);
    }
});

buscadorInput?.addEventListener("input", mostrarActividades);
filtroEstadoSelect?.addEventListener("change", mostrarActividades);

cargarActividad();