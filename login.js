document.addEventListener('DOMContentLoaded', () => {
    // Get all the elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    const signupUser = document.getElementById('signup-user');
    const signupPass = document.getElementById('signup-pass');
    const signupBtn = document.getElementById('signup-btn');
    const signupSuccess = document.getElementById('signup-success');

    // --- Toggle Forms ---
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        // Clear messages
        loginError.textContent = '';
        signupSuccess.textContent = '';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        // Clear messages
        loginError.textContent = '';
        signupSuccess.textContent = '';
    });

    // --- Sign Up Logic ---
    signupBtn.addEventListener('click', () => {
        const user = signupUser.value.trim();
        const pass = signupPass.value.trim();

        if (user === '' || pass === '') {
            alert('Please enter a username and password.');
            return;
        }

        // Get existing users from Local Storage, or create an empty array
        const users = JSON.parse(localStorage.getItem('planner_users') || '[]');

        // Check if user already exists
        if (users.find(u => u.user === user)) {
            alert('Username already exists!');
            return;
        }

        // Add the new user
        users.push({ user: user, pass: pass });

        // Save back to Local Storage
        localStorage.setItem('planner_users', JSON.stringify(users));

        signupSuccess.textContent = 'Account created successfully! Please log in.';
        signupUser.value = '';
        signupPass.value = '';
    });

    // --- Login Logic ---
    loginBtn.addEventListener('click', () => {
        const user = loginUser.value.trim();
        const pass = loginPass.value.trim();

        if (user === '' || pass === '') {
            loginError.textContent = 'Please enter a username and password.';
            return;
        }

        // Get users from Local Storage
        const users = JSON.parse(localStorage.getItem('planner_users') || '[]');
        
        // Find the user
        const foundUser = users.find(u => u.user === user && u.pass === pass);

        if (foundUser) {
            // SUCCESS!
            // Set the 'currentUser' in storage so the app knows who is logged in
            localStorage.setItem('planner_currentUser', user);
            
            // Redirect to the main app
           window.location.href = 'planner.html';

        } else {
            // FAILED
            loginError.textContent = 'Invalid username or password.';
        }
    });
});