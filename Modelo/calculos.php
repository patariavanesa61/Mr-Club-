<?php
function calcularCuota($valor, $tasaMensual, $numeroCuotas) {
    $valor = (float) $valor;
    $n = (int) $numeroCuotas;
    $i = ((float) $tasaMensual) / 100;

    if ($n < 1) {
        return 0.0;
    }
    if ($i <= 0) {
        return round($valor / $n, 2);
    }
    return round($valor * $i / (1 - pow(1 + $i, -$n)), 2);
}

function calcularTotalAPagar($valor, $tasaMensual, $numeroCuotas) {
    return round(calcularCuota($valor, $tasaMensual, $numeroCuotas) * (int) $numeroCuotas, 2);
}