<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../Config/conexion.php';

function resolverIdAsociado(PDO $db): ?int
{
    $sesionId    = $_SESSION['idAsociado'] ?? $_SESSION['id_asociado'] ?? $_SESSION['usuario_id'] ?? $_SESSION['id'] ?? null;
    $sesionDoc   = $_SESSION['documento'] ?? $_SESSION['usuario_documento'] ?? null;
    $sesionEmail = $_SESSION['email'] ?? $_SESSION['correo'] ?? null;

    if (!empty($sesionId)) {
        $stmt = $db->prepare("SELECT idAsociado FROM asociados WHERE idAsociado = :id LIMIT 1");
        $stmt->execute([":id" => (int)$sesionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return (int)$row['idAsociado'];
        }
    }

    if (!empty($sesionDoc)) {
        $stmt = $db->prepare("SELECT idAsociado FROM asociados WHERE documento = :doc LIMIT 1");
        $stmt->execute([":doc" => $sesionDoc]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return (int)$row['idAsociado'];
        }
    }

    if (!empty($sesionEmail)) {
        $stmt = $db->prepare("SELECT idAsociado FROM asociados WHERE email = :email LIMIT 1");
        $stmt->execute([":email" => $sesionEmail]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return (int)$row['idAsociado'];
        }
    }

    return null;
}

try {
    $metodo = $_SERVER["REQUEST_METHOD"];
    $json = file_get_contents("php://input");
    $datos = json_decode($json, true);

    $idActividad = isset($datos['idActividad']) ? (int)$datos['idActividad'] : 0;
    if ($idActividad <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "mensaje" => "ID de actividad inválido."]);
        exit;
    }

    $conexionDB = new Conexion();
    $db = $conexionDB->conectar();

    $idAsociadoReal = resolverIdAsociado($db);
    if (!$idAsociadoReal) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "mensaje" => "No se encontró un asociado válido en la sesión activa."
        ]);
        exit;
    }

    if ($metodo === "POST") {
        $check = $db->prepare(
            "SELECT idParticipacion FROM actividades_asociado WHERE idAsociado = :idAsociado AND idActividad = :idActividad LIMIT 1"
        );
        $check->execute([
            ":idAsociado"  => $idAsociadoReal,
            ":idActividad" => $idActividad
        ]);

        if ($check->fetch()) {
            echo json_encode([
                "success" => true,
                "mensaje" => "Ya estabas suscrito a esta actividad."
            ]);
            exit;
        }

        $sql = "INSERT INTO actividades_asociado (idAsociado, idActividad) VALUES (:idAsociado, :idActividad)";
        $stmt = $db->prepare($sql);
        $ok = $stmt->execute([
            ":idAsociado"  => $idAsociadoReal,
            ":idActividad" => $idActividad
        ]);

        if ($ok) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "mensaje" => "Suscripción realizada correctamente."
            ]);
        } else {
            throw new Exception("No se pudo registrar la suscripción.");
        }

    } elseif ($metodo === "DELETE") {
        $sql = "DELETE FROM actividades_asociado WHERE idAsociado = :idAsociado AND idActividad = :idActividad";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ":idAsociado"  => $idAsociadoReal,
            ":idActividad" => $idActividad
        ]);

        echo json_encode([
            "success" => true,
            "mensaje" => "Suscripción cancelada correctamente."
        ]);

    } else {
        http_response_code(405);
        echo json_encode(["success" => false, "mensaje" => "Método HTTP no permitido."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "mensaje" => "Error en la base de datos: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}