const formulario = document.getElementById('FormuRegistro');

formulario.addEventListener('submit', async function(event) {
    alert("Formulario enviado"); // Muestra un alert cuando se envía el formulario

    // Evita recargar la pagina al enviar el formulario.
    event.preventDefault();


    const botonGuardar = formulario.querySelector('button[type="submit"]');
    // Lee los campos del formulario y los convierte en un objeto.
    const asociado = Object.fromEntries(new FormData(formulario).entries());
    alert(JSON.stringify(asociado)); // Muestra los datos del formulario en un alert para depuración

    if(asociado.Contraseña !== asociado.ConfirmarContraseña) {
        document.getElementById('MensajeRegistro').textContent = "Las contraseñas no coinciden.";
        return;
    }
    
    delete asociado.ConfirmarContraseña; // Elimina el campo de confirmación de contraseña antes de enviarlo al servidor

    botonGuardar.disabled = true;// Deshabilitar el botón mientras se procesa la solicitud

    try{
        // CAMBIO 1: "Guardando..." ahora se muestra antes del fetch para que se alcance a ver
        document.getElementById('MensajeRegistro').textContent = "Guardando...";
        document.getElementById('MensajeRegistro').dataset.tipo = '';

        // CAMBIO 2: getAttribute en lugar de formulario.action (corrige el subrayado rojo)
        const respuesta = await fetch(formulario.getAttribute('action'), {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asociado)
        });
  
        // Pasar la respuesta a JSON a un objeto de JavaScript
        const resultado = await respuesta.json();

        document.getElementById('MensajeRegistro').textContent = resultado.mensaje;

        if (respuesta.ok && resultado.success) {
            formulario.reset();  //  Limpiar el formulario si la solicitud fue exitosa
        }
    } catch (error) {
        console.error('Error al enviar el formulario:',error);
        document.getElementById("MensajeRegistro").textContent ="Ocurrió un error al enviar el formulario. Por favor, inténtelo de nuevo más tarde.";
    } finally {
        botonGuardar.disabled = false; // Habilitar el botón después de procesar la solicitud.
    }
});