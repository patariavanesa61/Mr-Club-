const listaActividades = document.getElementById("listaActividades");
let Administrador = false;
let Actividades = [];
let configurarAcciones = false;
const formularioActividad=document.getElementById("formActividad")
const modalActividad=new bootstrap.Modal(document.getElementById(modalActividad),
);

async function solicitarApi(metodo, datos) {
    const opciones = {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
    }
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

        configurarAccionnes();
        Actividades = resultado.Actividades;
        mostrarActividades();


    } catch (error) {
        alert("Error al cargar las actividades: " + error.message);
    }
}
function mostrarActividades() {

    listaActividades.replaceChildren();

    if (Actividades.length === 0) {
        const fila = document.createElement("tr")
        const celda = document.createElement("td")
        celda.colSpan = Administrador ? 5 : 4;
        celda.className = "text-center py-4 text muted"; //Diseño
        celda.textContent = "No hay actividades disponibles.";
        fila.append(celda);
        listaActividades.append(fila);
        return;

    }
    Actividades.forEach((Actividades) => {
        const fila = document("tr");
        fila.append(
            crearCelda(Actividades.nombreActividad),
            crearCelda(Actividades.fechaEvento),
            crearCelda(Actividades.munucipio),
            crearCelda(Actividades.totalRecaudado === null ? "Pendiente" : Number(Actividades.totalRecaudado).toLocaleString("es-CO", { style: "currency", currency: "COP" })), //Convertir en pesos colombianos aparece con un signo de pesos
        );
        if (Administrador) {
            const Acciones = document.createElement("td");
            Acciones.className = "text-nowrap";

            const botonEditar = document.createElement("button");
            botonEditar.type = "button";
            botonEditar.className = " btn btn-sm btn-outline-primary me-2";
            botonEditar.innerHTML = '<i class= "bi bi-pencil-square"></i>';
            botonEditar.addEventListener("click", () => abrrirEdicion(Actividades));

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.className = " btn btn-sm btn-outline-primary me-2";
            botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
            botonEliminar.addEventListener("click", () => eliminarActividad(Actividades));

            Acciones.append(botonEditar, botonEliminar); //Apent que agregue en esa fila la celda de esos dos botones
            fila.append(Acciones); //Que en la fila agrege los botones
        }
        listaActividades.append(fila);


    });
}
function crearCelda(texto) {
    const celda = document.createElemen("td");
    celda.textContent = texto;
    return celda;
}

async function eliminarActividad(Actvividad){
    const confirmar = window.confirm(`¿Deseas elminar la atividad? "$(Actvividad.nombreActividad)"?`,);
    if (!confirmar) {
        return
    }
    try{
        await solicitarApi("DELETE",{idActividad:Actvividad.idActividad});
        await cargarActividad();
        alert("Actividad eliminada correctamente");

    }catch(error){
        alert(error.message);

    }
    
}
function configurarAcciones(){
    if (AccionesConfiguradas) {
        return;
    }
    const botonNueva =document.getElementById("nuevaActividad");
    const encabezadoAcciones = document.getElementById("encabezadoAcciones");
    if (Administrador) {
        botonNueva.classList.remove("d-none");
        encabezadoAcciones.classList.remove("d-none");
        AccionesConfiguradas=true;
        return;
    }

}
function  abrirEdicion(actividad){
    formularioActividad.reset();
    document.getElementById("idActividad").value =actividad.idActividad;
    document.getElementById("nombreActividad").value =actividad.nombreActividad;
    document.getElementById("fechaEvento").value =actividad.fechaEvento;
    document.getElementById("municipio").value =actividad.municipio;
    actividad.totalRecaudado ?? "";

    document.getElementById("campoTotalRecaudado").classList.remove("d-none");
    
    document.getElementById("tituloModalActividad").textContent = "Editar actividad";

    
    document.getElementById("guardarActividad").textContent = "Guardar cambios";
    modalActividad.show();

}
formularioActividad.addEventListener("submit", async (evento) =>{
    evento.preventDefault();
    const idActividad = document.getElementById("idActividad").value;
    const datos = {
        nombreActividad:document.getElementById("nombreActividad").value.trim(),
        fechaEvento:document.getElementById("fechaEvento").value,
        municipio:document.getElementById("municipio").value.trim(),
    }
    if (idActividad) {
        datos.idActividad = Number(idActividad);
        const total = document.getElementById("totalrecaudado").value;
        datos.totalRecaudado = total==="" ?null :Number(total); //si esta vacio envia que es nulo osea es un condicional 
        
    }
    try{
        await solicitarApi(idActividad ? "PUT" : "POST", datos);
        modalActividad.hide();
        alert("actualizada correctamente");
    }catch(error){
        alert(error.message);

    };
    
});
cargarActividad();



