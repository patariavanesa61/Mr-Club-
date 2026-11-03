document.addEventListener("DOMContentLoaded", () => {
    const formActividad = document.getElementById("formActividad");

    if (formActividad) {
        formActividad.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const inputs = formActividad.querySelectorAll("input, select, textarea");
            const nombreActividad = inputs[0] ? inputs[0].value : "Actividad";

            alert(`¡La actividad "${nombreActividad}" se ha registrado y programado con éxito!`);
            formActividad.reset();
        });
    }

    console.log("Módulo de Registro de Actividades cargado correctamente.");
});