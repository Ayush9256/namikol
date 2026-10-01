const StoreSettings = require("../models/StoreSettings");

const getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne({
      key: "store",
    });

    if (!settings) {
      settings = await StoreSettings.create({
        key: "store",
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error(
      "Get store settings failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load store settings.",
    });
  }
};

const updateStoreSettings = async (req, res) => {
  try {
    const allowedFields = [
      "storeName",
      "storeTagline",
      "currency",
      "currencySymbol",
      "allowOrders",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    let settings = await StoreSettings.findOneAndUpdate(
      { key: "store" },
      {
        $set: updateData,
        $setOnInsert: {
          key: "store",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Store settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error(
      "Update store settings failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update store settings.",
    });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};