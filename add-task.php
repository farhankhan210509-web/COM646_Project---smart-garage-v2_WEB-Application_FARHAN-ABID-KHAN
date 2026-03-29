<?php
// api/add-task.php — Add a garage task
header('Content-Type: application/json');
session_start();
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$data       = json_decode(file_get_contents('php://input'), true);
$title      = trim($data['title']      ?? '');
$bookingId  = intval($data['booking_id'] ?? 0);

if (!$title) {
    echo json_encode(['success' => false, 'message' => 'Task title is required.']);
    exit;
}

$conn = connectDB();
$stmt = $conn->prepare("INSERT INTO tasks (booking_id, title) VALUES (?, ?)");
$stmt->bind_param('is', $bookingId, $title);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Task added!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to add task.']);
}

$conn->close();
?>
