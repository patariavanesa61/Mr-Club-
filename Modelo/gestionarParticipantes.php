<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/../Config/conexion.php';

try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para continuar");
    }

    $esAdmin = $_SESSION["rol"] === "admin";
    $documento = $_SESSION["documento"];
    $metodo = $_SERVER["REQUEST_METHOD"];

    if (!in_array($metodo, ["GET", "POST", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    $conexionDB = new Conexion();
    $conexion = $conexionDB->conectar();

    if ($metodo === "GET") {
        // Lista de participantes de una actividad (solo administrador)
        if (isset($_GET["idActividad"])) {
            if (!$esAdmin) {
                http_response_code(403);
                throw new Exception("No tienes permisos para ver los participantes");
            }
            $idActividad = filter_var($_GET["idActividad"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idActividad === false) {
                http_response_code(400);
                throw new Exception("Actividad no válida");
            }

            $sql = "SELECT a.idAsociado, a.documento, a.nombres, a.apellidos
                    FROM actividades_asociado aa
                    INNER JOIN asociados a ON a.idAsociado = aa.idAsociado
                    WHERE aa.idActividad = :idActividad
                    ORDER BY a.nombres ASC, a.apellidos ASC";
            $consulta = $conexion->prepare($sql);
            $consulta->execute([":idActividad" => $idActividad]);

            echo json_encode([
                "success" => true,
                "participantes" => $consulta->fetchAll(PDO::FETCH_ASSOC)
            ]);
            exit;
        }

        // Resumen: inscritos por actividad y si el usuario actual está inscrito
        $sql = "SELECT ac.idActividad,
                       COUNT(aa.idAsociado) AS inscritos,
                       COALESCE(SUM(a.documento = :documento), 0) AS inscrito
                FROM actividades ac
                LEFT JOIN actividades_asociado aa ON aa.idActividad = ac.idActividad
                LEFT JOIN asociados a ON a.idAsociado = aa.idAsociado
                GROUP BY ac.idActividad";
        $consulta = $conexion->prepare($sql);
        $consulta->execute([":documento" => $documento]);

        echo json_encode([
            "success" => true,
            "resumen" => $consulta->fetchAll(PDO::FETCH_ASSOC)
        ]);
        exit;
    }

    // POST (inscribir) y DELETE (cancelar inscripción)
    $entrada = json_decode(file_get_contents("php://input"), true);
    if (!is_array($entrada)) {
        http_response_code(400);
        throw new Exception("Datos inválidos");
    }

    $idActividad = filter_var($entrada["idActividad"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    if ($idActividad === false) {
        http_response_code(400);
        throw new Exception("Actividad no válida");
    }

    $consulta = $conexion->prepare("SELECT fechaEvento < CURDATE() AS finalizada FROM actividades WHERE idActividad = :idActividad");
    $consulta->execute([":idActividad" => $idActividad]);
    $actividad = $consulta->fetch(PDO::FETCH_ASSOC);
    if (!$actividad) {
        http_response_code(404);
        throw new Exception("No se encontró la actividad");
    }

    // El administrador puede indicar el asociado; los demás solo se afectan a sí mismos
    if ($esAdmin && isset($entrada["idAsociado"])) {
        $idAsociado = filter_var($entrada["idAsociado"], FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
        if ($idAsociado === false) {
            http_response_code(400);
            throw new Exception("Asociado no válido");
        }
        $existeAsociado = $conexion->prepare("SELECT 1 FROM asociados WHERE idAsociado = :idAsociado");
        $existeAsociado->execute([":idAsociado" => $idAsociado]);
        if (!$existeAsociado->fetchColumn()) {
            http_response_code(404);
            throw new Exception("El asociado no existe");
        }
    } else {
        $consulta = $conexion->prepare("SELECT idAsociado FROM asociados WHERE documento = :documento");
        $consulta->execute([":documento" => $documento]);
        $idAsociado = $consulta->fetchColumn();
        if (!$idAsociado) {
            http_response_code(404);
            throw new Exception("No se encontró tu registro de asociado");
        }
    }

    if (!$esAdmin && (int) $actividad["finalizada"] === 1) {
        http_response_code(400);
        throw new Exception("La actividad ya finalizó");
    }

    if ($metodo === "POST") {
        $existe = $conexion->prepare("SELECT 1 FROM actividades_asociado WHERE idActividad = :idActividad AND idAsociado = :idAsociado");
        $existe->execute([":idActividad" => $idActividad, ":idAsociado" => $idAsociado]);
        if ($existe->fetchColumn()) {
            http_response_code(409);
            throw new Exception("Ya está inscrito en esta actividad");
        }

        $insertar = $conexion->prepare("INSERT INTO actividades_asociado (idActividad, idAsociado) VALUES (:idActividad, :idAsociado)");
        $insertar->execute([":idActividad" => $idActividad, ":idAsociado" => $idAsociado]);

        http_response_code(201);
        echo json_encode(["success" => true, "mensaje" => "Inscripción registrada correctamente"]);
        exit;
    }

    // DELETE
    $eliminar = $conexion->prepare("DELETE FROM actividades_asociado WHERE idActividad = :idActividad AND idAsociado = :idAsociado");
    $eliminar->execute([":idActividad" => $idActividad, ":idAsociado" => $idAsociado]);
    if ($eliminar->rowCount() === 0) {
        http_response_code(404);
        throw new Exception("La inscripción no existe");
    }

    echo json_encode(["success" => true, "mensaje" => "Inscripción cancelada correctamente"]);

} catch (PDOException $e) {
    if ($e->getCode() === "23000") {
        http_response_code(409);
        echo json_encode(["success" => false, "mensaje" => "No se pudo completar la operación (registro duplicado o relacionado)"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "mensaje" => "Error en la base de datos"]);
    }
} catch (Exception $e) {
    if (http_response_code() < 400) {
        http_response_code(500);
    }
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}