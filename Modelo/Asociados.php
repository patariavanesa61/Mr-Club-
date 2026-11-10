<?php
require_once __DIR__ . '/../Config/conexion.php';

class sociados{
    private $Documento;
    private $Nombres;
    private $Apellidos;
    private $FechaNacimiento;
    private $DireccionResidencia;
    private $Ciudad;
    private $Telefono;
    private $Email;
    private $Contraseña;
    private $Genero;

    private $conexion;

public function __construct($datos){
   $this->Documento = $datos['Documento'];
   $this->Nombres = $datos['Nombres'];
   $this->Apellidos = $datos['Apellidos'];
   $this->FechaNacimiento = $datos['FechaNacimiento'];
   $this->DireccionResidencia = $datos['DireccionResidencia']; 
   $this->Ciudad = $datos['Ciudad'];
   $this->Telefono = $datos['Telefono'];
   $this->contraseña = password_hash($datos['contraseña'], PASSWORD_DEFAULT); /*Encripta la contraseña antes de guardarla en la base de datos*/
   $this->Email = $datos['Email'];
   $this->Genero = $datos['Genero'];

   $conexionDB = new Conexion();
   $this->conexion = $conexionDB->conectar();
   
}
public function guardar(){
    $sql = "INSERT INTO Asociados (documento, nombres, apellidos, fechaNacimiento, direccionResidencia, ciudad, telefono, email, contraseña, genero) VALUES (:documento, :nombres, :apellidos, :fechaNacimiento, :direccionResidencia, :ciudad, :telefono, :email, :contraseña, :genero)";
    $consulta = $this->conexion->prepare($sql);
    $consulta->execute([
        ':documento' => $this->Documento,
        ':nombres' => $this->Nombres,
        ':apellidos' => $this->Apellidos,
        ':fechaNacimiento' => $this->FechaNacimiento,
        ':direccionResidencia' => $this->DireccionResidencia,
        ':ciudad' => $this->Ciudad,
        ':telefono' => $this->Telefono,
        ':email' => $this->Email,
        ':Contraseña' => $this->Contraseña,
        ':genero' => $this->Genero
    ]);
}
}


