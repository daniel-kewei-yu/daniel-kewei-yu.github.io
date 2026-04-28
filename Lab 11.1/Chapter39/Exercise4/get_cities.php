<?php
/* 
 * Author: Daniel Yu
 * Date Created: 2026-03-30
 * Description: Receives min and max population via GET,
 * queries the world.City table, returns JSON array of cities.
 */

header('Content-Type: application/json');

// Validate GET parameters
$min = filter_input(INPUT_GET, 'min', FILTER_VALIDATE_INT);
$max = filter_input(INPUT_GET, 'max', FILTER_VALIDATE_INT);

if ($min === false || $max === false || $min === null || $max === null) {
    echo json_encode(['error' => 'Invalid or missing min/max parameters']);
    exit;
}


$host = 'localhost';
$dbname = 'yud62_db';
$user = 'yud62_local';
$pass = 'BDJ&f{5F';


try {
    $dbh = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // For debugging only – remove the $e->getMessage() after it works
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Table name is "City" (capital C)
$sql = "SELECT Name, Population FROM City WHERE Population BETWEEN :min AND :max ORDER BY Population DESC";
$stmt = $dbh->prepare($sql);
$stmt->bindParam(':min', $min, PDO::PARAM_INT);
$stmt->bindParam(':max', $max, PDO::PARAM_INT);
$stmt->execute();

$cities = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $cities[] = [
        'Name' => $row['Name'],
        'Population' => (int) $row['Population']
    ];
}

echo json_encode($cities);
?>