async function sendDummyData() {
  const startDate = new Date('2023-12-02T09:00:00Z');
  const totalHours = 48; // Two days
  const interval = 30; // 30 minutes

  for (let i = 0; i < totalHours * 2; i++) {
      // Calculate the timestamp for each entry
      let timestamp = new Date(startDate.getTime() + i * interval * 60000);

      // Create dummy data
      let data = {"data" : {
          deviceId: "e00fce6869b0c02b15eef17b",
          heartRate: Math.floor(Math.random() * 40) + 60, // Random heart rate between 60 and 100
          bloodOxygen: Math.floor(Math.random() * 10) + 90, // Random SpO2 between 90 and 100
          timestamp: timestamp.toISOString(),
          apiKey: "abcdefghijklmnop"
      }}

      // Send data to the server
      try {
          const response = await fetch('http://3.144.132.169:3000/heartData', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          console.log("Data sent successfully:", data);
      } catch (error) {
          console.error("Error sending data:", error);
      }
  }
}

sendDummyData();
