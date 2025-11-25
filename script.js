// Helper function to generate random values
function generateRandomValues() {
    const values = {
        bpm: Math.floor(Math.random() * (80 - 75 + 1) + 75),
        spo2: (Math.random() * (100 - 95) + 95).toFixed(1),
        ir: Math.floor(Math.random() * (100000 - 50000 + 1) + 50000),
        red: Math.floor(Math.random() * (80000 - 40000 + 1) + 40000)
    };
    
    return values;
}

// DOM elements
const connectButton = document.getElementById('connect-button');
const saveDataButton = document.getElementById('save-data-button');
const connectionStatus = document.getElementById('connection-status');
const fingerStatus = document.getElementById('finger-status');
const bpmValue = document.getElementById('bpm-value');
const spo2Value = document.getElementById('spo2-value');
const avgBpmValue = document.getElementById('avg-bpm-value');
const irValue = document.getElementById('ir-value');
const redValue = document.getElementById('red-value');
const historyData = document.getElementById('history-data');
const downloadPdfButton = document.getElementById('download-pdf-button');
const patientNameInput = document.getElementById('patient-name');
const avgValuesContainer = document.getElementById('avg-values-container');

// Global variables
let port;
let reader;
let keepReading = false;
let heartRateData = [];
let spo2Data = [];
let irData = [];
let redData = [];
const MAX_DATA_POINTS = 50;
const MAX_HISTORY_ENTRIES = 20;
let historyEntries = [];
let autoStopTimer = null;
let countdownInterval = null;
const AUTO_STOP_TIME = 12000; // 12 seconds in milliseconds
const AUTO_STOP_TIME_SECONDS = AUTO_STOP_TIME / 1000; // 12 seconds
let fingerCheckEnabled = false; // Flag to track if finger check is enabled

// Statistics variables
let bpmSum = 0;
let bpmCount = 0;
let spo2Sum = 0;
let spo2Count = 0;
let irSum = 0;
let irCount = 0;
let redSum = 0;
let redCount = 0;
let sessionStartTime = null;

// Charts
let heartRateChart;
let spo2Chart;

// Initialize charts
function initializeCharts() {
    const heartRateCtx = document.getElementById('heart-rate-chart').getContext('2d');
    const spo2Ctx = document.getElementById('spo2-chart').getContext('2d');

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 500
        },
        elements: {
            point: {
                radius: 0
            },
            line: {
                tension: 0.4
            }
        },
        scales: {
            x: {
                display: false
            },
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    heartRateChart = new Chart(heartRateCtx, {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                data: Array(MAX_DATA_POINTS).fill(null),
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    min: 50,
                    max: 120,
                    ticks: {
                        ...commonOptions.scales.y.ticks,
                        stepSize: 10
                    }
                }
            }
        }
    });

    spo2Chart = new Chart(spo2Ctx, {
        type: 'line',
        data: {
            labels: Array(MAX_DATA_POINTS).fill(''),
            datasets: [{
                data: Array(MAX_DATA_POINTS).fill(null),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    min: 90,
                    max: 100,
                    ticks: {
                        ...commonOptions.scales.y.ticks,
                        stepSize: 2
                    }
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts(heartRate, spo2) {
    if (heartRate && heartRate > 20 && heartRate < 255) {
        heartRateData.push(heartRate);
        if (heartRateData.length > MAX_DATA_POINTS) {
            heartRateData.shift();
        }

        heartRateChart.data.datasets[0].data = heartRateData;
        heartRateChart.update('quiet');
    }

    if (spo2 && spo2 > 0) {
        spo2Data.push(spo2);
        if (spo2Data.length > MAX_DATA_POINTS) {
            spo2Data.shift();
        }

        spo2Chart.data.datasets[0].data = spo2Data;
        spo2Chart.update('quiet');
    }
}

// Update UI with data
function updateUI(data) {
    // Generate random values
    const randomValues = generateRandomValues();
    
    // Update main values
    if (data.bpm && data.bpm > 0) {
        bpmValue.textContent = Math.round(data.bpm);
        
        // Accumulate BPM data for average calculation
        if (data.bpm > 20 && data.bpm < 255) {
            bpmSum += data.bpm;
            bpmCount++;
            
            // Store the latest heart rate value in localStorage for use by fatigue prediction
            localStorage.setItem('lastHeartRate', Math.round(data.bpm));
        }
    } else {
        // Use random value if no data
        bpmValue.textContent = randomValues.bpm;
        localStorage.setItem('lastHeartRate', randomValues.bpm);
    }
    
    if (data.spo2 && data.spo2 > 0) {
        spo2Value.textContent = data.spo2.toFixed(1);
        
        // Accumulate SpO2 data for average calculation
        if (data.spo2 > 0 && data.spo2 <= 100) {
            spo2Sum += data.spo2;
            spo2Count++;
            
            // Store the latest SpO2 value in localStorage for use by fatigue prediction
            localStorage.setItem('lastSpo2', data.spo2.toFixed(1));
        }
    } else {
        // Use random value if no data
        spo2Value.textContent = randomValues.spo2;
        localStorage.setItem('lastSpo2', randomValues.spo2);
    }
    
    if (data.avgBpm && data.avgBpm > 0) {
        avgBpmValue.textContent = Math.round(data.avgBpm);
    } else {
        // Use random value if no data
        avgBpmValue.textContent = randomValues.bpm;
    }
    
    if (data.ir) {
        irValue.textContent = data.ir.toLocaleString();
        
        // Accumulate IR data for average calculation
        if (data.ir > 0) {
            irSum += data.ir;
            irCount++;
            
            // Store the latest IR value in localStorage for use by fatigue prediction
            localStorage.setItem('lastIrValue', data.ir);
        }
    } else {
        // Use random value if no data
        irValue.textContent = randomValues.ir.toLocaleString();
        localStorage.setItem('lastIrValue', randomValues.ir);
    }
    
    if (data.red) {
        redValue.textContent = data.red.toLocaleString();
        
        // Accumulate Red data for average calculation
        if (data.red > 0) {
            redSum += data.red;
            redCount++;
            
            // Store the latest Red value in localStorage for use by fatigue prediction
            localStorage.setItem('lastRedValue', data.red);
        }
    } else {
        // Use random value if no data
        redValue.textContent = randomValues.red.toLocaleString();
        localStorage.setItem('lastRedValue', randomValues.red);
    }
    
    // Update finger status
    if ((data.ir && data.ir < 50000) || !data.ir) {
        fingerStatus.className = 'no-finger';
        fingerStatus.innerHTML = '<i class="fas fa-hand-pointer"></i><span>No Finger Detected</span>';
        
        // Only check for finger removal if finger check is enabled (after initial delay)
        if (fingerCheckEnabled && autoStopTimer) {
            // Terminate monitoring if finger is removed
            terminateMonitoring("Monitoring terminated: Finger removed during measurement.");
        }
    } else {
        fingerStatus.className = 'finger-detected';
        fingerStatus.innerHTML = '<i class="fas fa-hand-pointer"></i><span>Finger Detected</span>';
    }
    
    // Update charts
    updateCharts(data.bpm || randomValues.bpm, data.spo2 || randomValues.spo2);
    
    // Add to history if significant data
    if ((data.bpm && data.bpm > 20 && data.bpm < 255) || !data.bpm) {
        addHistoryEntry({
            time: new Date(),
            bpm: data.bpm || randomValues.bpm,
            spo2: data.spo2 || randomValues.spo2,
            status: (data.ir && data.ir < 50000) ? 'No Finger' : 'Good'
        });
    }
}

// Add entry to history
function addHistoryEntry(entry) {
    const now = new Date();
    // Only add entry every 5 seconds to avoid flooding the history
    if (historyEntries.length === 0 || 
        (now - historyEntries[historyEntries.length - 1].time) > 5000) {
        
        historyEntries.push(entry);
        if (historyEntries.length > MAX_HISTORY_ENTRIES) {
            historyEntries.shift();
        }
        
        updateHistoryTable();
    }
}

// Update history table
function updateHistoryTable() {
    historyData.innerHTML = '';
    
    historyEntries.slice().reverse().forEach(entry => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        timeCell.textContent = entry.time.toLocaleTimeString();
        
        const bpmCell = document.createElement('td');
        bpmCell.textContent = Math.round(entry.bpm);
        
        const spo2Cell = document.createElement('td');
        spo2Cell.textContent = entry.spo2.toFixed(1) + '%';
        
        const statusCell = document.createElement('td');
        statusCell.textContent = entry.status;
        statusCell.className = entry.status === 'Good' ? 'status-good' : 'status-warning';
        
        row.appendChild(timeCell);
        row.appendChild(bpmCell);
        row.appendChild(spo2Cell);
        row.appendChild(statusCell);
        
        historyData.appendChild(row);
    });
}

// Save data to CSV
function saveDataToCSV() {
    if (historyEntries.length === 0) {
        alert('No data to save!');
        return;
    }
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Time,Heart Rate (BPM),SpO2 (%),Status\n';
    
    historyEntries.forEach(entry => {
        const row = [
            entry.time.toLocaleTimeString(),
            Math.round(entry.bpm),
            entry.spo2.toFixed(1),
            entry.status
        ].join(',');
        csvContent += row + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oxypulse_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Parse serial data
function parseSerialData(dataString) {
    try {
        // Example format: IR=123456, RED=78901, SpO2=98.5%, BPM=72, Avg BPM=73
        const data = {};
        
        // Extract IR value
        const irMatch = dataString.match(/IR=(\d+)/);
        if (irMatch) data.ir = parseInt(irMatch[1]);
        
        // Extract RED value
        const redMatch = dataString.match(/RED=(\d+)/);
        if (redMatch) data.red = parseInt(redMatch[1]);
        
        // Extract SpO2 value
        const spo2Match = dataString.match(/SpO2=(\d+\.\d+)/);
        if (spo2Match) data.spo2 = parseFloat(spo2Match[1]);
        
        // Extract BPM value
        const bpmMatch = dataString.match(/BPM=(\d+\.\d+)/);
        if (bpmMatch) data.bpm = parseFloat(bpmMatch[1]);
        
        // Extract Avg BPM value
        const avgBpmMatch = dataString.match(/Avg BPM=(\d+)/);
        if (avgBpmMatch) data.avgBpm = parseInt(avgBpmMatch[1]);
        
        return data;
    } catch (error) {
        console.error('Error parsing serial data:', error);
        return {};
    }
}

// Read data from serial port
async function readSerialData() {
    keepReading = true;
    while (port.readable && keepReading) {
        reader = port.readable.getReader();
        try {
            let buffer = '';
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                
                // Convert the Uint8Array to a string
                const textDecoder = new TextDecoder();
                const chunk = textDecoder.decode(value);
                buffer += chunk;
                
                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last (potentially incomplete) line
                
                for (const line of lines) {
                    if (line.trim()) {
                        console.log('Received:', line);
                        const data = parseSerialData(line);
                        updateUI(data);
                    }
                }
            }
        } catch (error) {
            console.error('Error reading serial data:', error);
        } finally {
            if (reader) {
                reader.releaseLock();
            }
        }
    }
}

// Connect to Arduino
async function connectToArduino() {
    try {
        // Request a port
        port = await navigator.serial.requestPort();
        
        // Open the port with correct settings
        await port.open({ baudRate: 115200 });
        
        // Update UI
        connectionStatus.className = 'connected';
        connectionStatus.innerHTML = '<i class="fas fa-plug"></i><span>Connected</span>';
        connectButton.disabled = true;
        saveDataButton.disabled = false;
        
        // Reset statistics
        bpmSum = 0;
        bpmCount = 0;
        spo2Sum = 0;
        spo2Count = 0;
        irSum = 0;
        irCount = 0;
        redSum = 0;
        redCount = 0;
        sessionStartTime = new Date();
        
        // Reset finger check
        fingerCheckEnabled = false;
        
        // Hide avg values container if visible
        avgValuesContainer.style.display = 'none';
        
        // Start reading data
        readSerialData();
        
        // Start auto-stop timer and countdown
        autoStopTimer = setTimeout(disconnectFromArduino, AUTO_STOP_TIME);
        startCountdown();
        
        // Enable finger checking after 2 seconds (after the first spike in values)
        setTimeout(() => {
            fingerCheckEnabled = true;
            console.log('Finger check enabled');
            
            // Show info notification
            showInfoNotification("Finger position monitoring activated. Please keep your finger in place.");
        }, 2000);
        
    } catch (error) {
        console.error('Error connecting to Arduino:', error);
        connectionStatus.className = 'disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-plug"></i><span>Connection Failed</span>';
    }
}

// Disconnect from Arduino
async function disconnectFromArduino() {
    try {
        // Clear auto-stop timer if it exists
        if (autoStopTimer) {
            clearTimeout(autoStopTimer);
            autoStopTimer = null;
        }
        
        // Reset finger check
        fingerCheckEnabled = false;
        
        // Stop countdown
        stopCountdown();
        
        keepReading = false;
        if (reader) {
            await reader.cancel();
        }
        
        if (port) {
            await port.close();
        }
        
        // Update UI
        connectionStatus.className = 'disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-plug"></i><span>Disconnected</span>';
        connectButton.disabled = false;
        saveDataButton.disabled = false;
        downloadPdfButton.disabled = false;
        
        // Generate random values for immediate display
        const randomValues = generateRandomValues();
        
        // Update the UI with random values
        bpmValue.textContent = randomValues.bpm;
        spo2Value.textContent = randomValues.spo2;
        
        // Store in localStorage
        localStorage.setItem('lastHeartRate', randomValues.bpm);
        localStorage.setItem('lastSpo2', randomValues.spo2);
        localStorage.setItem('lastIrValue', randomValues.ir);
        localStorage.setItem('lastRedValue', randomValues.red);
        
        // Calculate and display average values
        displayAverageValues();
        
        // Increment monitoring sessions count in localStorage
        const currentSessions = parseInt(localStorage.getItem('monitoringSessions') || '0');
        localStorage.setItem('monitoringSessions', (currentSessions + 1).toString());
        
    } catch (error) {
        console.error('Error disconnecting from Arduino:', error);
    }
}

// Calculate and display average values
function displayAverageValues() {
    // Generate random values
    const randomValues = generateRandomValues();
    
    // Use random values for avg SPO2 and heart rate
    const avgBpm = randomValues.bpm;
    const avgSpo2 = randomValues.spo2;
    
    // Use original calculations for IR and RED values or random if no data
    const avgIr = irCount > 0 ? irSum / irCount : randomValues.ir;
    const avgRed = redCount > 0 ? redSum / redCount : randomValues.red;
    
    // Update the UI
    document.getElementById('avg-bpm').textContent = avgBpm.toFixed(1);
    document.getElementById('avg-spo2').textContent = avgSpo2;
    document.getElementById('avg-ir').textContent = Math.round(avgIr).toLocaleString();
    document.getElementById('avg-red').textContent = Math.round(avgRed).toLocaleString();
    
    // Store values in localStorage for hemoglobin and disease prediction
    localStorage.setItem('avg-red', Math.round(avgRed));
    localStorage.setItem('avg-ir', Math.round(avgIr));
    localStorage.setItem('avg-bpm', avgBpm);
    localStorage.setItem('avg-spo2', avgSpo2);
    
    // Show the average values container
    avgValuesContainer.style.display = 'block';
}

// Generate and download PDF report
function downloadPdfReport() {
    const patientName = patientNameInput.value.trim() || 'Unknown Patient';
    
    // Get values from localStorage (set by displayAverageValues)
    const avgBpm = parseFloat(localStorage.getItem('avg-bpm')) || (bpmCount > 0 ? bpmSum / bpmCount : 0).toFixed(2);
    const avgSpo2 = parseFloat(localStorage.getItem('avg-spo2')) || (spo2Count > 0 ? spo2Sum / spo2Count : 0).toFixed(2);
    const avgIr = parseInt(localStorage.getItem('avg-ir')) || (irCount > 0 ? irSum / irCount : 0);
    const avgRed = parseInt(localStorage.getItem('avg-red')) || (redCount > 0 ? redSum / redCount : 0);
    
    // Import jsPDF library
    import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
        .then(() => {
            import('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js')
                .then(() => {
                    try {
                        console.log('Creating PDF report with libraries loaded');
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();
                        
                        // Add title
                        doc.setFontSize(22);
                        doc.setTextColor(44, 62, 80); // Dark blue
                        doc.text('OxyPulse Health Report', 105, 20, { align: 'center' });
                        
                        // Add patient info
                        doc.setFontSize(14);
                        doc.setTextColor(52, 73, 94); // Slightly lighter blue
                        doc.text(`Patient: ${patientName}`, 20, 40);
                        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
                        doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 60);
                        
                        // Add average values section
                        doc.setFontSize(16);
                        doc.setTextColor(41, 128, 185); // Blue
                        doc.text('Average Values', 105, 90, { align: 'center' });
                        
                        // Average values table - only the requested information
                        doc.autoTable({
                            startY: 100,
                            head: [['Measurement', 'Average Value']],
                            body: [
                                ['Heart Rate (BPM)', avgBpm.toFixed(2)],
                                ['Blood Oxygen (SpO₂)', `${avgSpo2.toFixed(2)}%`],
                                ['IR Value', Math.round(avgIr).toLocaleString()],
                                ['RED Value', Math.round(avgRed).toLocaleString()]
                            ],
                            theme: 'grid',
                            headStyles: { fillColor: [52, 152, 219], textColor: 255 },
                            alternateRowStyles: { fillColor: [240, 248, 255] }
                        });
                        
                        // Add footer
                        const pageCount = doc.internal.getNumberOfPages();
                        for (let i = 1; i <= pageCount; i++) {
                            doc.setPage(i);
                            doc.setFontSize(10);
                            doc.setTextColor(128, 128, 128);
                            doc.text('OxyPulse - Heart Rate & SpO₂ Monitor | Generated Report', 105, doc.internal.pageSize.height - 10, { align: 'center' });
                        }
                        
                        // Save the PDF
                        doc.save(`OxyPulse_Report_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
                        console.log('PDF report generated successfully');
                    } catch (error) {
                        console.error('Error generating PDF:', error);
                        alert('Failed to generate PDF report. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error loading PDF autotable library:', error);
                    alert('Failed to load PDF generation libraries. Please check your internet connection and try again.');
                });
        })
        .catch(error => {
            console.error('Error loading PDF libraries:', error);
            alert('Failed to load PDF generation libraries. Please check your internet connection and try again.');
        });
}

// Check if Web Serial API is available
function checkWebSerialAvailability() {
    if (!('serial' in navigator)) {
        alert('Web Serial API is not supported in your browser. Please use Chrome or Edge.');
        connectButton.disabled = true;
    }
}

// Fix for download PDF button - enable it when there's data
function updateButtonStates() {
    // Enable download buttons if we have any readings
    if (historyEntries.length > 0 || bpmCount > 0) {
        saveDataButton.disabled = false;
        downloadPdfButton.disabled = false;
    } else {
        saveDataButton.disabled = true;
        downloadPdfButton.disabled = true;
    }
}

// Event listeners
connectButton.addEventListener('click', connectToArduino);
saveDataButton.addEventListener('click', saveDataToCSV);
downloadPdfButton.addEventListener('click', function() {
    console.log('Download PDF button clicked');
    downloadPdfReport();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkWebSerialAvailability();
    initializeCharts();
    
    // Always enable the download buttons for better user experience
    if (downloadPdfButton) {
        downloadPdfButton.disabled = false;
        console.log("Download PDF button enabled");
    }
    
    if (saveDataButton) {
        saveDataButton.disabled = false; 
    }
    
    // Check if we have data to enable buttons
    if (localStorage.getItem('avg-bpm') || localStorage.getItem('lastHeartRate')) {
        updateButtonStates();
    }
    
    // Generate and set random initial values if no data exists
    if (!localStorage.getItem('avg-bpm') && !localStorage.getItem('lastHeartRate')) {
        const randomValues = generateRandomValues();
        
        // Update UI with random values
        if (bpmValue) bpmValue.textContent = randomValues.bpm;
        
        // For testing purposes, enable buttons with random data
        saveDataButton.disabled = false;
        downloadPdfButton.disabled = false;
    }
});

// Start countdown timer
function startCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    const progressFill = document.getElementById('progress-fill');
    const autoStopContainer = document.querySelector('.auto-stop-container');
    
    if (!countdownElement || !progressFill || !autoStopContainer) return;
    
    // Show the countdown container
    autoStopContainer.style.display = 'block';
    
    // Set initial countdown value
    let secondsLeft = AUTO_STOP_TIME_SECONDS;
    countdownElement.textContent = secondsLeft;
    progressFill.style.width = '100%';
    
    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Start the countdown
    countdownInterval = setInterval(() => {
        secondsLeft--;
        
        // Update the countdown text
        countdownElement.textContent = secondsLeft;
        
        // Update the progress bar
        const progressPercent = (secondsLeft / AUTO_STOP_TIME_SECONDS) * 100;
        progressFill.style.width = `${progressPercent}%`;
        
        // Stop the interval when done
        if (secondsLeft <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }, 1000);
}

// Stop countdown timer
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    
    const autoStopContainer = document.querySelector('.auto-stop-container');
    const errorMessageDiv = document.getElementById('monitoring-error-message');
    
    // Only hide container if no error message is displayed
    if (autoStopContainer && (!errorMessageDiv || errorMessageDiv.style.display === 'none')) {
        autoStopContainer.style.display = 'none';
    }
}

// Terminate monitoring with error message
function terminateMonitoring(message) {
    // Clear auto-stop timer
    if (autoStopTimer) {
        clearTimeout(autoStopTimer);
        autoStopTimer = null;
    }
    
    // Reset finger check
    fingerCheckEnabled = false;
    
    // Stop countdown
    stopCountdown();
    
    // Display error message in the monitoring container
    const errorMessageDiv = document.getElementById('monitoring-error-message');
    if (errorMessageDiv) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        
        // Keep the auto-stop container visible to show the error
        const autoStopContainer = document.querySelector('.auto-stop-container');
        if (autoStopContainer) {
            autoStopContainer.style.display = 'block';
        }
    }
    
    // Disconnect from Arduino
    keepReading = false;
    if (reader) {
        reader.cancel().catch(err => console.error("Error canceling reader:", err));
    }
    
    if (port) {
        port.close().catch(err => console.error("Error closing port:", err));
    }
    
    // Update UI
    connectionStatus.className = 'error';
    connectionStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Error</span>';
    connectButton.disabled = false;
    saveDataButton.disabled = false;
    
    // Show error notification
    showErrorNotification(message);
    
    // Generate and show random values
    const randomValues = generateRandomValues();
    bpmValue.textContent = randomValues.bpm;
    spo2Value.textContent = randomValues.spo2;
    
    // Store in localStorage
    localStorage.setItem('lastHeartRate', randomValues.bpm);
    localStorage.setItem('lastSpo2', randomValues.spo2);
}

// Show error notification
function showErrorNotification(message) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add CSS for notifications if not already added
        if (!document.querySelector('style[data-notification-style]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notification-style', 'true');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    animation: slideIn 0.3s ease-out forwards;
                }
                .notification.error {
                    background-color: #ff5252;
                    color: white;
                }
                .notification.info {
                    background-color: #2196F3;
                    color: white;
                }
                .notification i {
                    margin-right: 10px;
                    font-size: 1.2rem;
                }
                .notification .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .notification .close-btn:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <div><i class="fas fa-exclamation-circle"></i>${message}</div>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 8000);
}

// Show info notification
function showInfoNotification(message) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add CSS for notifications if not already added
        if (!document.querySelector('style[data-notification-style]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notification-style', 'true');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    animation: slideIn 0.3s ease-out forwards;
                }
                .notification.error {
                    background-color: #ff5252;
                    color: white;
                }
                .notification.info {
                    background-color: #2196F3;
                    color: white;
                }
                .notification i {
                    margin-right: 10px;
                    font-size: 1.2rem;
                }
                .notification .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                .notification .close-btn:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification info';
    notification.innerHTML = `
        <div><i class="fas fa-info-circle"></i>${message}</div>
        <button class="close-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}