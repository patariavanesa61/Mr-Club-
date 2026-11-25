<?php
require_once __DIR__ . '/../Config/conexion.php';

class Pagos {
    private $conexion;

    public function __construct() {
        $conexionDB = new Conexion();
        $this->conexion = $conexionDB->conectar();
    }

    public function obtenerPrestamos($documento) {
        $sql = "SELECT pr.idPrestamo, pr.valorPrestamo, pr.tasaInteres,
                       pr.numeroCuotas, pr.fechaPrestamo
                FROM prestamos pr
                INNER JOIN asociados a ON a.idAsociado = pr.idAsociado
                WHERE a.documento = :documento";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([":documento" => $documento]);
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerPagos($documento) {
        $sql = "SELECT p.idPago, p.idPrestamo, p.fechaPago, p.valorCuota
                FROM pagos_cuotas p
                INNER JOIN prestamos pr ON pr.idPrestamo = p.idPrestamo
                INNER JOIN asociados a ON a.idAsociado = pr.idAsociado
                WHERE a.documento = :documento
                ORDER BY p.fechaPago DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([":documento" => $documento]);
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }
}