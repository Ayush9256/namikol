const Address = require("../models/Address");

const validateAddress = ({
  fullName,
  phone,
  addressLine,
  city,
  state,
  pincode,
}) => {
  if (
    !fullName?.trim() ||
    !phone?.trim() ||
    !addressLine?.trim() ||
    !city?.trim() ||
    !state?.trim() ||
    !pincode?.trim()
  ) {
    return "Full name, phone, address, city, state and PIN code are required.";
  }

  if (phone.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }

  if (pincode.replace(/\D/g, "").length !== 6) {
    return "PIN code must contain 6 digits.";
  }

  return null;
};


// GET all addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      customerId: req.customer.id,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load addresses.",
    });
  }
};


// ADD address
const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      isDefault,
    } = req.body;

    const validationError = validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existingAddresses = await Address.find({
      customerId: req.customer.id,
    });

    const shouldBeDefault =
      existingAddresses.length === 0 || Boolean(isDefault);

    if (shouldBeDefault) {
      await Address.updateMany(
        { customerId: req.customer.id },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      customerId: req.customer.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      landmark: landmark?.trim() || "",
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      address,
    });
  } catch (error) {
    console.error("Add address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add address.",
    });
  }
};


// UPDATE address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      phone,
      addressLine,
      city,
      state,
      pincode,
      landmark,
      isDefault,
    } = req.body;

    const validationError = validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const address = await Address.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    if (Boolean(isDefault)) {
      await Address.updateMany(
        {
          customerId: req.customer.id,
          _id: { $ne: id },
        },
        { $set: { isDefault: false } }
      );

      address.isDefault = true;
    }

    address.fullName = fullName.trim();
    address.phone = phone.trim();
    address.addressLine = addressLine.trim();
    address.city = city.trim();
    address.state = state.trim();
    address.pincode = pincode.trim();
    address.landmark = landmark?.trim() || "";

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update address.",
    });
  }
};


// DELETE address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const wasDefault = address.isDefault;

    await Address.deleteOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (wasDefault) {
      const nextAddress = await Address.findOne({
        customerId: req.customer.id,
      }).sort({
        createdAt: 1,
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete address.",
    });
  }
};


// SET DEFAULT address
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      customerId: req.customer.id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    await Address.updateMany(
      {
        customerId: req.customer.id,
      },
      {
        $set: {
          isDefault: false,
        },
      }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Set default address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to set default address.",
    });
  }
};


module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};