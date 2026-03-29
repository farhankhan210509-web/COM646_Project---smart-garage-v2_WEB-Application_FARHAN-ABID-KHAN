<?php
// api/update-task.php — Update task or booking status
header('Content-Type: application/json');
session_start();
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$data   = json_decode(file_get_contents('php://input'), true);
$type   = $data['type']   ?? '';
$id     = intval($data['id'] ?? 0);
$status = trim($data['status'] ?? '');

$conn = connectDB();

if ($type === 'booking') {
    $allowed = ['pending','in_progress','completed','cancelled'];
    if (!in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status.']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);
} elseif ($type === 'task') {
    $allowed = ['pending','in_progress','done'];
    if (!in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status.']);
        exit;
    }
    $stmt = $conn->prepare("UPDATE tasks SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid type.']);
    $conn->close();
    exit;
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Update failed.']);
}

$conn->close();
?>
