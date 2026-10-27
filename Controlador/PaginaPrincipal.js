document.addEventListener('DOMContentLoaded', () => {
    const Logueado = localStorage.getItem('Logueado');
    if (Logueado !== 'True') {
        window.location.href = 'Login.html'
        return;
    }

    const Nombre = localStorage.getItem('Nombre');
    const Rol = localStorage.getItem('Rol');

    document.getElementById('NombreUsuario').textContent = Nombre;

    if (Rol === 'admin') {
        document.getElementById('TarjetasAdministrador').classList.remove('d-none');
        document.getElementById('TarjetasAsociados').classList.add('d-done');
    }
    else{
        document.getElementById('TarjetasAdministrador').classList.add('d-none');
        document.getElementById('TarjetasAsociados').classList.remove('d-done');
    }
});

function CerrarSesion(){
    localStorage.clear;
    window.location.href = '../Vista/login.htlm';
}