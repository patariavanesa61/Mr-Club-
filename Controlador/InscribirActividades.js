const contenedorActividades = document.getElementById("contenedorActividades");
const buscarInput = document.getElementById("buscarActividad");
const filtroSelect = document.getElementById("filtroSuscripcion");
const modalConfirmarEl = document.getElementById("modalConfirmar");
const modalConfirmar = new bootstrap.Modal(modalConfirmarEl);
const btnConfirmarAccion = document.getElementById("btnConfirmarAccion");

let actividades = [];
let actividadSeleccionada = null;

async function cargarActividades() {
  try {
    const resp = await fetch("../Modelo/gestionarActividades.php", {
      credentials: "same-origin"
    });

    if (resp.status === 401) {
      window.location.href = "Login.html";
      return;
    }

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      throw new Error(data.mensaje || "No se pudieron cargar las actividades.");
    }

    actividades = Array.isArray(data.actividades) ? data.actividades : [];
    actualizarContadores();
    renderizarActividades();
  } catch (error) {
    contenedorActividades.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger mb-0">${escaparHtml(error.message)}</div>
      </div>
    `;
  }
}

function actualizarContadores() {
  const inscritas = actividades.filter((a) => Boolean(a.inscrito)).length;
  document.getElementById("totalDisponibles").textContent = actividades.length;
  document.getElementById("totalInscritas").textContent = inscritas;
}

function obtenerFiltradas() {
  const texto = buscarInput.value.trim().toLowerCase();
  const filtro = filtroSelect.value;

  return actividades.filter((act) => {
    const coincideTexto =
      !texto ||
      String(act.nombreActividad || "").toLowerCase().includes(texto) ||
      String(act.municipio || "").toLowerCase().includes(texto);

    const estaInscrito = Boolean(act.inscrito);
    const coincideFiltro =
      filtro === "todas" ||
      (filtro === "disponibles" && !estaInscrito) ||
      (filtro === "inscritas" && estaInscrito);

    return coincideTexto && coincideFiltro;
  });
}

function renderizarActividades() {
  const lista = obtenerFiltradas();
  contenedorActividades.innerHTML = "";

  if (lista.length === 0) {
    contenedorActividades.innerHTML = `
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5 text-muted">
            No hay actividades que coincidan con el filtro.
          </div>
        </div>
      </div>
    `;
    return;
  }

  lista.forEach((act) => {
    const inscrito = Boolean(act.inscrito);
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    col.innerHTML = `
      <div class="card border-0 shadow-sm h-100 card-actividad">
        <div class="card-body d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h2 class="h6 fw-bold mb-0">${escaparHtml(act.nombreActividad)}</h2>
              <span class="badge ${inscrito ? "text-bg-success" : "text-bg-primary"}">
                ${inscrito ? "Inscrito" : "Disponible"}
              </span>
            </div>
            <p class="small text-muted mb-1">
              <i class="bi bi-calendar3 me-1"></i> ${escaparHtml(act.fechaEvento || "")}
            </p>
            <p class="small text-muted mb-3">
              <i class="bi bi-geo-alt me-1"></i> ${escaparHtml(act.municipio || "")}
            </p>
          </div>
          <button
            type="button"
            class="btn w-100 ${inscrito ? "btn-outline-danger" : "btn-primary"}"
            data-id="${act.idActividad}"
          >
            <i class="bi ${inscrito ? "bi-x-circle" : "bi-check-circle"} me-1"></i>
            ${inscrito ? "Cancelar suscripción" : "Suscribirme"}
          </button>
        </div>
      </div>
    `;

    const boton = col.querySelector("button");
    boton.addEventListener("click", () => abrirConfirmacion(act));
    contenedorActividades.appendChild(col);
  });
}

function abrirConfirmacion(actividad) {
  actividadSeleccionada = actividad;
  const inscrito = Boolean(actividad.inscrito);
  const bloqueEncuesta = document.getElementById("bloqueEncuesta");

  document.getElementById("tituloConfirmar").textContent = inscrito
    ? "Cancelar suscripción"
    : "Suscribirse a actividad";

  document.getElementById("textoConfirmar").innerHTML = inscrito
    ? `¿Deseas cancelar tu suscripción a <strong>${escaparHtml(actividad.nombreActividad)}</strong>?`
    : `¿Deseas suscribirte a <strong>${escaparHtml(actividad.nombreActividad)}</strong> (${escaparHtml(actividad.fechaEvento)})?`;

  if (bloqueEncuesta) {
    bloqueEncuesta.classList.toggle("d-none", inscrito);
    document.getElementById("encuestaTransporte").value = "Transporte propio";
    document.getElementById("encuestaAcompanantes").value = "0";
    document.getElementById("encuestaComentario").value = "";
  }

  btnConfirmarAccion.className = `btn ${inscrito ? "btn-danger" : "btn-primary"}`;
  btnConfirmarAccion.textContent = inscrito ? "Sí, cancelar" : "Sí, suscribirme";
  modalConfirmar.show();
}

btnConfirmarAccion.addEventListener("click", async () => {
  if (!actividadSeleccionada) return;

  const inscrito = Boolean(actividadSeleccionada.inscrito);
  btnConfirmarAccion.disabled = true;

  const payload = {
    idActividad: actividadSeleccionada.idActividad
  };

  if (!inscrito) {
    payload.encuesta = {
      transporte: document.getElementById("encuestaTransporte").value,
      acompanantes: document.getElementById("encuestaAcompanantes").value,
      comentario: document.getElementById("encuestaComentario").value.trim()
    };
  }

  try {
    const resp = await fetch("../Modelo/gestionarInscripciones.php", {
      method: inscrito ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok || !data.success) {
      throw new Error(data.mensaje || "No se pudo actualizar la suscripción.");
    }

    modalConfirmar.hide();
    await cargarActividades();
  } catch (error) {
    alert(error.message);
  } finally {
    btnConfirmarAccion.disabled = false;
  }
});

function escaparHtml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

buscarInput.addEventListener("input", renderizarActividades);
filtroSelect.addEventListener("change", renderizarActividades);
cargarActividades();