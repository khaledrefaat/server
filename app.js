const express = require('express');
const app = express();
const mongoose = require('mongoose');

// const { mongoDevUri } = require('./config/keys');

// const MONGODB_URI = mongoDevUri;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );

  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userRouter = require('./routes/user-routes');
const suppliersRouter = require('./routes/suppliers-routes');
const customerRouter = require('./routes/customer-routes');
const dailySalesRouter = require('./routes/dailySales-routes');
const itemRouter = require('./routes/item-routes');
const fertilizerRouter = require('./routes/fertilizer-routes');
const seedingRouter = require('./routes/seeding-routes');
const traysRouter = require('./routes/trays-routes');
const newNotes = require('./routes/newNotes-routes');
const loaner = require('./routes/loan-routes');

app.use('/', newNotes);

app.use('/daily-sales', dailySalesRouter);

app.use('/users', userRouter);
// موردين
app.use('/supplier', suppliersRouter);
// عملاء
app.use('/customer', customerRouter);
// // يوميات المبيعات
// app.use('/daily', dailySalesRouter);
// // الاصناف و الحجوزات
app.use('/item', itemRouter);
// // الاسمدة و المبيدات
app.use('/fertilizer', fertilizerRouter);
// // دفتر الزراعه
app.use('/seed', seedingRouter);
// الصواني
app.use('/tray', traysRouter);

// السلفه
app.use('/loan', loaner);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(5001);
    console.log('Working');
  })
  .catch(err => console.log(err));
