import Budget from "../models/Budget.js";

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const getBudget = async (req, res) => {
  try {
    const month = req.query.month || monthKey();
    const doc = await Budget.findOne({ userId: req.user.id, month });
    if (!doc) {
      return res.json({ month, categories: {} });
    }
    const categories = Object.fromEntries(doc.categories || new Map());
    return res.json({ month: doc.month, categories, updatedAt: doc.updatedAt });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const upsertBudget = async (req, res) => {
  try {
    const { month = monthKey(), categories = {} } = req.body;
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month must be YYYY-MM" });
    }

    const map = new Map(Object.entries(categories).map(([k, v]) => [k, Number(v) || 0]));

    const doc = await Budget.findOneAndUpdate(
      { userId: req.user.id, month },
      {
        $set: { categories: map },
        $setOnInsert: { userId: req.user.id, month },
      },
      { new: true, upsert: true }
    );

    return res.json({
      month: doc.month,
      categories: Object.fromEntries(doc.categories || new Map()),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const listBudgetMonths = async (req, res) => {
  try {
    const docs = await Budget.find({ userId: req.user.id })
      .select("month updatedAt")
      .sort({ month: -1 })
      .limit(24);
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
