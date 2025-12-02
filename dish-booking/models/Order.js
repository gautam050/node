const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dish: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  quantity: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['Order Received','Preparing','Out for Delivery','Delivered'], 
    default: 'Order Received' 
  },
  chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // assigned chef
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
