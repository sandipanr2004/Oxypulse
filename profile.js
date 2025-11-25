import { auth, fetchUserProfile } from './auth.js';
import { database } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// DOM Elements
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const ageInput = document.getElementById('age');
const genderInputs = document.querySelectorAll('input[name="gender"]');
const genderMale = document.getElementById('gender-male');
const genderFemale = document.getElementById('gender-female');
const genderOther = document.getElementById('gender-other');
const saveStatus = document.getElementById('save-status');
const profileAvatarContainer = document.getElementById('profile-avatar-container');
const latestHeartRate = document.getElementById('latest-heart-rate');
const latestSpo2 = document.getElementById('latest-spo2');
const monitoringCount = document.getElementById('monitoring-count');

// Error message elements
const usernameError = document.getElementById('username-error');
const ageError = document.getElementById('age-error');
const genderError = document.getElementById('gender-error');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, load profile data
            loadUserProfile(user.uid);
            
            // Set email (can't be changed)
            if (emailInput) {
                emailInput.value = user.email;
            }
        } else {
            // User is not logged in, redirect to login page
            window.location.href = 'login.html';
        }
    });
    
    // Add event listeners for gender option selection
    setupGenderSelection();
    
    // Load latest health stats
    loadHealthStats();
    
    // Setup form submission
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }
});

// Setup gender selection UI
function setupGenderSelection() {
    const genderOptions = [genderMale, genderFemale, genderOther];
    
    genderOptions.forEach(option => {
        if (option) {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                genderOptions.forEach(opt => {
                    if (opt) opt.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Check the radio input
                const radioInput = option.querySelector('input[type="radio"]');
                if (radioInput) {
                    radioInput.checked = true;
                }
            });
        }
    });
}

// Load user profile data
async function loadUserProfile(userId) {
    try {
        // Try to get user data from localStorage first (for faster UI update)
        const storedProfile = localStorage.getItem('userProfile');
        let userData = null;
        
        if (storedProfile) {
            userData = JSON.parse(storedProfile);
            updateProfileUI(userData);
            // If we have localStorage data, don't try to load from Firebase
            return;
        }
        
        // Only try to fetch from Firebase if no localStorage data exists
        try {
            const userRef = ref(database, 'users/' + userId);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                userData = snapshot.val();
                
                // Add default values for age and gender if they're missing
                if (!userData.age) userData.age = 30;
                if (!userData.gender) userData.gender = 'male';
                
                // Update localStorage with fetched data
                localStorage.setItem('userProfile', JSON.stringify(userData));
                
                // Update UI with fetched data
                updateProfileUI(userData);
            } else {
                // Create default profile if no data exists anywhere
                const defaultProfile = {
                    username: 'User',
                    email: auth.currentUser ? auth.currentUser.email : '',
                    age: 30,
                    gender: 'male',
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
                updateProfileUI(defaultProfile);
            }
        } catch (firebaseError) {
            console.error('Error loading data from Firebase:', firebaseError);
            // If Firebase fails, create a default profile
            const defaultProfile = {
                username: 'User',
                email: auth.currentUser ? auth.currentUser.email : '',
                age: 30,
                gender: 'male',
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
            updateProfileUI(defaultProfile);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Update profile UI with user data
function updateProfileUI(userData) {
    // Update username
    if (usernameInput && userData.username) {
        usernameInput.value = userData.username;
        
        // Update avatar with first letter of username
        if (profileAvatarContainer) {
            profileAvatarContainer.innerHTML = userData.username.charAt(0).toUpperCase();
        }
    }
    
    // Update age
    if (ageInput && userData.age) {
        ageInput.value = userData.age;
    }
    
    // Update gender
    if (userData.gender) {
        const genderValue = userData.gender.toLowerCase();
        const genderInput = document.querySelector(`input[name="gender"][value="${genderValue}"]`);
        
        if (genderInput) {
            genderInput.checked = true;
            
            // Update UI to show selected gender
            const genderOption = genderInput.closest('.gender-option');
            if (genderOption) {
                document.querySelectorAll('.gender-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                genderOption.classList.add('selected');
            }
        }
    }
}

// Load health stats
function loadHealthStats() {
    // Get heart rate from localStorage
    const heartRate = localStorage.getItem('lastHeartRate');
    if (heartRate && latestHeartRate) {
        latestHeartRate.textContent = heartRate;
    }
    
    // Get SpO2 from localStorage
    const spo2 = localStorage.getItem('lastSpo2');
    if (spo2 && latestSpo2) {
        latestSpo2.textContent = spo2 + '%';
    }
    
    // Get monitoring count from localStorage
    const sessions = localStorage.getItem('monitoringSessions');
    if (sessions && monitoringCount) {
        monitoringCount.textContent = sessions;
    } else if (monitoringCount) {
        // If no sessions recorded yet, initialize with 0
        localStorage.setItem('monitoringSessions', '0');
        monitoringCount.textContent = '0';
    }
}

// Validate form inputs
function validateProfileForm() {
    let isValid = true;
    
    // Clear previous error messages
    usernameError.style.display = 'none';
    ageError.style.display = 'none';
    genderError.style.display = 'none';
    
    // Validate username
    if (!usernameInput.value.trim()) {
        usernameError.textContent = 'Username is required';
        usernameError.style.display = 'block';
        isValid = false;
    }
    
    // Validate age
    if (!ageInput.value) {
        ageError.textContent = 'Age is required';
        ageError.style.display = 'block';
        isValid = false;
    } else if (ageInput.value < 1 || ageInput.value > 120) {
        ageError.textContent = 'Please enter a valid age (1-120)';
        ageError.style.display = 'block';
        isValid = false;
    }
    
    // Validate gender
    let genderSelected = false;
    genderInputs.forEach(input => {
        if (input.checked) {
            genderSelected = true;
        }
    });
    
    if (!genderSelected) {
        genderError.textContent = 'Please select your gender';
        genderError.style.display = 'block';
        isValid = false;
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

// Handle profile form submission
async function handleProfileFormSubmit(e) {
    e.preventDefault();
    
    if (!validateProfileForm()) {
        return;
    }
    
    try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Get form values
        const updatedProfile = {
            username: usernameInput.value.trim(),
            email: emailInput.value,
            age: parseInt(ageInput.value),
            gender: getSelectedGender(),
            updatedAt: new Date().toISOString()
        };
        
        // Update localStorage with new data first (this is the primary storage)
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        // Show success message immediately after localStorage update
        showSaveStatus();
        
        // Try to update Firebase, but don't block on it or show errors to user
        try {
            // Only store minimal data in Firebase (not the full profile)
            const firebaseData = {
                username: updatedProfile.username,
                email: updatedProfile.email,
                updatedAt: updatedProfile.updatedAt
            };
            await update(ref(database, 'users/' + currentUser.uid), firebaseData);
        } catch (firebaseError) {
            // Log error but don't alert user since localStorage update succeeded
            console.error('Error updating profile in Firebase (non-critical):', firebaseError);
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        // Check if we at least saved to localStorage successfully
        if (localStorage.getItem('userProfile')) {
            showSaveStatus(); // Show success anyway since local data was saved
        } else {
            alert('Failed to update profile. Please try again.');
        }
    }
}

// Show save status message
function showSaveStatus() {
    saveStatus.classList.add('visible');
    
    // Hide message after 3 seconds
    setTimeout(() => {
        saveStatus.classList.remove('visible');
    }, 3000);
}

// Export getUserProfile function to be used by other scripts
export function getUserProfile() {
    try {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            return JSON.parse(storedProfile);
        } else {
            // Return a default profile if nothing is found
            const defaultProfile = {
                username: 'User',
                email: auth.currentUser ? auth.currentUser.email : '',
                age: 30,
                gender: 'male',
                updatedAt: new Date().toISOString()
            };
            // Save default profile to localStorage so it's available next time
            localStorage.setItem('userProfile', JSON.stringify(defaultProfile));
            return defaultProfile;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        // Return a minimal default profile even in case of error
        return { username: 'User', age: 30, gender: 'male' };
    }
} 