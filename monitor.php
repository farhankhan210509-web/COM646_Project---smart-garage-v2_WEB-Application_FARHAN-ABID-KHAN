<?php
// api/monitor.php — Get latest VMS health data
header('Content-Type: application/json');
session_start();
require_once '../db.php';

$conn = connectDB();

// Get latest monitor record
$result = $conn->query("SELECT * FROM monitor ORDER BY recorded_at DESC LIMIT 1");
$row    = $result->fetch_assoc();

if ($row) {
    echo json_encode(['success' => true, 'monitor' => $row]);
} else {
    // Return demo data if no real data yet
    echo json_encode([
        'success' => true,
        'monitor' => [
            'engine_pct'  => 92,
            'battery_pct' => 78,
            'brake_pct'   => 45,
            'tyre_pct'    => 88,
            'alert'       => 'Brake system needs attention'
        ]
    ]);
}

$conn->close();
?>
