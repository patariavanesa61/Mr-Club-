<?php

session_start("content-Type: text/html; charset=UTF-8");

try{
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        /*Saltar a catch y mostrar el mensaje de error en foemato JSON*/
        throw new Exception("Método HTTP no permitido");
    }

    /*Leer el contenido JSON del cuerpo de la solicitud*/
    $datos = json_decode(file_get_contents("php://input"), true);

    if(!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Datos inválidos");
    }

    $email = $datos['Email'] ?? "";
    $contraseña = $datos['Contraseña'] ?? "";

    if (!is_string($email) || !is_string($contraseña) || $email === "" || $contraseña === "") {
        http_response_code(400);
        throw new Exception("Email y contraseña son invalidos");
    }

    require __DIR__ . '/../Config/conexion.php';
    $conexion = (new Conexion())->conectar();

    $consulta = $conexion->prepare("SELECT * FROM Asociados WHERE email = :email");
    $consulta->execute([':email' => $email]);
    $asociado = $consulta->fetch();

    if (!$asociado || !password_verify($contraseña, $asociado['contraseña_hash']) || empty($asociado['contraseña'])){
        http_response_code(401);
        throw new Exception("Email o contraseña incorrectos");
    }
    
    $_SESSION['Rol'] = strtolower($asociado['Rol']); /*Almacenar el rol en minúsculas para evitar problemas de comparación*/
    $_SESSION['documento'] = $asociado['Documento'];

    echo json_encode([
        "success" => true,
        "Rol" => $_SESSION['Rol'],
        "Nombre" => $asociado["Nombres"] . "" . $asociado["apellidos"],
    ]);    
}
catch(PDOException $e){
    $errorMessage = "Error: " . $e ->getMessage();
    echo json_encode([
        "success" => false,
        "message" => $errorMessage
    ])


}
catch(Exception $e){
    echo json_encode(["success" => false, "mensaje" => $e->getMenssage()])
}