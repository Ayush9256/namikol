module.exports = {
  refundStatus: {
    type: String,
    enum: ["Not Requested", "Pending", "Processing", "Submitted", "Completed", "Review Required"],
    default: "Not Requested",
  },
  refundPurpose: { type: String, default: "" },
  refundRequestedAt: { type: Date, default: null },
  refundSubmittedAt: { type: Date, default: null },
  refundCompletedAt: { type: Date, default: null },
};
