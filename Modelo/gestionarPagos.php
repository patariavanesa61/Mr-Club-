<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Content-Type: application/json; charset=UTF-8");

try {
    if (!isset($_SESSION["documento"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para continuar");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    if (!in_array($metodo, ["GET", "POST"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    require_once __DIR__ . "/Pagos.php";
    $pagos = new Pagos();
    $documento = $_SESSION["documento"];

    if ($metodo === "GET") {
        echo json_encode([
            "success"   => true,
            "prestamos" => $pagos->obtenerPrestamos($documento),
            "pagos"     => $pagos->obtenerPagos($documento)
        ]);
        exit;
    }

    // POST: registrar abono
    $entrada = json_decode(file_get_contents("php://input"), true);
    if (!is_array($entrada)) {
        http_response_code(400);
        throw new Exception("Datos inválidos");
    }

    $idPrestamo = filter_var($entrada["idPrestamo"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $valor = $entrada["valorAbono"] ?? null;

    if ($idPrestamo === false) {
        http_response_code(400);
        throw new Exception("Selecciona un préstamo válido");
    }
    if (!is_numeric($valor) || $valor < 1 || $valor > 9999999999) {
        http_response_code(400);
        throw new Exception("Ingresa un valor de abono válido");
    }

    $resultado = $pagos->registrarAbono($documento, $idPrestamo, round((float) $valor, 2));

    if ($resultado === "no_existe") {
        http_response_code(404);
        throw new Exception("No se encontró el préstamo");
    }
    if ($resultado === "pagado") {
        http_response_code(409);
        throw new Exception("Este préstamo ya está pagado por completo");
    }
    if ($resultado === "excede") {
        http_response_code(400);
        throw new Exception("El abono supera el saldo pendiente del préstamo");
    }

    http_response_code(201);
    echo json_encode(["success" => true, "mensaje" => "Abono registrado correctamente"]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "mensaje" => "Error en la base de datos"]);
} catch (Exception $e) {
    if (http_response_code() < 400) {
        http_response_code(500);
    }
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}