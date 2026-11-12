<?php
require_once __DIR__ . '/../Config/conexion.php';

class asociados{
    private $documento;
    private $nombres;
    private $apellidos;
    private $fechaNacimiento;
    private $direccionResidencia;
    private $genero;
    private $ciudad;
    private $telefono;
    private $email;
    private $contraseña;

    private $conexion;

public function __construct($datos){
   $this->documento = $datos['Documento'];
   $this->nombres = $datos['Nombres'];
   $this->apellidos = $datos['Apellidos'];
   $this->fechaNacimiento = $datos['FechaNacimiento'];
   $this->direccionResidencia = $datos['DirecciónDeResidencia']; 
   $this->ciudad = $datos['Ciudad'];
   $this->telefono = $datos['Telefono'];
   $this->email = $datos['Email'];
   $this->contraseña = password_hash($datos['Contraseña'], PASSWORD_DEFAULT); /*Encripta la contraseña antes de guardarla en la base de datos*/
   $this->genero = $datos['Genero'];
 

   $conexionDB = new Conexion();
   $this->conexion = $conexionDB->conectar();
   
}
public function guardar(){
    $sql = "INSERT INTO asociados (documento, nombres, apellidos, fechaNacimiento, direccionResidencia, genero, ciudad, telefono, email, contraseña) 
    VALUES (:documento, :nombres, :apellidos, :fechaNacimiento, :direccionResidencia, :genero, :ciudad, :telefono, :email, :contrasena)";
    $consulta = $this->conexion->prepare($sql);
    $consulta->execute([
        ':documento' => $this->documento,
        ':nombres' => $this->nombres,
        ':apellidos' => $this->apellidos,
        ':fechaNacimiento' => $this->fechaNacimiento,
        ':direccionResidencia' => $this->direccionResidencia,
        ':genero' => $this->genero,
        ':ciudad' => $this->ciudad,
        ':telefono' => $this->telefono,
        ':email' => $this->email,
        ':contrasena' => $this->contraseña
    ]);
}
};


