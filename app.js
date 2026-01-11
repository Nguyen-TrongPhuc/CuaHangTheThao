const express = require("express");
const cors = require("cors");
const suppliersRouter = require("./app/routes/suppliers.route");
const categoriesRouter = require("./app/routes/categories.route");
const productsRouter = require("./app/routes/products.route");
const customersRouter = require("./app/routes/customers.route");
const employeesRouter = require("./app/routes/employees.route");
const ordersRouter = require("./app/routes/orders.route");
const orderDetailsRouter = require("./app/routes/orderdetails.route");
const uploadRouter = require("./app/routes/upload.route");

const ApiError = require("./app/api-error");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to SportStore." });
});

app.use("/api/suppliers", suppliersRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/employees", employeesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/orderdetails", orderDetailsRouter);
app.use("/api/upload", uploadRouter);

app.use((req, res, next) => {
  return next(new ApiError(404, "Resource not found"));
});
app.use((err, req, res, next) => {
  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;