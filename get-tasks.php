<?php
// api/get-tasks.php — Get all tasks with booking reference
header('Content-Type: application/json');
session_start();
require_once '../db.php';

$conn   = connectDB();
$result = $conn->query(
    "SELECT t.*, b.ref_number
     FROM tasks t
     LEFT JOIN bookings b ON b.id = t.booking_id
     ORDER BY t.created_at DESC
     LIMIT 50"
);

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode(['success' => true, 'tasks' => $rows]);
$conn->close();
?>
