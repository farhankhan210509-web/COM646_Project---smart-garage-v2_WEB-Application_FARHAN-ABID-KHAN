<?php
// api/login.php — Login user
header('Content-Type: application/json');
session_start();
require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$email    = trim($data['email']    ?? '');
$password = $data['password']      ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

$conn = connectDB();
$stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
    $conn->close();
    exit;
}

// Save session
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_role'] = $user['role'];

echo json_encode([
    'success' => true,
    'message' => 'Welcome back, ' . $user['name'] . '!',
    'role'    => $user['role'],
    'name'    => $user['name']
]);

$conn->close();
?>
