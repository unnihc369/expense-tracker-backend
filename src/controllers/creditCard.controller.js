import CreditCard from "../models/CreditCard.js";
import Transaction from "../models/Transaction.js";

export const createCreditCard = async (req, res) => {
  try {
    const { name, limit = 0, outstanding = 0, dueDate, color } = req.body;

    const card = await CreditCard.create({
      name,
      limit: Number(limit) || 0,
      outstanding: Number(outstanding) || 0,
      dueDate: dueDate || null,
      color: color || "#D4537E",
      userId: req.user.id,
    });

    return res.status(201).json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCreditCards = async (req, res) => {
  try {
    const cards = await CreditCard.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(cards);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCreditCardById = async (req, res) => {
  try {
    const card = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!card) return res.status(404).json({ message: "Credit card not found" });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateCreditCard = async (req, res) => {
  try {
    const { name, limit, outstanding, dueDate, color } = req.body;
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (limit !== undefined) patch.limit = Number(limit);
    if (outstanding !== undefined) patch.outstanding = Number(outstanding);
    if (dueDate !== undefined) patch.dueDate = dueDate;
    if (color !== undefined) patch.color = color;

    const card = await CreditCard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      patch,
      { new: true }
    );
    if (!card) return res.status(404).json({ message: "Credit card not found" });
    return res.json(card);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteCreditCard = async (req, res) => {
  try {
    const card = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!card) return res.status(404).json({ message: "Credit card not found" });

    const count = await Transaction.countDocuments({
      userId: req.user.id,
      $or: [
        { accountModel: "CreditCard", accountId: card._id },
        { creditCardId: card._id },
      ],
    });
    if (count > 0) {
      return res.status(400).json({
        message: "Cannot delete card with linked transactions",
      });
    }

    await card.deleteOne();
    return res.json({ message: "Credit card deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
