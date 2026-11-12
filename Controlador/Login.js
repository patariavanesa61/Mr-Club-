const formulario = document.getElementById('FormuLogin');
formulario.addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const botton = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById("mensajelogin");

    botton.disabled = true;
    try{
        const respuesta = await fetch(formulario.action, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(Object.fromEntries(new FormData(formulario).entries())),
        });

        const resultado = await respuesta.json();

        if(!resultado.success){ /*!Signo para negar*/
            mensaje.textContent = "No fue posible iniciar sesión. Por favor, verifica tus credenciales";
            botton.disabled = false;
            return;
        }
        localStorage.setItem("Logueado", "true");
        localStorage.setItem("Rol", resultado.Rol);
        localStorage.setItem("Nombre", resultado.Nombre);
        window.location.href = "PaginaPrincipal.html";

    }catch (error){
        console.error("Error al iniciar sesión",error);
        mensaje.textContent = "Ocurrio un error al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde.";
    } finally{
        botton.disabled = false;
    }


    
});