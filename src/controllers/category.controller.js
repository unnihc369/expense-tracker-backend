import Category from "../models/Category.js";

export const createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    const category = await Category.create({
      name,
      type,
      userId: req.user.id,
    });

    return res.status(201).json(category);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ userId: req.user.id }, { userId: null }],
    });

    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json(category);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!category) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
