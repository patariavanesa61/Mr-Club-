const listaPagos = document.getElementById("listaPagos");
const mensaje = document.getElementById("mensaje");

function formatoPesos(valor) {
    return Number(valor).toLocaleString("es-CO", { style: "currency", currency: "COP" });
}

function crearCelda(texto, clase = "") {
    const celda = document.createElement("td");
    celda.className = `py-3 px-3 ${clase}`;
    celda.textContent = texto;
    return celda;
}

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
        mostrarResumen(resultado.prestamos, resultado.pagos);
        mostrarPagos(resultado.pagos);
    } catch (error) {
        mensaje.className = "alert alert-danger";
        mensaje.textContent = error.message;
    }
}

function mostrarResumen(prestamos, pagos) {
   const totalPrestado = prestamos.reduce((suma, p) => suma + Number(p.valorPrestamo), 0);
   const totalAbonado = pagos.reduce((suma, p) => suma + Number(p.valorCuota), 0);



    document.getElementById("totalPrestado").textContent = formatoPesos(totalPrestado);
    document.getElementById("totalAbonado").textContent = formatoPesos(totalAbonado);
    document.getElementById("saldoPendiente").textContent = formatoPesos(Math.max(totalPrestado - totalAbonado, 0));
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
            crearCelda(pago.idPrestamo),
            crearCelda(pago.fechaPago),
            crearCelda(formatoPesos(pago.valorCuota), "text-end")
        );
        listaPagos.append(fila);
    });
}

cargarPagos();