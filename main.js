// ============================================================
// main.js — Smart Car Service Garage
// All features working including payment simulation
// ============================================================

// --- Helper: Show alert ---
function showAlert(containerId, type, message) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// --- Helper: API call ---
function apiCall(url, method, data, callback) {
    var options = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    fetch(url, options)
        .then(function(res) { return res.json(); })
        .then(function(json) { callback(null, json); })
        .catch(function(err) { callback(err, null); });
}

// ============================================================
// PAYMENT SYSTEM
// ============================================================
var selectedPayMethod = 'card';

function selectPayMethod(method) {
    selectedPayMethod = method;
    document.querySelectorAll('.pay-method').forEach(function(el) {
        el.classList.remove('selected');
    });
    document.getElementById('pay-' + method).classList.add('selected');

    // Show/hide card fields
    var cardFields = document.getElementById('card-fields');
    var cashInfo   = document.getElementById('cash-info');
    var digitalInfo = document.getElementById('digital-info');

    if (cardFields) cardFields.style.display = method === 'card' ? 'block' : 'none';
    if (cashInfo)   cashInfo.style.display   = method === 'cash' ? 'block' : 'none';
    if (digitalInfo) digitalInfo.style.display = method === 'digital' ? 'block' : 'none';
}

function formatCardNumber(input) {
    var v = input.value.replace(/\D/g, '').substring(0, 16);
    var out = '';
    for (var i = 0; i < v.length; i++) {
        if (i > 0 && i % 4 === 0) out += '  ';
        out += v[i];
    }
    input.value = out;
}

function formatExpiry(input) {
    var v = input.value.replace(/\D/g, '').substring(0, 4);
    input.value = v.length >= 2 ? v.substring(0, 2) + ' / ' + v.substring(2) : v;
}

function validateCard() {
    var name   = document.getElementById('card-name') ? document.getElementById('card-name').value.trim() : '';
    var number = document.getElementById('card-number') ? document.getElementById('card-number').value.replace(/\s/g, '') : '';
    var expiry = document.getElementById('card-expiry') ? document.getElementById('card-expiry').value.trim() : '';
    var cvv    = document.getElementById('card-cvv') ? document.getElementById('card-cvv').value.trim() : '';

    if (!name)           { showAlert('pay-alert', 'error', '❌ Please enter the name on card.'); return false; }
    if (number.length < 16) { showAlert('pay-alert', 'error', '❌ Please enter a valid 16-digit card number.'); return false; }
    if (expiry.length < 7)  { showAlert('pay-alert', 'error', '❌ Please enter a valid expiry date (MM / YY).'); return false; }
    if (cvv.length < 3)     { showAlert('pay-alert', 'error', '❌ Please enter your CVV (3-4 digits).'); return false; }
    return true;
}

// ============================================================
// LOGIN
// ============================================================
function handleLogin(e) {
    e.preventDefault();
    var email    = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    if (!email || !password) { showAlert('login-alert', 'error', '❌ Please enter email and password.'); return; }

    var btn = document.getElementById('login-btn');
    btn.innerHTML = '<span class="spinner"></span> Signing in...';
    btn.disabled = true;

    apiCall('api/login.php', 'POST', { email: email, password: password }, function(err, data) {
        btn.innerHTML = 'Sign In';
        btn.disabled = false;

        if (err || !data) { showAlert('login-alert', 'error', '❌ Something went wrong. Please try again.'); return; }

        if (data.success) {
            showAlert('login-alert', 'success', '✅ ' + data.message);
            setTimeout(function() {
                window.location.href = data.role === 'staff' ? 'garage-dashboard.html' : 'customer-dashboard.html';
            }, 800);
        } else {
            showAlert('login-alert', 'error', '❌ ' + data.message);
        }
    });
}

// ============================================================
// REGISTER
// ============================================================
function handleRegister(e) {
    e.preventDefault();
    var name     = document.getElementById('reg-name').value.trim();
    var email    = document.getElementById('reg-email').value.trim();
    var password = document.getElementById('reg-password').value;
    var role     = document.getElementById('reg-role') ? document.getElementById('reg-role').value : 'customer';

    if (!name || !email || !password) { showAlert('reg-alert', 'error', '❌ Please fill in all fields.'); return; }
    if (password.length < 6) { showAlert('reg-alert', 'error', '❌ Password must be at least 6 characters.'); return; }

    var btn = document.getElementById('reg-btn');
    btn.innerHTML = '<span class="spinner"></span> Creating account...';
    btn.disabled = true;

    apiCall('api/register.php', 'POST', { name: name, email: email, password: password, role: role }, function(err, data) {
        btn.innerHTML = 'Create Account';
        btn.disabled = false;

        if (err || !data) { showAlert('reg-alert', 'error', '❌ Something went wrong.'); return; }

        if (data.success) {
            showAlert('reg-alert', 'success', '✅ ' + data.message + ' Redirecting to login...');
            setTimeout(function() { window.location.href = 'login.html'; }, 1500);
        } else {
            showAlert('reg-alert', 'error', '❌ ' + data.message);
        }
    });
}

// ============================================================
// BOOK SERVICE — with payment
// ============================================================
function handleBooking(e) {
    e.preventDefault();

    var data = {
        name:      document.getElementById('bk-name').value.trim(),
        phone:     document.getElementById('bk-phone').value.trim(),
        email:     document.getElementById('bk-email').value.trim(),
        car_make:  document.getElementById('bk-make').value,
        car_model: document.getElementById('bk-model').value.trim(),
        service:   document.getElementById('bk-service').value,
        date:      document.getElementById('bk-date').value,
        time:      document.getElementById('bk-time').value,
        notes:     document.getElementById('bk-notes') ? document.getElementById('bk-notes').value.trim() : ''
    };

    if (!data.name || !data.phone || !data.email || !data.service || !data.date || !data.time) {
        showAlert('bk-alert', 'error', '❌ Please fill in all required fields.');
        return;
    }
    if (!data.car_make || !data.car_model) {
        showAlert('bk-alert', 'error', '❌ Please select your car make and enter model.');
        return;
    }

    // Show payment step
    document.getElementById('booking-step1').style.display = 'none';
    document.getElementById('booking-step2').style.display = 'block';

    // Fill summary
    var serviceEl = document.getElementById('bk-service');
    var serviceText = serviceEl.options[serviceEl.selectedIndex].text;
    document.getElementById('sum-name').textContent    = data.name;
    document.getElementById('sum-car').textContent     = data.car_make + ' ' + data.car_model;
    document.getElementById('sum-service').textContent = serviceText.split('—')[0].trim();
    document.getElementById('sum-date').textContent    = data.date + ' at ' + data.time;

    // Calculate price
    var prices = { 'General Service': 199, 'Oil Change': 89, 'Tyre Service': 129, 'Brake Service': 179, 'AC Service': 249, 'Electrical Diagnostics': 149, 'Transmission': 349, 'Full Inspection': 299 };
    var price = prices[data.service] || 0;
    var vat   = Math.round(price * 0.05);
    var total = price + vat;
    document.getElementById('sum-subtotal').textContent = 'AED ' + price;
    document.getElementById('sum-vat').textContent      = 'AED ' + vat;
    document.getElementById('sum-total').textContent    = 'AED ' + total;
}

function goBackToBooking() {
    document.getElementById('booking-step1').style.display = 'block';
    document.getElementById('booking-step2').style.display = 'none';
}

function confirmPayment(e) {
    e.preventDefault();

    // Validate payment
    if (selectedPayMethod === 'card') {
        if (!validateCard()) return;
    }

    var btn = document.getElementById('pay-btn');
    btn.innerHTML = '<span class="spinner"></span> Processing payment...';
    btn.disabled = true;

    // Get booking data
    var data = {
        name:      document.getElementById('bk-name').value.trim(),
        phone:     document.getElementById('bk-phone').value.trim(),
        email:     document.getElementById('bk-email').value.trim(),
        car_make:  document.getElementById('bk-make').value,
        car_model: document.getElementById('bk-model').value.trim(),
        service:   document.getElementById('bk-service').value,
        date:      document.getElementById('bk-date').value,
        time:      document.getElementById('bk-time').value,
        notes:     document.getElementById('bk-notes') ? document.getElementById('bk-notes').value.trim() : '',
        pay_method: selectedPayMethod
    };

    // Simulate payment processing delay (1.5s)
    setTimeout(function() {
        apiCall('api/book-service.php', 'POST', data, function(err, res) {
            btn.innerHTML = '✅ Confirm & Pay';
            btn.disabled = false;

            if (err || !res) {
                showAlert('pay-alert', 'error', '❌ Something went wrong. Please try again.');
                return;
            }
            if (res.success) {
                // Show success
                document.getElementById('booking-step2').style.display = 'none';
                document.getElementById('booking-success-section').style.display = 'block';
                document.getElementById('booking-ref').textContent = res.ref_number;
                showToast('Booking confirmed! ' + res.ref_number, 'green');
            } else {
                showAlert('pay-alert', 'error', '❌ ' + res.message);
            }
        });
    }, 1500);
}

function newBooking() {
    document.getElementById('booking-step1').style.display = 'block';
    document.getElementById('booking-step2').style.display = 'none';
    document.getElementById('booking-success-section').style.display = 'none';
    document.getElementById('bk-name').value = '';
    document.getElementById('bk-phone').value = '';
    document.getElementById('bk-email').value = '';
    document.getElementById('bk-make').value = '';
    document.getElementById('bk-model').value = '';
    document.getElementById('bk-service').value = '';
    document.getElementById('bk-date').value = '';
    document.getElementById('bk-time').value = '';
}

// ============================================================
// CUSTOMER DASHBOARD — load bookings
// ============================================================
function loadCustomerBookings() {
    var container = document.getElementById('my-bookings-table');
    if (!container) return;

    container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">Loading your bookings...</td></tr>';

    fetch('api/get-bookings.php')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success || !data.bookings || data.bookings.length === 0) {
                container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">No bookings found. <a href="#" onclick="showSection(\'book\',null)" style="color:#e63946;">Book a service →</a></td></tr>';
                return;
            }
            var html = '';
            data.bookings.forEach(function(b) {
                html += '<tr>';
                html += '<td style="font-weight:700;color:#e63946;">' + b.ref_number + '</td>';
                html += '<td>' + b.service + '</td>';
                html += '<td>' + b.car_make + ' ' + b.car_model + '</td>';
                html += '<td>' + b.appt_date + '</td>';
                html += '<td>' + b.appt_time + '</td>';
                html += '<td><span class="badge badge-' + b.status + '">' + b.status.replace('_', ' ') + '</span></td>';
                html += '</tr>';
            });
            container.innerHTML = html;
        })
        .catch(function() {
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#e63946;padding:20px;">Failed to load bookings.</td></tr>';
        });
}

// ============================================================
// GARAGE DASHBOARD — load all bookings
// ============================================================
function loadAllBookings() {
    var container = document.getElementById('all-bookings-table');
    if (!container) return;

    container.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">Loading...</td></tr>';

    fetch('api/get-bookings.php?all=1')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success || !data.bookings || data.bookings.length === 0) {
                container.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:20px;">No bookings yet.</td></tr>';
                return;
            }
            var html = '';
            data.bookings.forEach(function(b) {
                html += '<tr>';
                html += '<td style="font-weight:700;color:#e63946;">' + b.ref_number + '</td>';
                html += '<td>' + b.name + '</td>';
                html += '<td>' + b.car_make + ' ' + b.car_model + '</td>';
                html += '<td>' + b.service + '</td>';
                html += '<td>' + b.appt_date + '</td>';
                html += '<td><span class="badge badge-' + b.status + '">' + b.status.replace('_', ' ') + '</span></td>';
                html += '<td>';
                html += '<select onchange="updateBookingStatus(' + b.id + ', this.value)" style="padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-family:Nunito,sans-serif;">';
                ['pending', 'in_progress', 'completed', 'cancelled'].forEach(function(s) {
                    html += '<option value="' + s + '"' + (b.status === s ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>';
                });
                html += '</select>';
                html += '</td>';
                html += '</tr>';
            });
            container.innerHTML = html;
        })
        .catch(function() {
            container.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#e63946;padding:20px;">Failed to load.</td></tr>';
        });
}

function updateBookingStatus(id, status) {
    apiCall('api/update-task.php', 'POST', { type: 'booking', id: id, status: status }, function(err, data) {
        if (data && data.success) {
            showToast('✅ Status updated!', 'green');
        } else {
            showToast('❌ Failed to update.', 'red');
        }
    });
}

// ============================================================
// TASKS
// ============================================================
function loadTasks() {
    var container = document.getElementById('tasks-list');
    if (!container) return;

    container.innerHTML = '<p style="color:#999;font-size:13px;padding:16px;">Loading tasks...</p>';

    fetch('api/get-tasks.php')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success || !data.tasks || data.tasks.length === 0) {
                container.innerHTML = '<p style="color:#999;font-size:13px;padding:16px;">No tasks yet. Add one above.</p>';
                return;
            }
            var html = '<table><thead><tr><th>Task</th><th>Booking Ref</th><th>Status</th><th>Update</th></tr></thead><tbody>';
            data.tasks.forEach(function(t) {
                html += '<tr>';
                html += '<td style="font-weight:600;">' + t.title + '</td>';
                html += '<td style="color:#e63946;font-weight:700;">' + (t.ref_number || '—') + '</td>';
                html += '<td><span class="badge badge-' + t.status + '">' + t.status + '</span></td>';
                html += '<td><select onchange="updateTaskStatus(' + t.id + ', this.value)" style="padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;">';
                ['pending', 'in_progress', 'done'].forEach(function(s) {
                    html += '<option value="' + s + '"' + (t.status === s ? ' selected' : '') + '>' + s + '</option>';
                });
                html += '</select></td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
            container.innerHTML = html;
        })
        .catch(function() {
            container.innerHTML = '<p style="color:#e63946;font-size:13px;padding:16px;">Failed to load tasks.</p>';
        });
}

function handleAddTask(e) {
    e.preventDefault();
    var title     = document.getElementById('task-title').value.trim();
    var bookingId = document.getElementById('task-booking-id').value.trim();

    if (!title) { showAlert('task-alert', 'error', '❌ Please enter a task title.'); return; }

    apiCall('api/add-task.php', 'POST', { title: title, booking_id: bookingId }, function(err, data) {
        if (data && data.success) {
            showAlert('task-alert', 'success', '✅ Task added successfully!');
            document.getElementById('task-title').value = '';
            document.getElementById('task-booking-id').value = '';
            loadTasks();
        } else {
            showAlert('task-alert', 'error', '❌ ' + ((data && data.message) || 'Failed to add task.'));
        }
    });
}

function updateTaskStatus(id, status) {
    apiCall('api/update-task.php', 'POST', { type: 'task', id: id, status: status }, function(err, data) {
        if (data && data.success) {
            showToast('✅ Task updated!', 'green');
            loadTasks();
        }
    });
}

// ============================================================
// MONITOR (VMS)
// ============================================================
function loadMonitor() {
    var container = document.getElementById('monitor-section');
    if (!container) return;

    fetch('api/monitor.php')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (!data.success) return;
            var m = data.monitor;

            function barColor(pct) {
                if (pct >= 75) return 'bar-green';
                if (pct >= 45) return 'bar-yellow';
                return 'bar-red';
            }

            container.innerHTML =
                '<div class="health-section">' +
                '<h3>🛡️ Virtual Mechanic Shadow™</h3>' +
                '<p>30-day post-service vehicle health monitoring is active</p>' +
                makeBar('Engine Health', m.engine_pct,  barColor(m.engine_pct)) +
                makeBar('Battery',       m.battery_pct, barColor(m.battery_pct)) +
                makeBar('Brake System',  m.brake_pct,   barColor(m.brake_pct)) +
                makeBar('Tyre Pressure', m.tyre_pct,    barColor(m.tyre_pct)) +
                (m.alert ? '<div style="margin-top:12px;padding:10px 14px;background:rgba(230,57,70,0.1);border:1px solid rgba(230,57,70,0.3);border-radius:8px;color:#c1121f;font-weight:700;font-size:13px;">⚠️ Alert: ' + m.alert + '</div>' : '<div style="margin-top:12px;padding:10px 14px;background:var(--green-light);border:1px solid #86efac;border-radius:8px;color:#15803d;font-weight:700;font-size:13px;">✅ All systems healthy</div>') +
                '</div>';
        })
        .catch(function() {
            container.innerHTML = '<p style="color:#999;font-size:13px;">Health data not available.</p>';
        });
}

function makeBar(label, pct, colorClass) {
    return '<div class="health-bar">' +
        '<div class="bar-label"><span>' + label + '</span><span>' + pct + '%</span></div>' +
        '<div class="bar-track"><div class="bar-fill ' + colorClass + '" style="width:' + pct + '%"></div></div>' +
        '</div>';
}

// ============================================================
// TRACK REPAIR
// ============================================================
function trackRepair() {
    var ref = document.getElementById('track-ref').value.trim().toUpperCase();
    if (!ref) { showAlert('track-alert', 'error', '❌ Please enter your booking reference.'); return; }

    var btn = document.getElementById('track-btn');
    btn.innerHTML = '<span class="spinner"></span> Searching...';
    btn.disabled = true;

    fetch('api/get-bookings.php?ref=' + encodeURIComponent(ref))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            btn.innerHTML = '🔍 Track';
            btn.disabled = false;

            var box = document.getElementById('track-result');
            if (!data.success || !data.booking) {
                box.innerHTML = '<div class="alert alert-error">❌ Booking not found. Please check your reference number.</div>';
                return;
            }

            var b = data.booking;
            var stages    = ['pending', 'in_progress', 'completed'];
            var stepNames = ['Checked In', 'In Repair', 'Ready'];
            var currentIdx = stages.indexOf(b.status);

            var stepsHtml = '<div class="progress-steps">';
            stepNames.forEach(function(name, i) {
                var cls = i < currentIdx ? 'done' : (i === currentIdx ? 'active' : '');
                stepsHtml += '<div class="step ' + cls + '">';
                stepsHtml += '<div class="dot">' + (i < currentIdx ? '✓' : (i + 1)) + '</div>';
                stepsHtml += '<div class="step-name">' + name + '</div>';
                stepsHtml += '</div>';
            });
            stepsHtml += '</div>';

            box.innerHTML =
                '<div style="background:white;border-radius:12px;padding:22px;box-shadow:0 1px 6px rgba(0,0,0,0.07);border:1px solid #e2e8f0;margin-top:16px;">' +
                '<div style="font-family:Poppins,sans-serif;font-size:24px;font-weight:800;color:#e63946;margin-bottom:4px;">' + b.ref_number + '</div>' +
                '<div style="font-size:13px;color:#64748b;margin-bottom:4px;">' + b.car_make + ' ' + b.car_model + ' &nbsp;·&nbsp; ' + b.service + '</div>' +
                '<div style="font-size:12px;color:#94a3b8;margin-bottom:16px;">📅 ' + b.appt_date + ' at ' + b.appt_time + '</div>' +
                stepsHtml +
                '</div>';
        })
        .catch(function() {
            document.getElementById('track-btn').innerHTML = '🔍 Track';
            document.getElementById('track-btn').disabled = false;
            document.getElementById('track-result').innerHTML = '<div class="alert alert-error">❌ Could not connect. Please try again.</div>';
        });
}

// ============================================================
// DIAGNOSTICS
// ============================================================
function runScan() {
    var statusEl = document.getElementById('scan-status');
    if (!statusEl) return;
    statusEl.textContent = 'Scanning vehicle systems...';
    statusEl.style.color = '#d97706';

    setTimeout(function() {
        statusEl.textContent = 'Scan Complete ✓';
        statusEl.style.color = '#16a34a';
        showToast('✅ OBD-II scan completed!', 'green');
    }, 2500);
}

// ============================================================
// LOGOUT
// ============================================================
function doLogout() {
    fetch('api/logout.php')
        .then(function() { window.location.href = 'login.html'; })
        .catch(function() { window.location.href = 'login.html'; });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, color) {
    var existing = document.getElementById('toast-msg');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText =
        'position:fixed;bottom:24px;right:24px;' +
        'background:' + (color === 'green' ? '#16a34a' : '#e63946') + ';' +
        'color:white;padding:12px 22px;border-radius:10px;font-size:13px;font-weight:700;' +
        'font-family:Nunito,sans-serif;z-index:9999;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.2);';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

// ============================================================
// SECTION SWITCHER
// ============================================================
function showSection(sectionId, clickedEl) {
    document.querySelectorAll('.dash-section').forEach(function(s) { s.style.display = 'none'; });
    var target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.sidebar-item').forEach(function(i) { i.classList.remove('active'); });
    if (clickedEl) clickedEl.classList.add('active');
}
