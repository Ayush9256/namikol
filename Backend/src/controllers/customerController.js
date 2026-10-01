const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");
const Address = require("../models/Address");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const EmailVerification = require("../models/EmailVerification");
const CustomerPasswordReset = require("../models/CustomerPasswordReset");
const PaymentIntent = require("../models/PaymentIntent");
const Order = require("../models/Order");

const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select(
      "-password"
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer profile fetched successfully.",
      customer,
    });
  } catch (error) {
    console.error("Get customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer profile.",
    });
  }
};

const updateCustomerProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      state,
      pincode,
    } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required.",
      });
    }

    if (phone?.trim() && phone.replace(/\D/g, "").length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    if (
      pincode?.trim() &&
      pincode.replace(/\D/g, "").length !== 6
    ) {
      return res.status(400).json({
        success: false,
        message: "PIN code must contain 6 digits.",
      });
    }

    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    customer.firstName = firstName.trim();
    customer.lastName = lastName.trim();
    customer.phone = phone?.trim() || "";
    customer.address = address?.trim() || "";
    customer.city = city?.trim() || "";
    customer.state = state?.trim() || "";
    customer.pincode = pincode?.trim() || "";

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        role: customer.role,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer profile.",
    });
  }
};


const changeCustomerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      customer.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    customer.password = await bcrypt.hash(newPassword, 10);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change customer password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};
const deleteCustomerAccount = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Your password is required to delete your account.",
    });
  }

  const session = await mongoose.startSession();

  try {
    const customer = await Customer.findById(req.customer.id).select("+password");

    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect.",
      });
    }

    await session.withTransaction(async () => {
      const customerId = customer._id;
      const redactedAddress = {
        id: "",
        fullName: "Deleted Customer",
        phone: "Redacted",
        addressLine: "Redacted",
        city: "Redacted",
        state: "Redacted",
        pincode: "000000",
        landmark: "",
      };

      await Address.deleteMany({ customerId }, { session });
      await Cart.deleteMany({ customerId }, { session });
      await Wishlist.deleteMany({ customerId }, { session });
      await EmailVerification.deleteMany({ customerId }, { session });
      await CustomerPasswordReset.deleteMany({ customerId }, { session });
      await PaymentIntent.deleteMany({ customerId }, { session });
      await Order.updateMany(
        { customerId },
        {
          $set: {
            customer: {
              firstName: "Deleted",
              lastName: "Customer",
              email: `deleted-${customerId}@privacy.invalid`,
            },
            shippingAddress: redactedAddress,
            returnReason: "",
          },
        },
        { session }
      );
      await Customer.deleteOne({ _id: customerId }, { session });
    });

    return res.status(200).json({
      success: true,
      message: "Your account has been deleted.",
    });
  } catch (error) {
    console.error("Delete customer account error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete your account.",
    });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  deleteCustomerAccount,
};