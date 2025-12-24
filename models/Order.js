import mongoose from "mongoose";
const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    status: {
      type: String,
      default: "Order Placed",
    },

    date: {
      type: Date,
      default: Date.now, 
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);


const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
