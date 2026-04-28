<?php
/*
 * Author: Daniel Yu
 * Date Created: 2026-03-23
 * Description: Server-side password strength validator.
 * Receives a GET parameter 'password', checks:
 * - length >= 6
 * - contains uppercase, lowercase, digit, and symbol
 * Returns 'strong' if all criteria are met, otherwise 'weak'.
*/

$password = filter_input(INPUT_GET, 'password', FILTER_UNSAFE_RAW);
if ($password === null) {
    echo 'weak';
    exit;
}

$errors = [];

if (strlen($password) < 6) {
    $errors[] = 'length';
}
if (!preg_match('/[A-Z]/', $password)) {
    $errors[] = 'uppercase';
}
if (!preg_match('/[a-z]/', $password)) {
    $errors[] = 'lowercase';
}
if (!preg_match('/[0-9]/', $password)) {
    $errors[] = 'digit';
}
if (!preg_match('/[^A-Za-z0-9]/', $password)) {
    $errors[] = 'symbol';
}

echo empty($errors) ? 'strong' : 'weak';
?>