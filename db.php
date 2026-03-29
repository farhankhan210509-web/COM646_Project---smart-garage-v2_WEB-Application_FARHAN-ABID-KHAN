<?php
// ============================================================
// db.php — Database Connection
// Smart Car Service Garage
// ============================================================

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // Change to your MySQL username
define('DB_PASS', '');           // Change to your MySQL password
define('DB_NAME', 'smart_garage');

function connectDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// ============================================================
// DATABASE SETUP — Run this once to create all tables
// Open your browser: localhost/smart-garage/db.php?setup=1
// ============================================================
if (isset($_GET['setup'])) {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }

    $conn->query("CREATE DATABASE IF NOT EXISTS smart_garage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $conn->select_db('smart_garage');

    $tables = [

        // Users table (customers + garage staff)
        "CREATE TABLE IF NOT EXISTS users (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(120) NOT NULL,
            email      VARCHAR(180) NOT NULL UNIQUE,
            password   VARCHAR(255) NOT NULL,
            role       ENUM('customer','staff') DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Bookings table
        "CREATE TABLE IF NOT EXISTS bookings (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            ref_number  VARCHAR(20) NOT NULL UNIQUE,
            user_id     INT,
            name        VARCHAR(120) NOT NULL,
            phone       VARCHAR(30)  NOT NULL,
            email       VARCHAR(180) NOT NULL,
            car_make    VARCHAR(60)  NOT NULL,
            car_model   VARCHAR(80)  NOT NULL,
            service     VARCHAR(120) NOT NULL,
            appt_date   DATE         NOT NULL,
            appt_time   VARCHAR(20)  NOT NULL,
            notes       TEXT,
            status      ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",

        // Tasks table (garage job tasks)
        "CREATE TABLE IF NOT EXISTS tasks (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            booking_id  INT NOT NULL,
            title       VARCHAR(180) NOT NULL,
            description TEXT,
            status      ENUM('pending','in_progress','done') DEFAULT 'pending',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",

        // Monitor table (VMS - 30 day health data)
        "CREATE TABLE IF NOT EXISTS monitor (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            booking_id  INT NOT NULL,
            engine_pct  INT DEFAULT 90,
            battery_pct INT DEFAULT 85,
            brake_pct   INT DEFAULT 80,
            tyre_pct    INT DEFAULT 88,
            alert       VARCHAR(255),
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($tables as $sql) {
        if (!$conn->query($sql)) {
            die("Error creating table: " . $conn->error);
        }
    }

    // Insert demo staff account (password: admin123)
    $hashedPass = password_hash('admin123', PASSWORD_DEFAULT);
    $conn->query("INSERT IGNORE INTO users (name, email, password, role)
                  VALUES ('Garage Admin', 'admin@garage.com', '$hashedPass', 'staff')");

    $conn->close();
    echo "<h2 style='font-family:Arial;color:green'>✅ Database setup complete!</h2>
          <p style='font-family:Arial'>Tables created: users, bookings, tasks, monitor</p>
          <p style='font-family:Arial'>Demo staff login: <b>admin@garage.com</b> / <b>admin123</b></p>
          <p style='font-family:Arial'><a href='index.html'>Go to Home →</a></p>";
    exit;
}
?>
