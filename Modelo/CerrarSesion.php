<?php 

header("Content-Type: application/json; charset-utf-8") //Que nuestra infomación este en json//

if ($_SERVER['REQUEST_METHOD'] !== 'POST' ) {
    http_response_code(405);
    //Saltar al catch y mostrar el mensaje de error
    throw new Exception("Método HTTP no permitido");
}

session_star();
$_SESSION=[]; 

if (ini_get("session.use_cookies")) { //Si existe una cookie imprimir los parametros
    $params=session_get_cookie_params(); //Obtiene los parametros de la cookie
    setcookie(session_name(), '', time() - 4200, $params["path"], $params["domain"], $params["secure"], $params["httponly"]); //Enviar una que no funcione son parametros que tiene la cookie 

} 

session_destroy(); //Destruir todos los datoos de la sesion 

echo json_encode([
    "susses" => true, //Devolver que todo salio bien 
]);

