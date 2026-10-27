const Usuarios = [
    {Usuario: 'admin@gmail.com', clave: '123', Rol: 'admin' , Nombre: 'Admin  MR'},
    {Usuario: 'pepito@gmail.com', clave: '123', Rol: 'asociados' , Nombre : 'Juan Perez'}
];

document.getElementById('FormuLogin').addEventListener('submit', function (e) {
    e.preventDefault();
    


    const UsuarioInput = document.getElementById('Email').value;
    const claveInput  = document.getElementById('Password').value;
    
    const usuarioEncontrado = Usuarios.find(
        u => u.Usuario === UsuarioInput && u.clave === claveInput
    );

    if(usuarioEncontrado){
        localStorage.setItem('Logueado', 'true');
        localStorage.setItem('Rol', usuarioEncontrado.Rol);
        localStorage.setItem('Nombre', usuarioEncontrado.Nombre);
        window.location.href = "PaginaPrincipal.html";
    alert(claveInput)

    }
    else{
        alert('Usuario o contraseña incorrecta')
    }
});