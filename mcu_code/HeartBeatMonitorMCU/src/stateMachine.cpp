#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include "Particle.h"

MAX30105 particleSensor;

#define MAX_BRIGHTNESS 255

uint32_t irBuffer[100]; // Infrared LED sensor data
uint32_t redBuffer[100];  // Red LED sensor data

int32_t bufferLength; // Data length
int32_t spo2; // SpO2 value
int8_t validSPO2; // Indicator to show if the SpO2 calculation is valid
int32_t heartRate; // Heart rate value
int8_t validHeartRate; // Indicator to show if the heart rate calculation is valid

byte pulseLED = 11; // Must be on PWM pin
byte readLED = 13; // Blinks with each data read

int frontendHeartRate = 0;
int frontendSP02 = 0;
String apiKey = "abcdefghijklmnop";
struct Reading {
  uint32_t heartRate;
  uint32_t bloodOxygen;
  unsigned long timestamp; // Optional, based on how you handle time
};

// Define a maximum number of readings to store (e.g., 24 hours of data at one reading per minute)
const int maxReadings = 1440; 
Reading offlineReadings[maxReadings];
int readingsIndex = 0;

enum State {
COLLECT_DATA,
PROCESS_DATA,
SEND_DATA,
WAIT
};


void uploadOfflineData() {
    for (int i = 0; i < readingsIndex; i++) {
        String data = "{\"deviceId\":\"" + Particle.deviceID() + "\", \"heartRate\":" + String(offlineReadings[i].heartRate) + ", \"bloodOxygen\":" + String(offlineReadings[i].bloodOxygen) + ", \"apiKey\":\"" + apiKey + "\"}";
        Particle.publish("heartData", data, PRIVATE);
        delay(1000); // Delay to prevent overwhelming the server
    }
    readingsIndex = 0; // Reset the index after uploading
}
State currentState = COLLECT_DATA;
unsigned long waitingStartTime;
const unsigned long waitingPeriod = 1800000; // 30 minutes in milliseconds

void setup() {
    Serial.begin(9600);
    pinMode(pulseLED, OUTPUT);
    pinMode(readLED, OUTPUT);

    // Initialize sensor
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println(F("MAX30105 was not found. Please check wiring/power."));
    while (1);
    }

    Serial.println(F("Attach sensor to finger with rubber band. Starting in 10 seconds..."));
    for (int i = 10; i > 0; i--) {
        Serial.print(i);
        Serial.println(" seconds remaining...");
        delay(1000); // Delay for 1 second
    }

    Serial.println("Starting conversion now...");
    Serial.println("After interrupt:");

    byte ledBrightness = 60; // Options: 0=Off to 255=50mA
    byte sampleAverage = 4; // Options: 1, 2, 4, 8, 16, 32
    byte ledMode = 2; // Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
    byte sampleRate = 100; // Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
    int pulseWidth = 411; // Options: 69, 118, 215, 411
    int adcRange = 4096; // Options: 2048, 4096, 8192, 16384

    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
}

void loop() {
    String deviceId, apiKey, data;
    bufferLength = 100;

    switch (currentState) {
    case COLLECT_DATA:
        for (byte i = 25; i < 100; i++) {
            redBuffer[i - 25] = redBuffer[i];
            irBuffer[i - 25] = irBuffer[i];
        }
        // Take 25 sets of samples before calculating the heart rate.
        for (byte i = 75; i < 100; i++) {
            while (particleSensor.available() == false) // Do we have new data?
                particleSensor.check(); // Check the sensor for new data

            digitalWrite(readLED, !digitalRead(readLED)); // Blink onboard LED with every data read

            redBuffer[i] = particleSensor.getRed();
            irBuffer[i] = particleSensor.getIR();
            particleSensor.nextSample(); // We're finished with this sample so move to next sample

            // Send samples and calculation result to terminal program through UART
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
            Serial.println(validSPO2, DEC);
        }

        if (heartRate > 40 && heartRate < 150) { 
            frontendHeartRate = heartRate;
        }
        if (spo2 < 100 && spo2 > 40) { 
            frontendSP02 = spo2;
        }
        if (frontendHeartRate != 0 && frontendSP02 != 0) {
            currentState = SEND_DATA;
        }
        // After gathering 25 new samples recalculate HR and SP02
        maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
        break;

    case SEND_DATA:
        Serial.println("Sending Data to frontend");
        bool needSync = false;
        if (Particle.connected()) {
            deviceId = Particle.deviceID();
            data = "{\"deviceId\":\"" + deviceId + "\", \"heartRate\":" + String(frontendHeartRate) + ", \"bloodOxygen\":" + String(frontendSP02) + ", \"apiKey\":\"" + apiKey + "\"}";
            Particle.publish("heartData", data, PRIVATE);
            Serial.println("Data sent to webhook: " + data);
            currentState = WAIT;
            frontendHeartRate = 0;
            frontendSP02 = 0;
            if (needSync) {
                uploadOfflineData();
                needSync = false;
            }
        } else {
            if (readingsIndex < maxReadings) {
                offlineReadings[readingsIndex].heartRate = frontendHeartRate;
                offlineReadings[readingsIndex].bloodOxygen = frontendSP02;
                offlineReadings[readingsIndex].timestamp = millis(); // Or your time handling strategy
                readingsIndex++;
            }
            needSync = true;
        }
        waitingStartTime = Time.now(); // Set waiting start time
        break;

    case WAIT:
        if (millis() - waitingStartTime >= waitingPeriod) {
            currentState = COLLECT_DATA;
        }
        break;
    }
}
