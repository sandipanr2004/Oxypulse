// Import user profile module
import { getUserProfile } from './user-profile.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Health Index page loaded');
    
    // DOM Elements
    const avgBpmDisplay = document.getElementById('avg-bpm-display');
    const avgSpo2Display = document.getElementById('avg-spo2-display');
    const avgIrDisplay = document.getElementById('avg-ir-display');
    const avgRedDisplay = document.getElementById('avg-red-display');
    const stressLevelDisplay = document.getElementById('stress-level-display');
    
    const bpmStatus = document.getElementById('bpm-status');
    const spo2Status = document.getElementById('spo2-status');
    const irStatus = document.getElementById('ir-status');
    const redStatus = document.getElementById('red-status');
    const stressStatus = document.getElementById('stress-status');
    
    const calculateButton = document.getElementById('calculate-button');
    const healthResult = document.getElementById('health-result');
    
    const healthIndexValue = document.getElementById('health-index-value');
    const healthIndexLabel = document.getElementById('health-index-label');
    const healthIndexDescription = document.getElementById('health-index-description');
    const gaugeValuePath = document.getElementById('gauge-value-path');
    
    const cardioValue = document.getElementById('cardio-value');
    const respiratoryValue = document.getElementById('respiratory-value');
    const stressValue = document.getElementById('stress-value');
    const perfusionValue = document.getElementById('perfusion-value');
    
    // Check if all elements were found
    if (!calculateButton) {
        console.error('Calculate button not found!');
    } else {
        console.log('Calculate button found and ready');
    }
    
    // Get user profile data
    const userProfile = getUserProfile();
    
    // Function to retrieve and format health metrics
    function updateHealthMetrics() {
        console.log('Updating health metrics');
        
        // Get values from localStorage
        let avgBpm = localStorage.getItem('avg-bpm');
        let avgSpo2 = localStorage.getItem('avg-spo2');
        let avgIr = localStorage.getItem('avg-ir');
        let avgRed = localStorage.getItem('avg-red');
        
        // Generate random values if none exist (for demonstration)
        if (!avgBpm || avgBpm === '0') {
            avgBpm = (Math.random() * (90 - 65) + 65).toFixed(1);
            localStorage.setItem('avg-bpm', avgBpm);
        }
        
        if (!avgSpo2 || avgSpo2 === '0') {
            avgSpo2 = (Math.random() * (100 - 94) + 94).toFixed(1);
            localStorage.setItem('avg-spo2', avgSpo2);
        }
        
        if (!avgIr || avgIr === '0') {
            avgIr = Math.floor(Math.random() * (100000 - 50000) + 50000);
            localStorage.setItem('avg-ir', avgIr);
        }
        
        if (!avgRed || avgRed === '0') {
            avgRed = Math.floor(Math.random() * (80000 - 40000) + 40000);
            localStorage.setItem('avg-red', avgRed);
        }
        
        // Calculate stress level based on heart rate variability (simulated)
        // In a real implementation, this would use actual heart rate variability data
        const stressLevel = calculateStressLevel(avgBpm, avgSpo2, avgIr, avgRed);
        localStorage.setItem('stress-level', stressLevel.toFixed(1));
        
        console.log('Health metrics values:', { avgBpm, avgSpo2, avgIr, avgRed, stressLevel });
        
        // Update displays
        if (avgBpmDisplay) avgBpmDisplay.textContent = avgBpm;
        if (avgSpo2Display) avgSpo2Display.textContent = avgSpo2 + '%';
        if (avgIrDisplay) avgIrDisplay.textContent = parseInt(avgIr).toLocaleString();
        if (avgRedDisplay) avgRedDisplay.textContent = parseInt(avgRed).toLocaleString();
        if (stressLevelDisplay) stressLevelDisplay.textContent = stressLevel.toFixed(1) + '/10';
        
        // Update status indicators
        updateStatusIndicators(parseFloat(avgBpm), parseFloat(avgSpo2), parseInt(avgIr), parseInt(avgRed), stressLevel);
    }
    
    // Function to update status indicators
    function updateStatusIndicators(bpmValue, spo2Value, irValue, redValue, stressLevel) {
        // BPM status
        if (bpmStatus) {
            if (bpmValue === 0) {
                bpmStatus.textContent = 'No Data';
                bpmStatus.className = '';
            } else if (bpmValue < 60) {
                bpmStatus.textContent = 'Low';
                bpmStatus.className = 'warning';
            } else if (bpmValue > 100) {
                bpmStatus.textContent = 'High';
                bpmStatus.className = 'warning';
            } else {
                bpmStatus.textContent = 'Normal';
                bpmStatus.className = 'healthy';
            }
        }
        
        // SpO2 status
        if (spo2Status) {
            if (spo2Value === 0) {
                spo2Status.textContent = 'No Data';
                spo2Status.className = '';
            } else if (spo2Value < 90) {
                spo2Status.textContent = 'Critical';
                spo2Status.className = 'warning';
            } else if (spo2Value < 95) {
                spo2Status.textContent = 'Low';
                spo2Status.className = 'warning';
            } else {
                spo2Status.textContent = 'Normal';
                spo2Status.className = 'healthy';
            }
        }
        
        // IR status (these are simplified - in reality would use different thresholds)
        if (irStatus) {
            if (irValue === 0) {
                irStatus.textContent = 'No Data';
                irStatus.className = '';
            } else if (irValue < 60000) {
                irStatus.textContent = 'Low';
                irStatus.className = 'warning';
            } else if (irValue > 90000) {
                irStatus.textContent = 'High';
                irStatus.className = 'warning';
            } else {
                irStatus.textContent = 'Normal';
                irStatus.className = 'healthy';
            }
        }
        
        // Red status
        if (redStatus) {
            if (redValue === 0) {
                redStatus.textContent = 'No Data';
                redStatus.className = '';
            } else if (redValue < 45000) {
                redStatus.textContent = 'Low';
                redStatus.className = 'warning';
            } else if (redValue > 75000) {
                redStatus.textContent = 'High';
                redStatus.className = 'warning';
            } else {
                redStatus.textContent = 'Normal';
                redStatus.className = 'healthy';
            }
        }
        
        // Stress status
        if (stressStatus) {
            if (stressLevel === 0) {
                stressStatus.textContent = 'No Data';
                stressStatus.className = '';
            } else if (stressLevel < 4) {
                stressStatus.textContent = 'Low';
                stressStatus.className = 'healthy';
            } else if (stressLevel < 7) {
                stressStatus.textContent = 'Moderate';
                stressStatus.className = 'moderate';
            } else {
                stressStatus.textContent = 'High';
                stressStatus.className = 'warning';
            }
        }
    }
    
    // Function to calculate stress level (simplified simulation)
    function calculateStressLevel(bpm, spo2, ir, red) {
        // Normalize values to 0-10 scale
        const bpmNorm = normalizeBPM(parseFloat(bpm));
        const spo2Norm = normalizeSpo2(parseFloat(spo2));
        const perfusionNorm = calculatePerfusion(parseInt(ir), parseInt(red));
        
        // Calculate stress level (simplified for demonstration)
        // Higher BPM, lower SpO2, and irregular perfusion increase stress
        const stressLevel = (bpmNorm * 0.6) + ((10 - spo2Norm) * 0.3) + (perfusionNorm * 0.1);
        
        // Ensure within 0-10 range
        return Math.min(10, Math.max(0, stressLevel));
    }
    
    // Function to calculate health index
    function calculateHealthIndex() {
        console.log('Calculating health index');
        
        // Get data from localStorage
        const bpm = parseFloat(localStorage.getItem('avg-bpm') || '0');
        const spo2 = parseFloat(localStorage.getItem('avg-spo2') || '0');
        const ir = parseInt(localStorage.getItem('avg-ir') || '0');
        const red = parseInt(localStorage.getItem('avg-red') || '0');
        const stressLevel = parseFloat(localStorage.getItem('stress-level') || '0');
        
        console.log('Health index inputs:', { bpm, spo2, ir, red, stressLevel });
        
        // Check if we have valid data
        if (bpm === 0 || spo2 === 0 || ir === 0 || red === 0) {
            console.log('No valid data for health index, using demo values instead');
            
            // Use demo values instead of returning no data
            const demoBpm = 75;
            const demoSpo2 = 97;
            const demoIr = 70000;
            const demoRed = 55000;
            const demoStressLevel = 3.5;
            
            // Calculate with demo values
            const cardioIndex = calculateCardioIndex(demoBpm);
            const respiratoryIndex = calculateRespiratoryIndex(demoSpo2);
            const perfusionIndex = calculatePerfusionIndex(demoIr, demoRed);
            const stressIndex = 100 - (demoStressLevel * 10);
            
            const healthIndex = (
                (cardioIndex * 0.3) +
                (respiratoryIndex * 0.3) +
                (stressIndex * 0.2) +
                (perfusionIndex * 0.2)
            ).toFixed(2);
            
            // Save to localStorage
            localStorage.setItem('avg-bpm', demoBpm.toString());
            localStorage.setItem('avg-spo2', demoSpo2.toString());
            localStorage.setItem('avg-ir', demoIr.toString());
            localStorage.setItem('avg-red', demoRed.toString());
            localStorage.setItem('stress-level', demoStressLevel.toString());
            
            return {
                healthIndex,
                cardioIndex: cardioIndex.toFixed(2),
                respiratoryIndex: respiratoryIndex.toFixed(2),
                stressIndex: stressIndex.toFixed(2),
                perfusionIndex: perfusionIndex.toFixed(2),
                label: 'Demo Data',
                className: 'healthy',
                description: 'This is a demonstration using sample health data. Connect to a real monitor for personalized results.'
            };
        }
        
        // Calculate component indices (0-100 scale)
        const cardioIndex = calculateCardioIndex(bpm);
        const respiratoryIndex = calculateRespiratoryIndex(spo2);
        const perfusionIndex = calculatePerfusionIndex(ir, red);
        const stressIndex = 100 - (stressLevel * 10); // Convert 0-10 to 100-0 (higher is better)
        
        // Calculate overall health index (weighted average)
        const healthIndex = (
            (cardioIndex * 0.3) +
            (respiratoryIndex * 0.3) +
            (stressIndex * 0.2) +
            (perfusionIndex * 0.2)
        ).toFixed(2);
        
        console.log('Health index components:', { 
            healthIndex, cardioIndex, respiratoryIndex, stressIndex, perfusionIndex 
        });
        
        // Determine health category and description
        let label, description, className;
        
        if (parseFloat(healthIndex) >= 80) {
            label = 'Excellent';
            className = 'healthy';
            description = 'Your vital signs suggest excellent health. Continue your healthy habits.';
        } else if (parseFloat(healthIndex) >= 60) {
            label = 'Good';
            className = 'healthy';
            description = 'Your overall health metrics look good. Consider small improvements to optimize further.';
        } else if (parseFloat(healthIndex) >= 40) {
            label = 'Moderate';
            className = 'moderate';
            description = 'Your health metrics show some areas for improvement. Focus on managing stress and optimizing your vital signs.';
        } else {
            label = 'Needs Attention';
            className = 'warning';
            description = 'Your health metrics indicate areas that need attention. Consider consulting with a healthcare professional.';
        }
        
        // Save health index to localStorage for reports
        localStorage.setItem('health-index', healthIndex.toString());
        localStorage.setItem('health-label', label);
        localStorage.setItem('health-description', description);
        localStorage.setItem('cardio-index', cardioIndex.toFixed(2));
        localStorage.setItem('respiratory-index', respiratoryIndex.toFixed(2));
        localStorage.setItem('stress-index', stressIndex.toFixed(2));
        localStorage.setItem('perfusion-index', perfusionIndex.toFixed(2));
        
        return {
            healthIndex,
            cardioIndex: cardioIndex.toFixed(2),
            respiratoryIndex: respiratoryIndex.toFixed(2),
            stressIndex: stressIndex.toFixed(2),
            perfusionIndex: perfusionIndex.toFixed(2),
            label,
            className,
            description
        };
    }
    
    // Helper functions for calculations
    function normalizeBPM(bpm) {
        // Convert BPM to 0-10 scale (higher = more stress)
        if (bpm < 60) return 3; // Low heart rate
        if (bpm > 100) return 7 + ((bpm - 100) / 20); // High heart rate
        
        // Normal range - map 60-100 to 2-7
        return 2 + ((bpm - 60) / 8);
    }
    
    function normalizeSpo2(spo2) {
        // Convert SpO2 to 0-10 scale (higher = healthier)
        if (spo2 < 90) return (spo2 - 80) / 2; // Critical range
        if (spo2 < 95) return 5 + ((spo2 - 90) / 1); // Below normal
        
        // Normal range - map 95-100 to 7-10
        return 7 + ((spo2 - 95) / 1.6);
    }
    
    function calculatePerfusion(ir, red) {
        // Calculate simplified perfusion index (0-10 scale)
        if (ir === 0 || red === 0) return 0;
        
        // Calculate ratio (simplified)
        const ratio = red / ir;
        
        // Normalize ratio to 0-10 scale (simplified)
        if (ratio < 0.4) return 3; // Poor perfusion
        if (ratio > 0.8) return 8; // Good perfusion
        
        // Map 0.4-0.8 to 3-8
        return 3 + ((ratio - 0.4) / 0.08);
    }
    
    function calculateCardioIndex(bpm) {
        // Convert BPM to 0-100 scale (higher is better)
        // Optimal range is around 60-80 bpm for resting adults
        if (bpm < 50) return 50 + ((bpm - 40) * 2); // Too low
        if (bpm > 100) return 80 - ((bpm - 100) * 2); // Too high
        if (bpm >= 50 && bpm <= 80) {
            // Optimal range - highest score
            return 85 + ((80 - Math.abs(bpm - 65)) / 15) * 15;
        }
        // Between 80-100: still good but declining
        return 100 - ((bpm - 80) * 1);
    }
    
    function calculateRespiratoryIndex(spo2) {
        // Convert SpO2 to 0-100 scale (higher is better)
        if (spo2 < 90) return (spo2 - 80) * 5; // Critical
        if (spo2 < 95) return 50 + ((spo2 - 90) * 10); // Below normal
        
        // 95-100 is optimal range
        return 80 + ((spo2 - 95) * 4);
    }
    
    function calculatePerfusionIndex(ir, red) {
        // Calculate perfusion index on 0-100 scale
        if (ir === 0 || red === 0) return 0;
        
        // Use ratio of red to ir (simplified)
        const ratio = red / ir;
        
        // Convert to 0-100 scale
        if (ratio < 0.4) return ratio * 100; // Poor perfusion
        if (ratio > 0.8) return 80 + ((ratio - 0.8) * 50); // Excellent perfusion
        
        // Normal range
        return 40 + ((ratio - 0.4) * 100);
    }
    
    // Function to update the gauge visualization
    function updateGauge(healthIndex) {
        console.log('Updating gauge with health index:', healthIndex);
        
        if (!gaugeValuePath || !healthIndexValue || !healthIndexLabel) {
            console.error('Gauge elements not found');
            return;
        }
        
        const circumference = 157; // Approx path length of the semicircle
        const dashLength = (healthIndex / 100) * circumference;
        
        // Animate the gauge
        try {
            gaugeValuePath.style.strokeDasharray = `${dashLength} ${circumference}`;
            
            // Update gauge color based on health index
            if (healthIndex >= 80) {
                gaugeValuePath.setAttribute('class', 'gauge-value healthy');
                healthIndexValue.setAttribute('class', 'gauge-text healthy');
                healthIndexLabel.setAttribute('class', 'healthy');
            } else if (healthIndex >= 60) {
                gaugeValuePath.setAttribute('class', 'gauge-value healthy');
                healthIndexValue.setAttribute('class', 'gauge-text healthy');
                healthIndexLabel.setAttribute('class', 'healthy');
            } else if (healthIndex >= 40) {
                gaugeValuePath.setAttribute('class', 'gauge-value moderate');
                healthIndexValue.setAttribute('class', 'gauge-text moderate');
                healthIndexLabel.setAttribute('class', 'moderate');
            } else {
                gaugeValuePath.setAttribute('class', 'gauge-value warning');
                healthIndexValue.setAttribute('class', 'gauge-text warning');
                healthIndexLabel.setAttribute('class', 'warning');
            }
            console.log('Gauge updated successfully');
        } catch (error) {
            console.error('Error updating gauge:', error);
        }
    }
    
    // Initial update
    updateHealthMetrics();
    
    // Update every 3 seconds
    setInterval(updateHealthMetrics, 3000);
    
    // Calculate health index button click handler
    if (calculateButton) {
        console.log('Adding event listener to calculate button');
        
        // Add this line to make sure button has proper styles and is visible
        console.log('Button properties:', {
            display: calculateButton.style.display,
            visibility: calculateButton.style.visibility,
            width: calculateButton.offsetWidth,
            height: calculateButton.offsetHeight,
            text: calculateButton.textContent
        });
        
        // First try with standard click event
        calculateButton.addEventListener('click', function(event) {
            console.log('Calculate button clicked');
            // Prevent default behavior if it's a form button
            event.preventDefault();
            
            try {
                // Calculate health index
                const result = calculateHealthIndex();
                
                // Update UI with results
                if (healthIndexValue) healthIndexValue.textContent = result.healthIndex;
                if (healthIndexLabel) healthIndexLabel.textContent = result.label;
                if (healthIndexDescription) healthIndexDescription.textContent = result.description;
                
                // Update gauge
                updateGauge(result.healthIndex);
                
                // Update individual metrics
                if (cardioValue) cardioValue.textContent = result.cardioIndex;
                if (respiratoryValue) respiratoryValue.textContent = result.respiratoryIndex;
                if (stressValue) stressValue.textContent = result.stressIndex;
                if (perfusionValue) perfusionValue.textContent = result.perfusionIndex;
                
                // Update colors for metric values
                updateMetricColors(cardioValue, result.cardioIndex);
                updateMetricColors(respiratoryValue, result.respiratoryIndex);
                updateMetricColors(stressValue, result.stressIndex);
                updateMetricColors(perfusionValue, result.perfusionIndex);
                
                // Show result
                if (healthResult) {
                    healthResult.style.display = 'block';
                    
                    // Smooth scroll to result
                    healthResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    console.error('Health result container not found');
                }
                
                console.log('Health index calculation complete');
            } catch (error) {
                console.error('Error calculating health index:', error);
                alert('There was an error calculating your health index. Please try again.');
            }
        });
        
        // Also add mousedown event just in case click isn't firing
        calculateButton.addEventListener('mousedown', function(event) {
            console.log('Calculate button pressed (mousedown)');
        });
    }
    
    // Helper to update colors for metric values
    function updateMetricColors(element, value) {
        if (!element) return;
        
        if (value >= 80) {
            element.className = 'metric-value healthy';
        } else if (value >= 60) {
            element.className = 'metric-value healthy';
        } else if (value >= 40) {
            element.className = 'metric-value moderate';
        } else {
            element.className = 'metric-value warning';
        }
    }
}); 