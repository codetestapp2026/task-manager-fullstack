const Task = require("../models/taskModel");

exports.findTasks = async ({ filter, sort, skip, limit }) => {
  return Task.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

exports.countTasks = async (filter) => {
  return Task.countDocuments(filter);
};

exports.findOneTask = async (filter) => {
  return Task.findOne(filter);
};

exports.createTask = async (data) => {
  return Task.create(data);
};

exports.updateTask = async (filter, data) => {
  return Task.findOneAndUpdate(
    filter,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

exports.deleteTask = async (filter) => {
  return Task.findOneAndDelete(filter);
};

