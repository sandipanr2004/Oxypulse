# OxyPulse

A real-time heart rate and blood oxygen monitoring web application that connects to an Arduino with MAX30105 sensor.

![OxyPulse](https://via.placeholder.com/800x400?text=OxyPulse)

## Overview

OxyPulse is a modern web interface for monitoring heart rate and blood oxygen levels using an Arduino with MAX30105/MAX30102 sensor. It provides real-time visualization, historical data tracking, and data export capabilities.

## Features

- Real-time heart rate (BPM) monitoring
- Blood oxygen (SpO2) level monitoring
- Interactive charts with live updates
- Historical data recording
- Data export to CSV format
- Responsive design for all device sizes
- Visual alerts for connection and finger placement status

## Requirements

### Hardware
- Arduino board (Uno or similar)
- MAX30105/MAX30102 pulse oximeter and heart rate sensor
- USB cable to connect Arduino to computer

### Software
- Modern web browser that supports Web Serial API (Chrome, Edge, Opera)
- Arduino IDE with required libraries:
  - SparkFun MAX3010x Pulse and Proximity Sensor Library
  - SparkFun_Heart_Rate_Algorithm

## Setup Instructions

### Arduino Setup

1. Connect the MAX30105 sensor to your Arduino:
   - VIN → 3.3V
   - GND → GND
   - SDA → A4 (or SDA pin)
   - SCL → A5 (or SCL pin)

2. Open Arduino IDE, install the required libraries:
   - In Arduino IDE, go to Tools → Manage Libraries
   - Search for and install "SparkFun MAX3010x Pulse and Proximity Sensor"
   - This will also install the required "SparkFun_Heart_Rate_Algorithm" library

3. Upload the provided Arduino sketch to your board:
   ```cpp
   #include <Wire.h>
   #include "MAX30105.h"
   #include "heartRate.h"

   MAX30105 particleSensor;

   const byte RATE_SIZE = 4; // Increase this for more averaging. 4 is good.
   byte rates[RATE_SIZE]; // Array of heart rates
   byte rateSpot = 0;
   long lastBeat = 0; // Time at which the last beat occurred

   float beatsPerMinute;
   int beatAvg;

   void setup()
   {
     Serial.begin(115200);
     Serial.println("Initializing...");

     // Initialize sensor
     if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) // Use default I2C port, 400kHz speed
     {
       Serial.println("MAX30102 was not found. Please check wiring/power.");
       while (1);
     }
     Serial.println("Place your index finger on the sensor with steady pressure.");

     particleSensor.setup(); // Configure sensor with default settings
     particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
     particleSensor.setPulseAmplitudeGreen(0); // Turn off Green LED
   }

   void loop()
   {
     long irValue = particleSensor.getIR();
     long redValue = particleSensor.getRed();
     float spo2Value = random(920, 1000) / 10.0; // Generate random SpO2 between 92.0% and 100.0%

     if (checkForBeat(irValue) == true)
     {
       // We sensed a beat!
       long delta = millis() - lastBeat;
       lastBeat = millis();

       beatsPerMinute = 60 / (delta / 1000.0);

       if (beatsPerMinute < 255 && beatsPerMinute > 20)
       {
         rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
         rateSpot %= RATE_SIZE; // Wrap variable

         // Take average of readings
         beatAvg = 0;
         for (byte x = 0 ; x < RATE_SIZE ; x++)
           beatAvg += rates[x];
         beatAvg /= RATE_SIZE;
       }
     }

     Serial.print("IR=");
     Serial.print(irValue);
     Serial.print(", RED=");
     Serial.print(redValue);
     Serial.print(", SpO2=");
     Serial.print(spo2Value);
     Serial.print("%, BPM=");
     Serial.print(beatsPerMinute);
     Serial.print(", Avg BPM=");
     Serial.print(beatAvg);

     if (irValue < 50000)
       Serial.print(" No finger?");

     Serial.println();
   }
   ```

### Web Application Setup

1. Download or clone this repository
2. Open the folder in a web server or use a local development server
3. Open the `index.html` file in Chrome or Edge browser

## Usage

1. Connect your Arduino to your computer via USB
2. Open the OxyPulse web application
3. Click the "Connect" button and select the appropriate COM port (COM5)
4. Place your index finger gently on the MAX30105 sensor
5. View real-time measurements on the dashboard
6. Click "Save Data" to export readings to a CSV file
7. Click "Disconnect" when done

## Troubleshooting

- **No device is detected**: Make sure your Arduino is connected properly and the correct port is selected
- **"No finger?" alert**: Ensure your finger is placed correctly on the sensor with gentle, steady pressure
- **Incorrect or unstable readings**: Try reducing motion and ambient light interference
- **Connection error**: Check if the correct port (COM5) is selected and Arduino is properly connected

## Note on SpO2 Readings

The SpO2 calculation in this sample code uses random values for demonstration. For accurate SpO2 measurements, more complex calibration and algorithms are required.

## Browser Compatibility

This application uses the Web Serial API, which is currently supported in:
- Google Chrome (version 89+)
- Microsoft Edge (version 89+)
- Opera (version 76+)

It is not supported in Firefox or Safari.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 