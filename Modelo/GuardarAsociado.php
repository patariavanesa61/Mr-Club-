<?php
header("Content-Type: application/json; charset=utf-8");
require __DIR__ . '../Asociados.php';

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido");
    }

    /*Leer el contenido JSON del cuerpo de la solicitud*/
    $json = file_get_contents('php://input', true);

    /*Decodificar el JSON en un arreglo asociativo*/
    $datos = json_decode($json, true);

    /*Validar que los datos requeridos esten presentes*/
    if(!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Datos inválidos");
    }


    /*Crear una instancia de la clase Asociados y guardar los datos en la base de datos*/
    $campos = ['Documento', 'Nombres', 'Apellidos', 'FechaNacimiento', 'DirecciónDeResidencia', 'Ciudad', 'Telefono', 'Email', 'Contraseña','Genero'];
    
    foreach($campos as $campo) {
        if (!isset($datos[$campo]) || trim($datos[$campo]) === '') {
            http_response_code(400);
            throw new Exception("Falta el campo requerido: " . $campo);
        }
    }

    if (!filter_var($datos['Email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        throw new Exception("Formato de email inválido");
    }

    $asociado = new Asociados($datos);  
    $resultado = $asociado->guardar();
    
    if ($resultado) {
        http_response_code(201);
        echo json_encode(["success" => true, "mensaje" => "Asociado guardado correctamnente"]);
        
    }else{
        http_response_code(500);
        echo json_encode(["success" => false, "mensaje" => "Error al guardar el asociado"]);
    }

} catch (PDOException $e) {
    if ($e->getCode() === '23000') {  /* Código de error para datos duplicados en MySQL */
        http_response_code(409);
        echo json_encode(["success" => false, "mensaje" => "El documento ya está registrado"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "mensaje" => "Error en la base de datos: " . $e->getMessage()]);
    }
} catch (Exception $e) {
    /* CORRECCIÓN: Asegurar que si no se definió un código de error previo, se asigne 400 o 500 */
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}