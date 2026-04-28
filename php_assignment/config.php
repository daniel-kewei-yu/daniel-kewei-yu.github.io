<?php
/**
 * Author: Daniel Yu
 * Date: 2026-03-18
 * Description: Database connection configuration using PDO.
 *              Contains credentials and connection logic for the VANTAGE game.
 */

$host = 'localhost';
$dbname = 'yud62_db';
$username = 'yud62_local';
$password = 'BDJ&f{5F';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>