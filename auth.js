import { auth, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Initialize event listeners when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authForm = document.getElementById('auth-form');
    const authButton = document.getElementById('auth-button');
    const toggleFormButton = document.getElementById('toggle-form');
    const formSubtitle = document.getElementById('form-subtitle');
    const formSwitchText = document.getElementById('form-switch-text');
    const signupFields = document.querySelector('.signup-fields');
    const usernameInput = document.getElementById('username');
    const ageInput = document.getElementById('age');
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Error message elements
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const usernameError = document.getElementById('username-error');
    const ageError = document.getElementById('age-error');
    const genderError = document.getElementById('gender-error');
    const generalError = document.getElementById('general-error');

    // State
    let isLoginMode = true;

    // Make sure the form exists before adding event listeners
    if (!authForm) {
        console.error('Auth form not found in the document');
        return;
    }

    // Toggle between login and signup
    if (toggleFormButton) {
        toggleFormButton.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            
            if (isLoginMode) {
                formSubtitle.textContent = 'Sign in to your account';
                formSwitchText.textContent = "Don't have an account?";
                toggleFormButton.textContent = 'Sign Up';
                authButton.textContent = 'Sign In';
                signupFields.style.display = 'none';
            } else {
                formSubtitle.textContent = 'Create a new account';
                formSwitchText.textContent = 'Already have an account?';
                toggleFormButton.textContent = 'Sign In';
                authButton.textContent = 'Sign Up';
                signupFields.style.display = 'block';
            }
            
            // Clear errors
            clearErrors();
        });
    }

    // Clear error messages
    function clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Validate form inputs
    function validateForm() {
        let isValid = true;
        clearErrors();
        
        // Email validation
        if (!emailInput.value.trim()) {
            showError('email-error', 'Email is required');
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(emailInput.value)) {
            showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Password validation
        if (!passwordInput.value) {
            showError('password-error', 'Password is required');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        // Only validate signup fields if in signup mode
        if (!isLoginMode) {
            // Username validation
            if (!usernameInput.value.trim()) {
                showError('username-error', 'Username is required');
                isValid = false;
            }
            
            // Age validation
            if (!ageInput.value) {
                showError('age-error', 'Age is required');
                isValid = false;
            } else if (ageInput.value < 1 || ageInput.value > 120) {
                showError('age-error', 'Please enter a valid age (1-120)');
                isValid = false;
            }
            
            // Gender validation
            let genderSelected = false;
            genderInputs.forEach(input => {
                if (input.checked) {
                    genderSelected = true;
                }
            });
            
            if (!genderSelected) {
                showError('gender-error', 'Please select your gender');
                isValid = false;
            }
        }
        
        return isValid;
    }

    // Get selected gender
    function getSelectedGender() {
        let selectedGender = '';
        genderInputs.forEach(input => {
            if (input.checked) {
                selectedGender = input.value;
            }
        });
        return selectedGender;
    }

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log('Form submitted');
        
        handleAuthentication();
    });
    
    // Add click event to button as backup
    if (authButton) {
        authButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Auth button clicked');
            handleAuthentication();
        });
    }
    
    // Authentication handler function
    async function handleAuthentication() {
        if (!validateForm()) {
            return;
        }
        
        authButton.disabled = true;
        
        try {
            if (isLoginMode) {
                // Login
                const userCredential = await signInWithEmailAndPassword(
                    auth, 
                    emailInput.value, 
                    passwordInput.value
                );
                
                // Fetch user profile and store in localStorage
                await fetchUserProfile(userCredential.user.uid);
                
                // Redirect to home page
                window.location.href = 'index.html';
            } else {
                // Signup
                const userCredential = await createUserWithEmailAndPassword(
                    auth, 
                    emailInput.value, 
                    passwordInput.value
                );
                
                // Create user profile
                const userProfile = {
                    username: usernameInput.value,
                    email: emailInput.value,
                    age: parseInt(ageInput.value),
                    gender: getSelectedGender(),
                    createdAt: new Date().toISOString()
                };
                
                // Save user profile to database
                const profileSaved = await saveUserProfile(userCredential.user.uid, userProfile);
                
                if (profileSaved) {
                    // Redirect to home page
                    window.location.href = 'index.html';
                } else {
                    showError('general-error', 'Failed to save user profile. Please try again.');
                }
            }
        } catch (error) {
            console.error('Authentication error:', error);
            let errorMessage = 'An error occurred. Please try again.';
            
            // Firebase error handling
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already registered';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            }
            
            showError('general-error', errorMessage);
        } finally {
            authButton.disabled = false;
        }
    }
});

// Save user profile to database
async function saveUserProfile(userId, userProfile) {
    try {
        // Always save to localStorage first
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Try to save to Firebase but don't block on it
        try {
            await set(ref(database, 'users/' + userId), userProfile);
        } catch (firebaseError) {
            console.error('Error saving to Firebase (non-critical):', firebaseError);
            // Continue anyway since localStorage is updated
        }
        
        return true;
    } catch (error) {
        console.error('Error saving user profile:', error);
        
        // Check if at least localStorage was updated
        if (localStorage.getItem('userProfile')) {
            return true; // At least local storage succeeded
        }
        
        return false;
    }
}

// Fetch user profile
async function fetchUserProfile(userId) {
    try {
        // Check if user profile already exists in localStorage first
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            // If localStorage already has a profile, use it and don't fetch from Firebase
            return JSON.parse(storedProfile);
        }
        
        // Try to fetch from Firebase as fallback
        const userRef = ref(database, 'users/' + userId);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Ensure age and gender are included
            if (!userData.age) userData.age = 30;
            if (!userData.gender) userData.gender = 'male';
            
            // Store user data in localStorage for easy access
            localStorage.setItem('userProfile', JSON.stringify(userData));
            return userData;
        } else {
            console.log('No user data found, creating default profile');
            
            // Create a default user profile
            const defaultProfile = {
                username: 'User',
                email: auth.currentUser ? auth.currentUser.email : '',
                age: 30,
                gender: 'male',
                createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
            
            // Try to save to Firebase as well, but don't wait for it
            try {
                set(ref(database, 'users/' + userId), defaultProfile);
            } catch (firebaseError) {
                console.error('Error saving default profile to Firebase:', firebaseError);
            }
            
            return defaultProfile;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        
        // Create a default profile even in case of error
        const defaultProfile = {
            username: 'User',
            email: auth.currentUser ? auth.currentUser.email : '',
            age: 30,
            gender: 'male',
            createdAt: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
        
        return defaultProfile;
    }
}

// Check auth state on page load
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, redirect to home if on login page
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'index.html';
        }
    } else {
        // User is signed out, but we'll keep profile data in localStorage 
        // to maintain user preferences like age and gender
        console.log('User is signed out, but profile data is preserved for convenience');
        
        // Style any login buttons with our glowing effect
        const loginBtns = document.querySelectorAll('.login-btn');
        loginBtns.forEach(btn => {
            if (!btn.classList.contains('styled')) {
                btn.classList.add('styled');
                btn.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                btn.style.animation = 'pulse-glow 2s infinite';
            }
        });
    }
});

// Export functions for use in other scripts
export { 
    auth, 
    signOut, 
    onAuthStateChanged, 
    fetchUserProfile 
}; 