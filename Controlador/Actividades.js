const listaActividades = document.getElementById("listaActividades");
let Administrador = false;
let Actividades = [];
let accionesConfiguradas = false;
const formularioActividad = document.getElementById("formActividad");
const modalActividad = new bootstrap.Modal(document.getElementById("modalActividad"));

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
    }
    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.mensaje || "Error en la solicitud");
    }
    return resultado;
}

async function cargarActividad() {
    try {
        const resultado = await solicitarApi("GET");
        Administrador = resultado.rol === "admin";

        configurarAcciones();
        Actividades = resultado.actividades;
        mostrarActividades();
    } catch (error) {
        alert("Error al cargar las actividades: " + error.message);
    }
}

function mostrarActividades() {
    listaActividades.replaceChildren();

    if (Actividades.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = Administrador ? 5 : 4;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "No hay actividades disponibles.";
        fila.append(celda);
        listaActividades.append(fila);
        return;
    }

    Actividades.forEach((actividad) => {
        const fila = document.createElement("tr");

        const celdaNombre = crearCelda(actividad.nombreActividad, "px-3 fw-medium");
        const celdaFecha = crearCelda(actividad.fechaEvento, "px-3 text-muted");
        const celdaMunicipio = crearCelda(actividad.municipio, "px-3");
        const celdaTotal = crearCelda(
            actividad.totalRecaudado === null
                ? "Pendiente"
                : Number(actividad.totalRecaudado).toLocaleString("es-CO", {
                      style: "currency",
                      currency: "COP"
                  }),
            actividad.totalRecaudado === null
                ? "px-3 text-end text-muted fst-italic"
                : "px-3 text-end fw-semibold"
        );

        fila.append(celdaNombre, celdaFecha, celdaMunicipio, celdaTotal);

        if (Administrador) {
            const acciones = document.createElement("td");
            acciones.className = "px-3 text-center text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = "btn btn-sm btn-outline-primary me-2";
            botonEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
            botonEditar.addEventListener("click", () => abrirEdicion(actividad));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = "btn btn-sm btn-outline-danger";
            botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            botonEliminar.addEventListener("click", () => eliminarActividad(actividad));

            acciones.append(botonEditar, botonEliminar);
            fila.append(acciones);
        }

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
    const encabezadoAcciones = document.getElementById("encabezadoAcciones");
    if (Administrador) {
        botonNueva.classList.remove("d-none");
        encabezadoAcciones.classList.remove("d-none");
        accionesConfiguradas = true;
    }
}

document.getElementById("nuevaActividad").addEventListener("click", () => {
    formularioActividad.reset();
    document.getElementById("idActividad").value = "";
    document.getElementById("tituloModalActividad").textContent = "Nueva actividad";
    document.getElementById("btnGuardar").textContent = "Guardar";
});

function abrirEdicion(actividad) {
    formularioActividad.reset();
    document.getElementById("idActividad").value = actividad.idActividad;
    document.getElementById("nombreActividad").value = actividad.nombreActividad;
    document.getElementById("fechaEvento").value = actividad.fechaEvento;
    document.getElementById("municipio").value = actividad.municipio;
    document.getElementById("totalRecaudado").value = actividad.totalRecaudado ?? "";
    document.getElementById("campoTotalRecaudado").classList.remove("d-none");
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

cargarActividad();