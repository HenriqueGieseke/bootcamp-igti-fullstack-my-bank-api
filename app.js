import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { accountsRouter } from './routes/accountsRouter.js';

//connectar ao mongodb pelo mongoose
(async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD}@cluster0.phrrv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      }
    );
    console.log('MongoDB connected');
  } catch (err) {
    console.log('erro ao conectar ao mongodb ' + err);
  }
})();

const app = express();

app.use(express.json());
app.use(accountsRouter);

app.listen(process.env.PORT, () => {
  console.log('API online');
});
