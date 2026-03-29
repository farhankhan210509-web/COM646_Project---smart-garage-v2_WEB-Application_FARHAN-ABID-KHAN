<?php
// api/register.php — Register a new user
header('Content-Type: application/json');
session_start();
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$name     = trim($data['name']     ?? '');
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';
$role     = in_array($data['role'] ?? '', ['customer','staff']) ? $data['role'] : 'customer';

if (!$name || !$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
    exit;
}

$conn = connectDB();

// Check if email exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param('s', $email);
$check->execute();
$check->store_result();
if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
    $conn->close();
    exit;
}

// Insert user
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt   = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param('ssss', $name, $email, $hashed, $role);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Account created successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

$conn->close();
?>
