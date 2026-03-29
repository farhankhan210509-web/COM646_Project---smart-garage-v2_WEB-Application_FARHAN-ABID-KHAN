<?php
// api/get-bookings.php — Get bookings (customer own / all for staff / by ref)
header('Content-Type: application/json');
session_start();
require_once '../db.php';

$conn = connectDB();

// --- Get by reference number ---
if (isset($_GET['ref'])) {
    $ref  = trim($_GET['ref']);
    $stmt = $conn->prepare("SELECT * FROM bookings WHERE ref_number = ? LIMIT 1");
    $stmt->bind_param('s', $ref);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) {
        echo json_encode(['success' => true, 'booking' => $row]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Booking not found.']);
    }
    $conn->close();
    exit;
}

// --- Get all bookings (staff only) ---
if (isset($_GET['all'])) {
    // In production check session role
    $result = $conn->query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50");
    $rows   = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode(['success' => true, 'bookings' => $rows]);
    $conn->close();
    exit;
}

// --- Get current user's bookings ---
$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'Not logged in.']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();
$rows   = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode(['success' => true, 'bookings' => $rows]);
$conn->close();
?>
