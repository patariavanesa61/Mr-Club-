<?php
require_once __DIR__ . '/../Config/conexion.php';
require_once __DIR__ . '/calculos.php';

class Pagos {
    private $conexion;

    public function __construct() {
        $conexionDB = new Conexion();
        $this->conexion = $conexionDB->conectar();
    }

    public function obtenerPrestamos($documento) {
        $sql = "SELECT pr.idPrestamo, pr.valorPrestamo, pr.tasaInteres,
                       pr.numeroCuotas, pr.fechaPrestamo,
                       COALESCE(SUM(p.valorCuota), 0) AS totalPagado
                FROM prestamos pr
                INNER JOIN asociados a ON a.idAsociado = pr.idAsociado
                LEFT JOIN pagos_cuotas p ON p.idPrestamo = pr.idPrestamo
                WHERE a.documento = :documento
                GROUP BY pr.idPrestamo, pr.valorPrestamo, pr.tasaInteres,
                         pr.numeroCuotas, pr.fechaPrestamo
                ORDER BY pr.idPrestamo DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([":documento" => $documento]);
        $prestamos = $consulta->fetchAll(PDO::FETCH_ASSOC);

        foreach ($prestamos as &$p) {
            $p["cuotaMensual"] = calcularCuota($p["valorPrestamo"], $p["tasaInteres"], $p["numeroCuotas"]);
            $p["totalAPagar"]  = calcularTotalAPagar($p["valorPrestamo"], $p["tasaInteres"], $p["numeroCuotas"]);
            $p["saldo"]        = max(round($p["totalAPagar"] - (float) $p["totalPagado"], 2), 0);
        }
        unset($p);
        return $prestamos;
    }

    public function obtenerPagos($documento) {
        $sql = "SELECT p.idPago, p.idPrestamo, p.fechaPago, p.valorCuota
                FROM pagos_cuotas p
                INNER JOIN prestamos pr ON pr.idPrestamo = p.idPrestamo
                INNER JOIN asociados a ON a.idAsociado = pr.idAsociado
                WHERE a.documento = :documento
                ORDER BY p.fechaPago DESC, p.idPago DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([":documento" => $documento]);
        return $consulta->fetchAll(PDO::FETCH_ASSOC);
    }

    // Devuelve: "ok", "no_existe", "pagado" o "excede"
    public function registrarAbono($documento, $idPrestamo, $valor) {
        $this->conexion->beginTransaction();
        try {
            // Bloquea el préstamo para que dos abonos a la vez no superen el saldo
            $sql = "SELECT pr.valorPrestamo, pr.tasaInteres, pr.numeroCuotas
                    FROM prestamos pr
                    INNER JOIN asociados a ON a.idAsociado = pr.idAsociado
                    WHERE pr.idPrestamo = :idPrestamo AND a.documento = :documento
                    FOR UPDATE";
            $consulta = $this->conexion->prepare($sql);
            $consulta->execute([":idPrestamo" => $idPrestamo, ":documento" => $documento]);
            $prestamo = $consulta->fetch(PDO::FETCH_ASSOC);

            if (!$prestamo) {
                $this->conexion->rollBack();
                return "no_existe";
            }

            $suma = $this->conexion->prepare("SELECT COALESCE(SUM(valorCuota), 0) FROM pagos_cuotas WHERE idPrestamo = :idPrestamo");
            $suma->execute([":idPrestamo" => $idPrestamo]);
            $pagado = (float) $suma->fetchColumn();

            $total = calcularTotalAPagar($prestamo["valorPrestamo"], $prestamo["tasaInteres"], $prestamo["numeroCuotas"]);
            $saldo = round($total - $pagado, 2);

            if ($saldo < 1) {
                $this->conexion->rollBack();
                return "pagado";
            }
            if ($valor > $saldo + 0.009) {
                $this->conexion->rollBack();
                return "excede";
            }

            $insertar = $this->conexion->prepare(
                "INSERT INTO pagos_cuotas (valorCuota, fechaPago, idPrestamo)
                 VALUES (:valor, CURDATE(), :idPrestamo)"
            );
            $insertar->execute([":valor" => $valor, ":idPrestamo" => $idPrestamo]);

            $this->conexion->commit();
            return "ok";
        } catch (Exception $e) {
            if ($this->conexion->inTransaction()) {
                $this->conexion->rollBack();
            }
            throw $e;
        }
    }
}