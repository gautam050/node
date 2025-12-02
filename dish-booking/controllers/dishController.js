const Dish = require('../models/Dish');

exports.create = async (req,res,next) => {
  try{
    const { name, description, price } = req.body;
    const dish = await Dish.create({ name, description, price, createdBy: req.user._id });
    res.status(201).json(dish);
  } catch(err){ next(err); }
};
exports.list = async (req,res,next) => {
  try { const dishes = await Dish.find(); res.json(dishes); } catch(err){next(err);}
};
exports.get = async (req,res,next) => {
  try { const dish = await Dish.findById(req.params.id); if(!dish) return res.status(404).end(); res.json(dish);} catch(err){next(err);}
};
exports.update = async (req,res,next) => {
  try { const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {new:true}); res.json(dish);} catch(err){next(err);}
};
exports.remove = async (req,res,next) => {
  try { await Dish.findByIdAndDelete(req.params.id); res.status(204).end(); } catch(err){next(err);}
};
