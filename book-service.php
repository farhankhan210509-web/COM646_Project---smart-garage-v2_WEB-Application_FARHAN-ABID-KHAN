<?php
// api/book-service.php — Create a new booking
header('Content-Type: application/json');
session_start();
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$data      = json_decode(file_get_contents('php://input'), true);
$name      = trim($data['name']      ?? '');
$phone     = trim($data['phone']     ?? '');
$email     = trim($data['email']     ?? '');
$car_make  = trim($data['car_make']  ?? '');
$car_model = trim($data['car_model'] ?? '');
$service   = trim($data['service']   ?? '');
$date      = trim($data['date']      ?? '');
$time      = trim($data['time']      ?? '');
$notes     = trim($data['notes']     ?? '');
$user_id   = $_SESSION['user_id'] ?? null;

// Validate
if (!$name || !$phone || !$email || !$service || !$date || !$time) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}
if (strtotime($date) < strtotime('today')) {
    echo json_encode(['success' => false, 'message' => 'Please choose a future date.']);
    exit;
}

// Generate reference
$ref = 'SGK-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

$conn = connectDB();
$stmt = $conn->prepare(
    "INSERT INTO bookings (ref_number, user_id, name, phone, email, car_make, car_model, service, appt_date, appt_time, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param('sisssssssss', $ref, $user_id, $name, $phone, $email, $car_make, $car_model, $service, $date, $time, $notes);

if ($stmt->execute()) {
    echo json_encode([
        'success'    => true,
        'message'    => 'Booking confirmed!',
        'ref_number' => $ref
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Booking failed. Please try again.']);
}

$conn->close();
?>
