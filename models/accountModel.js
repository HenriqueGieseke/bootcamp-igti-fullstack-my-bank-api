import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  agencia: {
    type: Number,
    require: true,
  },
  conta: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  balance: {
    type: Number,
    min: 0,
    require: true,
  },
});

const accountModel = mongoose.model('accounts', accountSchema);

export { accountModel };
