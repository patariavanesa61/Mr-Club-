<?php
sesion_star();

header("Content-Type: application/json; charset=UFT-8");

function leerDatos() {
    $datos = json_decode(file_get_contents("php://input"), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
         throw new Exception("Error al decodificar JSON: " . json_last_error_msg());
    }
    return $datos;
}

try {
    if (!lisset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(400);
        throw new Exception("Inicia sesión para consultar las actividades");
    }
    $metodo = $_SERVER["REQUEST_METHOD"];
    if (!in_array($metodo,["GET", "POST", "PUT", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    if ($metodo !== "GET" && $_SESSION["rol"] !== "admin" ) {
        http_response_code(403);
        throw new Exception("No tienes permisos para realizar esta acción"); 
    }

    require_once __DIR__ . "/Actividad.php";
    $Actividades = new Actividad();

    switch($metodo){
        case "GET": 
            $resultado = [
                "success" => true;
                "rol" => $_SESSION["rol"],
                "actividades" => $Actividades ->obtenerActividades()
            ];
            http_response_code(200);
            break;
        case "POST": 
            $datos = validarActividad(leerDatos());
            Actividad->guardar($datos);
            $resultado = [
                "sucess" => true;
                "message" => "Actividad creada exitosamente"
            ];
            http_response_code(201);
            break;
    }
    echo json_encode($resultado);

    
} catch (PDOException $e) {
    echo json_encode([
        "success" => false;
        "message" => $e->getMessage()
    ]);

}