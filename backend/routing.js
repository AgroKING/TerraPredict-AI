import "dotenv/config";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// fetch necessary input from API's and send the predicted value to front-end
app.post("/api/site-telemetry", async (req, res) => {
  // pass to the url
  const latitude = 77.6143;
  const longitude = 10.6143;
  const start = 20270101;
  const end = 20300101;
  const ML_PATH = `http://localhost:3000/predict`;
  const parameters = "PRECTOTCORR,GWETROOT,T2M,T2M_MAX,T2M_MIN,RH2M,TS";
  const NASA_POWER_API = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=AG&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=JSON`;

  try {
    const response = await fetch(NASA_POWER_API);
    const rawData = await response.json();

    // get the specific data, i.e. moisture, temperature
    const data = rawData.properties.parameter;

    // load the necessary data from POWER API
    const mlPayload = {
      precipitation: data.PRECTOTCORR,
      soil_moisture: data.GWETROOT,
      avg_temp: data.T2M,
      max_temp: data.T2M_MAX,
      min_temp: data.T2M_MIN,
      humidity: data.RH2M,
      surface_temp: data.TS,
    };

    // send to ML-side
    const mlResponse = await fetch(ML_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mlPayload,
      }),
    });

    // predict the crop
    const mlData = mlResponse.json();
    const recommendCrop = mlData.predicted_crop; // i.e. "Barley", "Whear", "Maize"

    // Store the crop suggestion in DB
    // Code <!---X----!>

    res.json({
      success: true,
      recommendCrop: recommendCrop,
      confidenceScore: mlData.confidence,
    });
  } catch (error) {
    console.log(`Pipeline issue: ${error}`);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch the data from API" });
  }
});

app.listen(port, () => {
  console.log(`Server running on the port: ${port}.`);
});
