import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // 👇 Clerk usa strings, así que mantenemos string aquí
  userId: { type: String, required: true }, 

  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
      quantity: { type: Number, required: true },
    },
  ],
  amount: { type: Number, required: true },
  address: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, required: true, default: "Order Placed" },
  date: { type: Number, required: true },
  isPaid: { type: Boolean, required: true, default: false },
});

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
export default Order;
