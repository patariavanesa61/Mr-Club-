// ===== IDs del HTML (ajústalos si los tuyos se llaman distinto) =====
const formPrestamo = document.getElementById("formPrestamo");
const selectAsociado = document.getElementById("selectAsociado");
const inputMonto = document.getElementById("montoPrestamo");
const inputPlazo = document.getElementById("plazoMeses");
const inputTasa = document.getElementById("tasaInteres");
const listaPrestamos = document.getElementById("listaPrestamos"); // <tbody> de la tabla de seguimiento

function formatoPesos(valor) {
    return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

async function solicitarApi(url, metodo = "GET", datos) {
    const opciones = {
        method: metodo,
        headers: { "Content-Type": "application/json" },
    };
    if (datos) {
        opciones.body = JSON.stringify(datos);
    }
    const respuesta = await fetch(url, opciones);
    if (respuesta.status === 401) {
        window.location.href = "Login.html";
        throw new Error("Sesión no iniciada");
    }
    const resultado = await respuesta.json();
    if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.mensaje || "Error en la solicitud");
    }
    return resultado;
}

// ===== Asociados en el desplegable =====
async function cargarAsociados() {
    try {
        const resultado = await solicitarApi("../Modelo/listarAsociados.php");
        resultado.asociados.forEach((asociado) => {
            const opcion = document.createElement("option");
            opcion.value = asociado.idAsociado;
            opcion.textContent = `${asociado.nombres} ${asociado.apellidos} - ${asociado.documento}`;
            selectAsociado.append(opcion);
        });
    } catch (error) {
        alert("Error al cargar los asociados: " + error.message);
    }
}

// ===== Tabla de seguimiento =====
function crearCelda(texto, clase = "") {
    const celda = document.createElement("td");
    celda.className = clase;
    celda.textContent = texto;
    return celda;
}

function crearBadgeEstado(pagado) {
    const celda = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = pagado ? "badge bg-success" : "badge bg-primary";
    badge.textContent = pagado ? "Pagado" : "Activo";
    celda.append(badge);
    return celda;
}

function mostrarPrestamos(prestamos) {
    listaPrestamos.replaceChildren();

    if (prestamos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.className = "text-center text-muted py-4";
        celda.textContent = "No hay préstamos registrados.";
        fila.append(celda);
        listaPrestamos.append(fila);
        return;
    }

    prestamos.forEach((prestamo) => {
        const saldo = Math.max(Number(prestamo.valorPrestamo) - Number(prestamo.totalPagado), 0);
        const pagado = saldo === 0;

        const fila = document.createElement("tr");
        fila.append(
            crearCelda(prestamo.idPrestamo),
            crearCelda(`${prestamo.nombres} ${prestamo.apellidos}`),
            crearCelda(formatoPesos(prestamo.valorPrestamo)),
            crearCelda(formatoPesos(saldo)),
            crearCelda(`${prestamo.cuotasPagadas}/${prestamo.numeroCuotas}`),
            crearBadgeEstado(pagado)
        );
        listaPrestamos.append(fila);
    });
}

async function cargarPrestamos() {
    try {
        const resultado = await solicitarApi("../Modelo/gestionarPrestamos.php");
        mostrarPrestamos(resultado.prestamos);
    } catch (error) {
        alert("Error al cargar los préstamos: " + error.message);
    }
}

// ===== Registrar préstamo =====
formPrestamo.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = {
        idAsociado: Number(selectAsociado.value),
        valorPrestamo: Number(inputMonto.value),
        numeroCuotas: Number(inputPlazo.value),
        tasaInteres: Number(String(inputTasa.value).replace(",", ".")),
    };

    if (!datos.idAsociado) {
        alert("Selecciona un asociado");
        return;
    }
    if (!(datos.valorPrestamo > 0)) {
        alert("Ingresa un monto válido");
        return;
    }
    if (!Number.isInteger(datos.numeroCuotas) || datos.numeroCuotas < 1) {
        alert("Ingresa un plazo válido en meses");
        return;
    }
    if (!(datos.tasaInteres >= 0)) {
        alert("Ingresa una tasa de interés válida");
        return;
    }

    const boton = formPrestamo.querySelector("button[type='submit']");
    boton.disabled = true;

    try {
        const resultado = await solicitarApi("../Modelo/gestionarPrestamos.php", "POST", datos);
        formPrestamo.reset();
        await cargarPrestamos();
        alert(resultado.mensaje);
    } catch (error) {
        alert(error.message);
    } finally {
        boton.disabled = false;
    }
});

cargarAsociados();
cargarPrestamos();