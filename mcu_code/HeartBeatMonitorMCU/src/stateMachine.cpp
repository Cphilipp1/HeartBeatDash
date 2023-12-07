// Include necessary libraries
#include <Wire.h> // Wire library for I2C communication
#include "MAX30105.h" // Library for the MAX30105 sensor
#include "spo2_algorithm.h" // Algorithm for calculating SpO2 (blood oxygen saturation)
#include "Particle.h" // Particle IoT device library

// Create an instance of the MAX30105 sensor class
MAX30105 particleSensor;

// Define the maximum brightness for the sensor's LEDs
#define MAX_BRIGHTNESS 255

// Arrays to store sensor data
uint32_t irBuffer[100]; // Buffer to store Infrared LED sensor data
uint32_t redBuffer[100]; // Buffer to store Red LED sensor data

// Variables for storing health metrics and their validity
int32_t bufferLength; // Length of data in buffers
int32_t spo2; // SpO2 (blood oxygen saturation) value
int8_t validSPO2; // Indicator of SpO2 calculation validity (true/false)
int32_t heartRate; // Heart rate value
int8_t validHeartRate; // Indicator of heart rate calculation validity (true/false)

// Pin configuration for LED indicators
byte pulseLED = 11; // Pin for pulse LED (should be PWM-capable)
byte readLED = 13; // Pin for read LED (blinks with each data read)

// Frontend display variables
int frontendHeartRate = 0; // Variable to hold heart rate for frontend
int frontendSP02 = 0; // Variable to hold SpO2 for frontend
String apiKey = "abcdefghijklmnop"; // API key for sending data

// Structure to store a single reading
struct Reading {
  uint32_t heartRate;
  uint32_t bloodOxygen;
  unsigned long timestamp; // Timestamp for each reading
};

unsigned long waitingStartTime = 0; // Variable to track waiting start time

// Define maximum number of offline readings to store
const int maxReadings = 1440; // E.g., 24 hours of data at one reading per minute
Reading offlineReadings[maxReadings]; // Array to store offline readings
int readingsIndex = 0; // Index for the next reading to be stored

// Enumeration for state machine
enum State {
    COLLECT_DATA,
    PROCESS_DATA,
    SEND_DATA,
    WAIT
};

// Function to upload offline data
void uploadOfflineData() {
    for (int i = 0; i < readingsIndex; i++) {
        // Format data as a JSON string
        String data = "{\"deviceId\":\"" + Particle.deviceID() + "\", \"heartRate\":" + String(offlineReadings[i].heartRate) + ", \"bloodOxygen\":" + String(offlineReadings[i].bloodOxygen) + ", \"apiKey\":\"" + apiKey + "\"}";
        // Publish data to Particle cloud
        Particle.publish("heartData", data, PRIVATE);
        delay(1000); // Delay to avoid overwhelming the server
    }
    readingsIndex = 0; // Reset the index after uploading data
}

// Set initial state
State currentState = COLLECT_DATA;

// Define waiting period (30 minutes in milliseconds)
const unsigned long waitingPeriod = 1800000;

// Setup function, runs once at startup
void setup() {
    Serial.begin(9600); // Initialize serial communication
    pinMode(pulseLED, OUTPUT); // Set pulse LED as output
    pinMode(readLED, OUTPUT); // Set read LED as output

    // Initialize MAX30105 sensor
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
        Serial.println(F("MAX30105 was not found. Please check wiring/power."));
        while (1); // Infinite loop if sensor is not found
    }

    // Countdown before starting data collection
    Serial.println(F("Attach sensor to finger with rubber band. Starting in 10 seconds..."));
    for (int i = 10; i > 0; i--) {
        Serial.print(i);
        Serial.println(" seconds remaining...");
        delay(1000); // Delay for 1 second
    }

    Serial.println("Starting conversion now...");

    // Sensor configuration
    byte ledBrightness = 60; // LED brightness level
    byte sampleAverage = 4; // Number of samples to average
    byte ledMode = 2; // LED mode (1=Red only, 2=Red+IR, 3=Red+IR+Green)
    byte sampleRate = 100; // Sample rate in Hz
    int pulseWidth = 411; // Pulse width in microseconds
    int adcRange = 4096; // ADC range

    // Apply sensor configuration
    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
}

// Main loop, runs repeatedly
void loop() {
    // Local variables for storing data
    String deviceId, apiKey, data;
    bufferLength = 100; // Set buffer length
    bool needSync = false; // Flag to synchronize offline data

    // State machine handling
    switch (currentState) {
        case COLLECT_DATA:
            // Shift data in buffers to make room for new data
            for (byte i = 25; i < 100; i++) {
                redBuffer[i - 25] = redBuffer[i];
                irBuffer[i - 25] = irBuffer[i];
            }

            // Collect new sensor data
            for (byte i = 75; i < 100; i++) {
                while (particleSensor.available() == false) // Wait for new data
                    particleSensor.check(); // Check the sensor

                digitalWrite(readLED, !digitalRead(readLED)); // Toggle read LED

                // Store new data
                redBuffer[i] = particleSensor.getRed();
                irBuffer[i] = particleSensor.getIR();
                particleSensor.nextSample(); // Advance to next sample

                // Output data to serial for debugging
                Serial.print(F("red="));
                Serial.print(redBuffer[i], DEC);
                Serial.print(F(", ir="));
                Serial.print(irBuffer[i], DEC);

                Serial.print(F(", HR="));
                Serial.print(heartRate, DEC);

                Serial.print(F(", HRvalid="));
                Serial.print(validHeartRate, DEC);

                Serial.print(F(", SPO2="));
                Serial.print(spo2, DEC);

                Serial.print(F(", SPO2Valid="));
                if (irBuffer[i] > 190000) { // Check if finger is placed on the sensor
                    Serial.println(validSPO2, DEC);
                    // Validate and store heart rate and SpO2
                    if (heartRate > 40 && heartRate < 150) {
                        frontendHeartRate = heartRate;
                    }
                    if (spo2 < 100 && spo2 > 40) {
                        frontendSP02 = spo2;
                    }
                    // Change state if valid data is available
                    if (frontendHeartRate != 0 && frontendSP02 != 0) {
                        currentState = SEND_DATA;
                    }
                } else {
                    Serial.println("\t   NO FINGER"); // Indicate that no finger is detected
                }
            }
            // Calculate heart rate and SpO2 with the new data
            maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
            break;

        case SEND_DATA:
            Serial.println("Sending Data to frontend");
            // Check for Particle cloud connection
            if (Particle.connected()) {
                // Prepare data in JSON format
                deviceId = Particle.deviceID();
                data = "{\"deviceId\":\"" + deviceId + "\", \"heartRate\":" + String(frontendHeartRate) + ", \"bloodOxygen\":" + String(frontendSP02) + ", \"apiKey\":\"" +  "abcdefghijklmnop" + "\"}";
                // Publish data
                Particle.publish("heartData", data, PRIVATE);
                Serial.println("Data sent to webhook: " + data);
                
                // Reset heart rate and SpO2 variables
                frontendHeartRate = 0;
                frontendSP02 = 0;
                // Upload offline data if necessary
                if (needSync) {
                    uploadOfflineData();
                    needSync = false;
                }
            } else {
                // Store data offline if not connected
                if (readingsIndex < maxReadings) {
                    offlineReadings[readingsIndex].heartRate = frontendHeartRate;
                    offlineReadings[readingsIndex].bloodOxygen = frontendSP02;
                    offlineReadings[readingsIndex].timestamp = millis(); // Store current time
                    readingsIndex++;
                }
                needSync = true;
            }
            waitingStartTime = Time.now(); // Set start time for waiting
            currentState = WAIT;
            break;
        case WAIT:
            delay(10000); // Wait for 10 seconds
            // Reset buffers for next data collection
            for(int i = 0; i<101; i++) {
                irBuffer[i] = 0;
                redBuffer[i] = 0;
            }
            currentState = COLLECT_DATA; // Change state back to data collection
            break;
    }
}
