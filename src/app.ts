import express from "express";
import cors from "cors";

import errorHandler from "./middlewares/error.middleware";

import authRoute from "./modules/auth/auth.route";
import userRoute from "./modules/users/user.route";

import searchRoute from "./modules/search/search.route";
import friendRoute from "./modules/friend/friend.route";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

authRoute(app);
userRoute(app);
app.use("/api/search", searchRoute);
app.use("/api/friend", friendRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend working"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found."
  });
});

app.use(errorHandler);