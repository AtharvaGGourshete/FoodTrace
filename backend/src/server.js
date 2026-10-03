import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FoodTrace backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`FoodTrace backend running on http://localhost:${PORT}`);
});