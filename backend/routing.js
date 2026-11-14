import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, ".../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, ".../frontend/index.html"));
});

// fetch data from NASA POWER API
app.get("/api/forecast", async (req, res) => {
  // pass to the url
  const latitude = 77.6143;
  const longitude = 77.6143;
  const start = 20270101;
  const end = 20300101;

  const NASA_POWER_API = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=SB&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=JSON`;

  try {
    const response = await fetch(NASA_POWER_API);
    const data = await response.json();
    res.json({
      success: true,
      metadata: data.header,
      weatherData: data.properties.parameter,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch the data from API" });
  }
});

app.listen(port, () => {
  console.log(`Server running on the port: ${port}.`);
});
