const listaPrestamos = document.getElementById("listaPrestamos");
const listaPagos = document.getElementById("listaPagos");
const mensaje = document.getElementById("mensaje");
const formAbono = document.getElementById("formAbono");
const inputAbono = document.getElementById("valorAbono");
const errorAbono = document.getElementById("errorAbono");
const modalAbono = new bootstrap.Modal(document.getElementById("modalAbono"));

let prestamos = [];
let prestamoActual = null;

// ===== Utilidades =====
function pesos(valor) {
    return Number(valor).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function formatoFecha(fecha) {
    const f = new Date(fecha + "T00:00:00");
    return f.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function mostrarMensaje(texto, tipo = "success") {
    mensaje.className = `alert alert-${tipo}`;
    mensaje.textContent = texto;
    if (tipo === "success") {
        setTimeout(() => mensaje.classList.add("d-none"), 5000);
    }
}

// ===== Carga de datos =====
async function cargarPagos() {
    try {
        const respuesta = await fetch("../Modelo/gestionarPagos.php");
        if (respuesta.status === 401) {
            window.location.href = "Login.html";
            return;
        }
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "Error en la solicitud");
        }
        prestamos = resultado.prestamos;
        mostrarResumen(prestamos);
        mostrarPrestamos(prestamos);
        mostrarPagos(resultado.pagos);
    } catch (error) {
        mostrarMensaje(error.message, "danger");
    }
}

// ===== Resumen =====
function mostrarResumen(lista) {
    const suma = (campo) => lista.reduce((total, p) => total + Number(p[campo]), 0);
    document.getElementById("totalPrestado").textContent = pesos(suma("valorPrestamo"));
    document.getElementById("totalAPagar").textContent = pesos(suma("totalAPagar"));
    document.getElementById("totalAbonado").textContent = pesos(suma("totalPagado"));
    document.getElementById("saldoPendiente").textContent = pesos(suma("saldo"));
}

// ===== Tarjetas de préstamos =====
function crearDato(etiqueta, valor) {
    return `
        <div class="col-6">
          <div class="dato-etiqueta">${etiqueta}</div>
          <div class="dato-valor">${valor}</div>
        </div>`;
}

function crearTarjetaPrestamo(p) {
    const total = Number(p.totalAPagar);
    const pagado = Number(p.totalPagado);
    const saldo = Number(p.saldo);
    const cuota = Number(p.cuotaMensual);
    const liquidado = saldo < 1;
    const porcentaje = total > 0 ? Math.min(Math.round((pagado / total) * 100), 100) : 0;
    const cuotasCubiertas = cuota > 0 ? Math.min(Math.floor((pagado + 1) / cuota), Number(p.numeroCuotas)) : 0;

    const columna = document.createElement("div");
    columna.className = "col-md-6 col-xl-4";
    columna.innerHTML = `
      <div class="card prestamo-card shadow-sm h-100 ${liquidado ? "liquidado" : ""}">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <div class="h5 mb-0">Préstamo #${Number(p.idPrestamo)}</div>
              <small class="text-muted">Desde ${formatoFecha(p.fechaPrestamo)}</small>
            </div>
            <span class="badge ${liquidado ? "text-bg-secondary" : "text-bg-success"}">
              ${liquidado ? "Pagado" : "Activo"}
            </span>
          </div>

          <div class="row g-3 mb-3">
            ${crearDato("Valor prestado", pesos(p.valorPrestamo))}
            ${crearDato("Tasa mensual", Number(p.tasaInteres) + " %")}
            ${crearDato("Plazo", Number(p.numeroCuotas) + " meses")}
            ${crearDato("Cuota mensual", pesos(cuota))}
          </div>

          <div class="mb-1 d-flex justify-content-between small">
            <span class="text-muted">Progreso de pago</span>
            <span class="fw-semibold">${porcentaje}%</span>
          </div>
          <div class="progress mb-2" role="progressbar" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar ${liquidado ? "bg-secondary" : "bg-success"}" style="width: ${porcentaje}%"></div>
          </div>
          <div class="small text-muted mb-3">
            Cuotas cubiertas: ${cuotasCubiertas} de ${Number(p.numeroCuotas)}
          </div>

          <div class="mt-auto d-flex justify-content-between align-items-end">
            <div>
              <div class="dato-etiqueta">Saldo pendiente</div>
              <div class="h5 mb-0 ${liquidado ? "text-secondary" : "text-danger"}">${pesos(saldo)}</div>
            </div>
            <button type="button" class="btn btn-success btn-abonar" ${liquidado ? "disabled" : ""}>
              <i class="bi bi-cash-coin me-1"></i> Abonar
            </button>
          </div>
        </div>
      </div>`;

    columna.querySelector(".btn-abonar").addEventListener("click", () => abrirModalAbono(p));
    return columna;
}

function mostrarPrestamos(lista) {
    listaPrestamos.replaceChildren();

    if (lista.length === 0) {
        const columna = document.createElement("div");
        columna.className = "col-12";
        columna.innerHTML = `
          <div class="card shadow-sm border-0">
            <div class="card-body text-center text-muted py-5">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              Aún no tienes préstamos registrados.
            </div>
          </div>`;
        listaPrestamos.append(columna);
        return;
    }

    lista.forEach((p) => listaPrestamos.append(crearTarjetaPrestamo(p)));
}

// ===== Historial =====
function crearCelda(texto, clase = "") {
    const celda = document.createElement("td");
    celda.className = `py-3 px-3 ${clase}`;
    celda.textContent = texto;
    return celda;
}

function mostrarPagos(pagos) {
    listaPagos.replaceChildren();

    if (pagos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 4;
        celda.className = "text-center py-4 text-muted";
        celda.textContent = "Aún no tienes pagos registrados.";
        fila.append(celda);
        listaPagos.append(fila);
        return;
    }

    pagos.forEach((pago) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda(pago.idPago),
            crearCelda(`#${pago.idPrestamo}`),
            crearCelda(formatoFecha(pago.fechaPago)),
            crearCelda(pesos(pago.valorCuota), "text-end fw-semibold")
        );
        listaPagos.append(fila);
    });
}

// ===== Modal de abono =====
function abrirModalAbono(prestamo) {
    prestamoActual = prestamo;
    errorAbono.classList.add("d-none");

    document.getElementById("tituloModalAbono").textContent = `Abonar al préstamo #${prestamo.idPrestamo}`;
    document.getElementById("modalCuota").textContent = pesos(prestamo.cuotaMensual);
    document.getElementById("modalSaldo").textContent = pesos(prestamo.saldo);

    inputAbono.max = Number(prestamo.saldo);
    inputAbono.value = Math.min(Number(prestamo.cuotaMensual), Number(prestamo.saldo)).toFixed(2);
    modalAbono.show();
}

document.getElementById("btnPagarCuota").addEventListener("click", () => {
    if (prestamoActual) {
        inputAbono.value = Math.min(Number(prestamoActual.cuotaMensual), Number(prestamoActual.saldo)).toFixed(2);
    }
});

document.getElementById("btnPagarSaldo").addEventListener("click", () => {
    if (prestamoActual) {
        inputAbono.value = Number(prestamoActual.saldo).toFixed(2);
    }
});

formAbono.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorAbono.classList.add("d-none");

    const datos = {
        idPrestamo: Number(prestamoActual.idPrestamo),
        valorAbono: Number(inputAbono.value),
    };
    if (!(datos.valorAbono >= 1)) {
        errorAbono.textContent = "Ingresa un valor de abono válido";
        errorAbono.classList.remove("d-none");
        return;
    }

    const boton = document.getElementById("btnConfirmarAbono");
    boton.disabled = true;

    try {
        const respuesta = await fetch("../Modelo/gestionarPagos.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
        });
        if (respuesta.status === 401) {
            window.location.href = "Login.html";
            return;
        }
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "Error en la solicitud");
        }
        modalAbono.hide();
        await cargarPagos();
        mostrarMensaje(resultado.mensaje);
    } catch (error) {
        errorAbono.textContent = error.message;
        errorAbono.classList.remove("d-none");
    } finally {
        boton.disabled = false;
    }
});

cargarPagos();