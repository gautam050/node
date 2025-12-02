const Order = require('../models/Order');
const User = require('../models/User');

async function assignRandomChef(){
  const chefs = await User.find({ role: 'chef' });
  if(!chefs || chefs.length === 0) return null;
  const idx = Math.floor(Math.random() * chefs.length);
  return chefs[idx]._id;
}

exports.createOrder = async (req,res,next) => {
  try{
    const { dishId, quantity } = req.body;
    const chefId = await assignRandomChef();
    const order = await Order.create({
      user: req.user._id,
      dish: dishId,
      quantity: quantity || 1,
      chef: chefId,
      status: 'Order Received'
    });
    res.status(201).json(order);
    } catch(err){ next(err); }
};

exports.getUserOrders = async (req,res,next) => {
  try{
    const orders = await Order.find({ user: req.user._id }).populate('dish').populate('chef','name email');
    res.json(orders);
  } catch(err){ next(err); }
};

exports.updateStatus = async (req,res,next) => {
  try{
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findById(id);
    if(!order) return res.status(404).json({ message: 'Not found' });
    if(String(order.chef) !== String(req.user._id) && req.user.role !== 'admin') 
      return res.status(403).json({ message: 'Forbidden' });
    if(!['Preparing','Out for Delivery','Delivered'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    order.status = status;
    await order.save();
    res.json(order);
  } catch(err){ next(err); }
};

exports.listAll = async (req,res,next) => {
  try{
    const orders = await Order.find().populate('user','name email').populate('chef','name email').populate('dish');
    res.json(orders);
  } catch(err){ next(err); }
};

// Users can cancel their own order prior to certain statuses (optional)
