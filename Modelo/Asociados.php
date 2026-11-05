<?php
require_once__DIR__ . '/Config/conexion.php';

class Asociados{
    private $Documento;
    private $Nombres;
    private $Apellidos;
    private $FechaNacimiento;
    private $DireccionResidencia;
    private $Ciudad;
    private $Telefono;
    private $email;
    private $genero;

    private $conexion;

public function __construct($datos){
   $this->Documento = $datos['documento'];
   $this->Nombres = $datos['nombres'];
   $this->Apellidos = $datos['apellidos'];
   $this->FechaNacimiento = $datos['fechaNacimiento'];
   $this->DireccionResidencia = $datos['direccionResidencia']; 
   $this->Ciudad = $datos['ciudad'];
   $this->Telefono = $datos['telefono'];
   $this->email = $datos['email'];
   $this->genero = $datos['genero'];

   $this->conexiondb = new Conexion();
   $this->conexion = $conexiondb->conectar();
   
}
public function guardar(){
    $sql = "INSERT INTO Asociados (documento, nombres, apellidos, fechaNacimiento, direccionResidencia, ciudad, telefono, email, genero) VALUES (:documento, :nombres, :apellidos, :fechaNacimiento, :direccionResidencia, :ciudad, :telefono, :email, :genero)";
    $consulta = $this->conexion->prepare($sql);
    $consulta->execute([
        ':documento' => $this->Documento,
        ':nombres' => $this->Nombres,
        ':apellidos' => $this->Apellidos,
        ':fechaNacimiento' => $this->FechaNacimiento,
        ':direccionResidencia' => $this->DireccionResidencia,
        ':ciudad' => $this->Ciudad,
        ':telefono' => $this->Telefono,
        ':email' => $this->email,
        ':genero' => $this->genero
    ]);
}
}


