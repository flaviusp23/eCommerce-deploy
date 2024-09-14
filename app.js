require("dotenv").config();
//swagger
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");

//express
const express = require("express");
const app = express();
app.use(express.json());
require("express-async-errors"); // echivalent cu try catch, decat sa pun peste tot mai bine facem asa fiinda folosim async in controllers
const port = process.env.PORT || 5000;

//security
const rateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  })
);
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

//db
const connectDB = require("./db/connect");

//middleware
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddlware = require("./middleware/error-handler");
const morgan = require("morgan");

// cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.JWT_SECRET)); // we can use the same secret, or create another one its fine

//file upload
const fileUpload = require("express-fileupload");
app.use(express.static("./public"));
app.use(fileUpload());

//logging requests
app.use(morgan("tiny"));

//routes
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const productRouter = require("./routes/productRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const orderRouter = require("./routes/orderRoutes");
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.get("/api/v1/", (req, res) => {
  res.send("Homepage");
});
app.use("/", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(notFoundMiddleware);
app.use(errorHandlerMiddlware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();
