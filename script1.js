document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check if password is strong (contains at least one uppercase, one lowercase, and one number)
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

    // Check if the password and confirm password match
    if (!passwordStrengthRegex.test(password)) {
        alert('Password is not strong. It must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please make sure both passwords are the same.');
        return;
    }

    // If all checks pass, redirect to the index page
    if (email && password) {
        alert('Sign Up Successful! Redirecting to the homepage.');
        window.location.href = 'index.html';
    } else {
        alert('Please enter both email and password.');
    }
});
