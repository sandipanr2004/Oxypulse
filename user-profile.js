import { auth, signOut, onAuthStateChanged } from './auth.js';

// DOM elements
const authSection = document.getElementById('auth-section');
const loginBtn = document.getElementById('login-btn');

// Add CSS styles to the document
function addProfileStyles() {
    // Create a style element if it doesn't exist
    if (!document.getElementById('profile-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'profile-styles';
        styleElement.textContent = `
            .user-profile {
                position: relative;
            }
            
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
                animation: pulse-glow 2s infinite;
            }
            
            .user-avatar:hover {
                transform: scale(1.1);
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);
            }
            
            .user-details {
                position: absolute;
                top: 50px;
                right: 0;
                background-color: var(--dark-surface);
                border-radius: 10px;
                padding: 15px;
                min-width: 200px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                display: none;
                z-index: 1000;
                transform: translateY(-10px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            
            .user-details.show {
                display: block;
                transform: translateY(0);
                opacity: 1;
            }
            
            .user-details h3 {
                font-size: 1.2rem;
                margin: 0 0 10px 0;
                color: var(--light-color);
            }
            
            .user-details p {
                font-size: 0.9rem;
                margin: 5px 0;
                color: var(--text-secondary);
            }
            
            .user-actions {
                margin-top: 15px;
                display: flex;
                flex-direction: column;
            }
            
            .auth-btn {
                background-color: rgba(76, 175, 80, 0.1);
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
                border-radius: 5px;
                padding: 8px 12px;
                font-size: 0.9rem;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                text-decoration: none;
            }
            
            .auth-btn:hover {
                background-color: var(--primary-color);
                color: white;
                transform: translateY(-2px);
                box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
            }
            
            a.login-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 8px 15px;
                background-color: var(--primary-color);
                color: white;
                border-radius: 50px;
                text-decoration: none;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s ease;
                border: none;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
                animation: pulse-glow 2s infinite;
            }
            
            a.login-btn i {
                margin-right: 5px;
            }
            
            a.login-btn:hover {
                transform: translateY(-3px);
                background-color: #43a047;
                box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);
            }
            
            @keyframes pulse-glow {
                0% {
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
                }
                50% {
                    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
                }
                100% {
                    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Function to create user profile element
function createUserProfileElement(userData) {
    // Remove login button
    if (loginBtn) {
        loginBtn.style.display = 'none';
    }
    
    // Create user profile element
    const userProfileHTML = `
        <div class="user-profile" id="user-profile">
            <div class="user-avatar" id="user-avatar">
                ${userData.username ? userData.username.charAt(0).toUpperCase() : '<i class="fas fa-user"></i>'}
            </div>
            <div class="user-details" id="user-details">
                <h3>${userData.username || 'User'}</h3>
                <p>${userData.email}</p>
                <p>Age: ${userData.age || 'N/A'}</p>
                <p>Gender: ${userData.gender || 'N/A'}</p>
                <div class="user-actions">
                    <a href="profile.html" class="auth-btn">Profile</a>
                    <a href="#" class="auth-btn" id="logout-btn" style="margin-top: 10px;">Logout</a>
                </div>
            </div>
        </div>
    `;
    
    // Add to auth section
    authSection.innerHTML = userProfileHTML;
    
    // Add click event to avatar
    const userAvatar = document.getElementById('user-avatar');
    const userDetails = document.getElementById('user-details');
    userAvatar.addEventListener('click', () => {
        userDetails.classList.toggle('show');
    });
    
    // Add logout event
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
    
    // Close details when clicking outside
    document.addEventListener('click', (e) => {
        if (userDetails.classList.contains('show') && 
            !userDetails.contains(e.target) && 
            !userAvatar.contains(e.target)) {
            userDetails.classList.remove('show');
        }
    });
}

// Function to update UI based on auth state
function updateUIOnAuthStateChange() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in, get profile data using the helper function
            const profileData = getUserProfile();
            
            // Ensure the email from auth is always included
            profileData.email = user.email;
            
            // Update localStorage with the latest email
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            
            // Create UI element with profile data
            createUserProfileElement(profileData);
        } else {
            // User is not logged in, show login button
            if (authSection) {
                authSection.innerHTML = `
                    <a href="login.html" class="login-btn" id="login-btn">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </a>
                `;
            }
        }
    });
}

// Function to get user profile data
function getUserProfile() {
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add profile styles to document
    addProfileStyles();
    
    // Update UI based on auth state
    updateUIOnAuthStateChange();
    
    // Highlight profile link in dropdown menu when on profile page
    if (window.location.pathname.includes('profile.html')) {
        const profileLink = document.querySelector('.user-details a[href="profile.html"]');
        if (profileLink) {
            profileLink.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            profileLink.style.borderColor = 'var(--primary-color)';
        }
    }
});

// Export functions for use in other scripts
export { getUserProfile }; 