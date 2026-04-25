import express from "express";
import cors from "cors";
import errorHandler from "./middlewares/error.middleware";
import authRoute from "./modules/auth/auth.route";
import userRoute from "./modules/users/user.route";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}))

authRoute(app);
userRoute(app);


app.use((req,res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found."
    });
})

app.use(errorHandler);