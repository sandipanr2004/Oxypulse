// Import the getUserProfile function from user-profile.js
import { getUserProfile } from './user-profile.js';

document.addEventListener('DOMContentLoaded', () => {
    const predictForm = document.getElementById('predict-form');
    const useMonitorValuesBtn = document.getElementById('use-monitor-values');
    const ageField = document.getElementById('age');
    const genderField = document.getElementById('gender');
    const predictionResult = document.getElementById('prediction-result');
    const predictionValue = document.getElementById('prediction-value');
    const predictionDescription = document.getElementById('prediction-description');
    
    if (ageField && genderField) {
        // Get user profile data
        const userProfile = getUserProfile();
        
        // Auto-populate fields if user profile exists
        if (userProfile) {
            // Set age if available in profile
            if (userProfile.age) {
                ageField.value = userProfile.age;
            }
            
            // Set gender if available in profile
            if (userProfile.gender) {
                // Map gender values to select options
                // Assuming options are: "0" for male, "1" for female, "2" for other
                switch (userProfile.gender.toLowerCase()) {
                    case 'male':
                        genderField.value = "0";
                        break;
                    case 'female':
                        genderField.value = "1";
                        break;
                    case 'other':
                        genderField.value = "2";
                        break;
                    default:
                        // Default to no selection
                        genderField.value = "";
                }
            }
        } else {
            // Set default values if user profile doesn't exist
            if (!ageField.value) {
                ageField.value = "35";
            }
            
            if (!genderField.value) {
                genderField.value = "0";
            }
        }
    }
    
    // Get values from localStorage or generate random values
    const heartRate = localStorage.getItem('avg-bpm') || localStorage.getItem('lastHeartRate') || Math.floor(Math.random() * (80 - 75 + 1) + 75).toString();
    const spo2 = localStorage.getItem('avg-spo2') || localStorage.getItem('lastSpo2') || (Math.random() * (100 - 95) + 95).toFixed(1);
    const irVal = localStorage.getItem('avg-ir') || localStorage.getItem('lastIrValue') || Math.floor(Math.random() * (100000 - 50000 + 1) + 50000).toString();
    const redVal = localStorage.getItem('avg-red') || localStorage.getItem('lastRedValue') || Math.floor(Math.random() * (80000 - 40000 + 1) + 40000).toString();
    
    // Set values in the display elements
    const bpmValueElement = document.getElementById('bpm-value');
    const spo2ValueElement = document.getElementById('spo2-value');
    const irValueElement = document.getElementById('ir-value');
    const redValueElement = document.getElementById('red-value');
    
    if (bpmValueElement) bpmValueElement.textContent = heartRate;
    if (spo2ValueElement) spo2ValueElement.textContent = spo2 + '%';
    if (irValueElement) irValueElement.textContent = parseInt(irVal).toLocaleString();
    if (redValueElement) redValueElement.textContent = parseInt(redVal).toLocaleString();
    
    // Set values in the form inputs
    const heartRateInput = document.getElementById('heart-rate');
    const spo2Input = document.getElementById('spo2');
    const irValueInput = document.getElementById('ir-value');
    const redValueInput = document.getElementById('red-value');
    
    if (heartRateInput) heartRateInput.value = heartRate;
    if (spo2Input) spo2Input.value = spo2;
    if (irValueInput) irValueInput.value = irVal;
    if (redValueInput) redValueInput.value = redVal;
    
    // Get the prediction parameter from URL if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const prediction = urlParams.get('prediction');
    if (prediction && predictionResult && predictionValue && predictionDescription) {
        predictionResult.style.display = 'block';
        predictionValue.textContent = prediction;
        
        // Add appropriate color class based on fatigue level
        if (prediction.includes('High')) {
            predictionValue.className = 'high';
            predictionDescription.textContent = 'Your physiological signs indicate high fatigue. It is recommended to rest and recover.';
        } else if (prediction.includes('Moderate')) {
            predictionValue.className = 'moderate';
            predictionDescription.textContent = 'Your fatigue level is moderate. Consider taking breaks and proper hydration.';
        } else if (prediction.includes('Low')) {
            predictionValue.className = 'low';
            predictionDescription.textContent = 'Your fatigue level is low. You are in good condition to continue your activities.';
        }
    }

    // Use monitor values button click handler
    if (useMonitorValuesBtn) {
        useMonitorValuesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Use average values from localStorage (updated by monitor page) instead of last values
            const heartRate = localStorage.getItem('avg-bpm') || localStorage.getItem('lastHeartRate');
            const spo2 = localStorage.getItem('avg-spo2') || localStorage.getItem('lastSpo2');
            const irVal = localStorage.getItem('avg-ir') || localStorage.getItem('lastIrValue');
            const redVal = localStorage.getItem('avg-red') || localStorage.getItem('lastRedValue');
            
            if (heartRate && spo2 && irVal && redVal && 
                heartRateInput && spo2Input && irValueInput && redValueInput) {
                heartRateInput.value = heartRate;
                spo2Input.value = spo2;
                irValueInput.value = irVal;
                redValueInput.value = redVal;
                
                // Flash the inputs to show they've been updated
                const inputs = [heartRateInput, spo2Input, irValueInput, redValueInput];
                
                inputs.forEach(input => {
                    input.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                    setTimeout(() => {
                        input.style.backgroundColor = '';
                    }, 500);
                });
            } else if (heartRateInput && spo2Input && irValueInput && redValueInput) {
                // Generate random values if nothing is available
                const randomBpm = Math.floor(Math.random() * (80 - 75 + 1) + 75);
                const randomSpo2 = (Math.random() * (100 - 95) + 95).toFixed(1);
                const randomIr = Math.floor(Math.random() * (100000 - 50000 + 1) + 50000);
                const randomRed = Math.floor(Math.random() * (80000 - 40000 + 1) + 40000);
                
                heartRateInput.value = randomBpm;
                spo2Input.value = randomSpo2;
                irValueInput.value = randomIr;
                redValueInput.value = randomRed;
                
                // Flash the inputs to show they've been updated with random values
                const inputs = [heartRateInput, spo2Input, irValueInput, redValueInput];
                
                inputs.forEach(input => {
                    input.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                    setTimeout(() => {
                        input.style.backgroundColor = '';
                    }, 500);
                });
            }
        });
    }
}); 