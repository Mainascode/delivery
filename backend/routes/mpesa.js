
import express from "express";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import MpesaPayment from "../models/MpesaPayment.js";

import { requireAuth, requireAdmin } from "../middleware/auth.js";

import {
  initiateStkPush,
  normalizeKenyanPhone,
  parseMpesaCallback,
} from "../services/mpesa.js";

import { createNotification } from "../services/notifications.js";

const router = express.Router();

function acknowledgeSafaricom(res) {
  return res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });
}

/*
 ADMIN: SET ACTUAL SHOPPING COST

 Allowed only while shopping is in progress.
 The backend calculates the final amount.
*/
router.patch(
  "/orders/:id/shopping-cost",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const shoppingCost = Number(req.body.shoppingCost);

      if (!Number.isSafeInteger(shoppingCost) || shoppingCost < 0) {
        return res.status(400).json({
          success: false,
          error: "Shopping cost must be a non-negative whole KES amount.",
        });
      }

      const currentOrder = await Order.findOne({
        _id: req.params.id,
        status: "SHOPPING",
        paymentStatus: "UNPAID",
        paymentRequestInProgress: { $ne: true },
      });

      if (!currentOrder) {
        return res.status(409).json({
          success: false,
          error: "Shopping cost can only be entered for an unpaid order currently being shopped.",
        });
      }

      const totalAmount = shoppingCost + currentOrder.deliveryFee;

      if (!Number.isSafeInteger(totalAmount)) {
        return res.status(400).json({
          success: false,
          error: "The calculated order total is invalid.",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: currentOrder._id,
          status: "SHOPPING",
          paymentStatus: "UNPAID",
          paymentRequestInProgress: { $ne: true },
          deliveryFee: currentOrder.deliveryFee,
        },
        {
          $set: {
            shoppingCost,
            totalAmount,
            shoppingCostEnteredAt: new Date(),
            shoppingCostEnteredBy: req.user._id,
          },
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(409).json({
          success: false,
          error: "The order changed while the shopping cost was being saved. Refresh and try again.",
        });
      }

      return res.json({
        success: true,
        message: "Shopping cost saved.",
        order,
      });
    } catch (error) {
      console.error("Shopping cost update error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to update shopping cost.",
      });
    }
  }
);

/*
 CUSTOMER: REQUEST M-PESA STK PUSH
*/
router.post(
  "/orders/:id/stk-push",
  requireAuth,
  async (req, res) => {
    let payment = null;
    let lockedOrder = null;
    let stkRequestMayHaveReachedSafaricom = false;

    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const phoneNumber = normalizeKenyanPhone(req.body.phoneNumber);

      const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found.",
        });
      }

      if (order.status !== "READY_FOR_DELIVERY") {
        return res.status(409).json({
          success: false,
          error: "Payment is available when your order is ready for delivery.",
        });
      }

      if (
        order.shoppingCost === null ||
        order.shoppingCost === undefined ||
        !Number.isSafeInteger(order.totalAmount) ||
        order.totalAmount < 1 ||
        order.totalAmount !== order.shoppingCost + order.deliveryFee
      ) {
        return res.status(409).json({
          success: false,
          error: "The final order amount has not been confirmed by the admin.",
        });
      }

      if (order.paymentStatus === "CONFIRMED") {
        return res.status(409).json({
          success: false,
          error: "This order has already been paid.",
        });
      }

      const existingPayment = await MpesaPayment.findOne({
        order: order._id,
        status: {
          $in: ["INITIATED", "PENDING", "REVIEW_REQUIRED"],
        },
      });

      if (existingPayment) {
        return res.status(409).json({
          success: false,
          error: existingPayment.status === "REVIEW_REQUIRED"
            ? "Your previous payment needs reconciliation. Do not request another prompt."
            : "A payment request is already pending. Check your phone before trying again.",
          paymentId: existingPayment._id,
          paymentStatus: existingPayment.status,
        });
      }

      lockedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          customer: req.user._id,
          status: "READY_FOR_DELIVERY",
          paymentStatus: "UNPAID",
          paymentRequestInProgress: { $ne: true },
          totalAmount: order.totalAmount,
          activeMpesaPayment: order.activeMpesaPayment ?? null,
        },
        {
          $set: {
            paymentRequestInProgress: true,
          },
        },
        { new: true }
      );

      if (!lockedOrder) {
        return res.status(409).json({
          success: false,
          error: "Another payment request is being processed. Refresh and try again.",
        });
      }

      payment = await MpesaPayment.create({
        order: lockedOrder._id,
        customer: req.user._id,
        amount: lockedOrder.totalAmount,
        phoneNumber,
        status: "INITIATED",
      });

      // Save the payment reference before contacting Safaricom.
      // This prevents a second request while the first is in progress.
      lockedOrder.activeMpesaPayment = payment._id;
      lockedOrder.paymentMethod = "MPESA";
      await lockedOrder.save();

      stkRequestMayHaveReachedSafaricom = true;

      const stk = await initiateStkPush({
        phoneNumber,
        amount: payment.amount,
        orderId: lockedOrder._id,
      });

      payment.merchantRequestId = stk.merchantRequestId;
      payment.checkoutRequestId = stk.checkoutRequestId;
      payment.status = "PENDING";
      payment.resultDescription = stk.customerMessage || "STK Push sent.";

      await payment.save();

      await Order.updateOne(
        {
          _id: lockedOrder._id,
          activeMpesaPayment: payment._id,
          paymentStatus: "UNPAID",
        },
        {
          $set: {
            paymentRequestInProgress: false,
          },
        }
      );

      return res.status(202).json({
        success: true,
        message: stk.customerMessage,
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
        },
      });
    } catch (error) {
      console.error("STK Push error:", error.message);

      // A transport timeout or lost response is ambiguous: Safaricom may
      // already have received the request. Never unlock for another prompt.
      const uncertain =
        error.safeToRetry === false ||
        (
          stkRequestMayHaveReachedSafaricom &&
          typeof error.safeToRetry !== "boolean"
        );

      if (payment) {
        payment.status = uncertain ? "REVIEW_REQUIRED" : "FAILED";
        payment.resultDescription = uncertain
          ? "STK request outcome is unknown. Reconciliation is required before another payment attempt."
          : error.message;
        if (!uncertain) payment.completedAt = new Date();
        await payment.save().catch((saveError) => {
          console.error("Unable to save STK failure state:", saveError.message);
        });
      }

      if (lockedOrder && !uncertain) {
        await Order.updateOne(
          {
            _id: lockedOrder._id,
            activeMpesaPayment: payment?._id,
            paymentStatus: "UNPAID",
          },
          {
            $set: {
              paymentRequestInProgress: false,
            },
            $unset: {
              activeMpesaPayment: "",
              paymentMethod: "",
            },
          }
        ).catch((updateError) => {
          console.error("Unable to release payment lock:", updateError.message);
        });
      }

      return res.status(502).json({
        success: false,
        paymentStatus: payment?.status || "UNKNOWN",
        error: uncertain
          ? "We could not confirm whether Safaricom received the payment request. Do not retry yet; the payment needs reconciliation."
          : error.message || "Unable to initiate M-Pesa payment.",
      });
    }
  }
);

/*
 CUSTOMER OR ADMIN: CHECK PAYMENT STATUS
*/
router.get(
  "/orders/:id/payment",
  requireAuth,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const orderQuery = { _id: req.params.id };

      if (req.user.role !== "ADMIN") {
        orderQuery.customer = req.user._id;
      }

      const order = await Order.findOne(orderQuery);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found.",
        });
      }

      const payment = await MpesaPayment.findOne({
        order: order._id,
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
payment: payment
  ? {
      id: payment._id,
      amount: payment.amount,
      status: payment.status,
      receiptNumber: payment.mpesaReceiptNumber,
      resultDescription: payment.resultDescription,
      initiatedAt: payment.initiatedAt || payment.createdAt,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    }
  : null,
      });
    } catch (error) {
      console.error("Payment status error:", error);

      return res.status(500).json({
        success: false,
        error: "Unable to retrieve payment status.",
      });
    }
  }
);

/*
 PUBLIC SAFARICOM CALLBACK
 No Firebase authentication: Safaricom calls this server-to-server.
*/
router.post(
  "/payments/mpesa/callback",
  async (req, res) => {
    let callback;

    try {
      callback = parseMpesaCallback(req.body);
    } catch (error) {
      console.error("Invalid M-Pesa callback:", error.message);
      return acknowledgeSafaricom(res);
    }

    try {
      const payment = await MpesaPayment.findOne({
        checkoutRequestId: callback.checkoutRequestId,
      });

      if (!payment) {
        console.error(
          "M-Pesa callback has no matching payment:",
          callback.checkoutRequestId
        );
        return acknowledgeSafaricom(res);
      }

      // A duplicate callback must not reapply a completed transaction.
      if (payment.status === "SUCCESS") {
        return acknowledgeSafaricom(res);
      }

      const receivedAt = new Date();

      payment.callbackPayload = req.body;
      payment.callbackReceivedAt = receivedAt;
      payment.resultCode = Number.isInteger(callback.resultCode)
        ? callback.resultCode
        : null;
      payment.resultDescription = callback.resultDescription || "";

      if (
        callback.merchantRequestId &&
        payment.merchantRequestId &&
        callback.merchantRequestId !== payment.merchantRequestId
      ) {
        payment.status = "REVIEW_REQUIRED";
        payment.resultDescription =
          "Merchant request ID mismatch. Payment requires reconciliation.";
        await payment.save();

        console.error("M-Pesa merchant request ID mismatch:", callback.checkoutRequestId);
        return acknowledgeSafaricom(res);
      }

      if (!Number.isInteger(callback.resultCode)) {
        payment.status = "REVIEW_REQUIRED";
        payment.resultDescription =
          "Callback result code was missing or invalid. Reconciliation is required.";
        await payment.save();
        return acknowledgeSafaricom(res);
      }

      // A non-zero result code is Safaricom's explicit unsuccessful result.
      if (callback.resultCode !== 0) {
        payment.status = "FAILED";
        payment.completedAt = receivedAt;
        await payment.save();

        await Order.updateOne(
          {
            _id: payment.order,
            activeMpesaPayment: payment._id,
            paymentStatus: "UNPAID",
          },
          {
            $set: { paymentRequestInProgress: false },
            $unset: {
              activeMpesaPayment: "",
              paymentMethod: "",
            },
          }
        );

        return acknowledgeSafaricom(res);
      }

      let normalizedCallbackPhone = null;

      try {
        normalizedCallbackPhone = normalizeKenyanPhone(callback.phoneNumber);
      } catch {
        // Keep the payment for reconciliation below.
      }

      const mismatch =
        !Number.isSafeInteger(callback.amount) ||
        callback.amount !== payment.amount ||
        !callback.receiptNumber ||
        !normalizedCallbackPhone ||
        normalizedCallbackPhone !== payment.phoneNumber;

      if (mismatch) {
        payment.status = "REVIEW_REQUIRED";
        payment.resultDescription =
          "Safaricom reported success, but callback amount, phone number or receipt did not match. Reconciliation is required.";
        await payment.save();

        console.error(
          "M-Pesa successful callback verification mismatch:",
          callback.checkoutRequestId
        );

        // Keep the order payment lock and active payment reference.
        return acknowledgeSafaricom(res);
      }

      const session = await mongoose.startSession();
      let confirmed = false;

      try {
        await session.withTransaction(async () => {
          const eligiblePayment = await MpesaPayment.findOne({
            _id: payment._id,
            status: { $in: ["INITIATED", "PENDING", "REVIEW_REQUIRED"] },
          }).session(session);

          if (!eligiblePayment) {
            return;
          }

          const order = await Order.findOneAndUpdate(
            {
              _id: payment.order,
              customer: payment.customer,
              status: "READY_FOR_DELIVERY",
              paymentStatus: "UNPAID",
              totalAmount: payment.amount,
              activeMpesaPayment: payment._id,
            },
            {
              $set: {
                paymentStatus: "CONFIRMED",
                paymentConfirmedAt: receivedAt,
                paymentConfirmedBy: null,
                paymentRequestInProgress: false,
              },
            },
            {
              new: true,
              session,
            }
          );

          if (!order) {
            // Safaricom says money was collected, but the order no longer
            // matches. Preserve the transaction details for reconciliation.
            await MpesaPayment.updateOne(
              { _id: payment._id },
              {
                $set: {
                  status: "REVIEW_REQUIRED",
                  resultCode: callback.resultCode,
                  resultDescription:
                    "Safaricom reported successful payment, but the order state or amount did not match. Manual reconciliation is required.",
                  mpesaReceiptNumber: callback.receiptNumber,
                  transactionDate: callback.transactionDate || null,
                  completedAt: receivedAt,
                },
              },
              { session }
            );
            return;
          }

          await MpesaPayment.updateOne(
            { _id: payment._id },
            {
              $set: {
                status: "SUCCESS",
                resultCode: callback.resultCode,
                resultDescription: callback.resultDescription || "Payment received.",
                mpesaReceiptNumber: callback.receiptNumber,
                transactionDate: callback.transactionDate || null,
                callbackReceivedAt: receivedAt,
                callbackPayload: req.body,
                completedAt: receivedAt,
              },
            },
            { session }
          );

          confirmed = true;
        });
      } finally {
        await session.endSession();
      }

      if (confirmed) {
        await createNotification({
          userId: payment.customer,
          title: "M-Pesa payment confirmed",
          message: `Your payment of KSh ${payment.amount} was received. Receipt: ${callback.receiptNumber}.`,
          type: "PAYMENT_CONFIRMED",
          orderId: payment.order,
          data: {
            paymentStatus: "CONFIRMED",
            receiptNumber: callback.receiptNumber,
            amount: payment.amount,
          },
        }).catch((error) => {
          console.error("Payment notification error:", error.message);
        });
      } else {
        const latestPayment = await MpesaPayment.findById(payment._id);

        if (latestPayment?.status === "REVIEW_REQUIRED") {
          console.error(
            "Successful M-Pesa payment requires order reconciliation:",
            callback.checkoutRequestId
          );
        }
      }
    } catch (error) {
      console.error("M-Pesa callback processing error:", error);
    }

    return acknowledgeSafaricom(res);
  }
);

export default router;
