import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["POST", "COMMENT"],
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: ["SPAM", "ABUSE", "HATE", "OTHER"],
      required: true,
    },

    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

reportSchema.index(
  { targetType: 1, targetId: 1, reporterId: 1 },
  { unique: true }
);

export default mongoose.model("Report", reportSchema);
