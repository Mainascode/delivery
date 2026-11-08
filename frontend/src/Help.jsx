import React from "react";
import {
  SUPPORT_DISPLAY_PHONE,
  SUPPORT_TEL,
  whatsappSupport,
} from "./services/support";

const faqs = [
  {
    question: "Which areas does NITUME serve?",
    answer:
      "NITUME currently serves Ruaka and Gathigi Estate. Contact us on WhatsApp if you are unsure whether your location is covered.",
  },
  {
    question: "How are delivery charges calculated?",
    answer:
      "Your delivery service fee is shown in the app before you confirm your request. The fee may change depending on the applicable delivery conditions.",
  },
  {
    question: "Is the cost of shopping included in the delivery fee?",
    answer:
      "No. The cost of the items you ask us to purchase is separate from the NITUME delivery service fee.",
  },
  {
    question: "How do I pay?",
    answer:
      "Follow the payment instructions displayed for your order. If an M-Pesa payment is deducted but your order still shows as unpaid, contact support before trying to pay again.",
  },
  {
    question: "What if my delivery is taking longer than expected?",
    answer:
      "Send us a WhatsApp message with your order number so we can check its progress and assist you.",
  },
  {
    question: "Can I cancel an order?",
    answer:
      "Cancellation depends on the order's current progress. Contact us as soon as possible. Orders that have already moved into shopping or delivery may not be cancellable.",
  },
  {
    question: "What if an item is unavailable?",
    answer:
      "Contact support and include your order number and the item concerned. We will help clarify the available options.",
  },
  {
    question: "What if I have a payment or refund issue?",
    answer:
      "Contact us with your order number and payment details, but never share your M-Pesa PIN, password or one-time verification code.",
  },
];

export default function Help() {
  const generalMessage = "Hello NITUME, I need help with your delivery service.";

  const orderMessage =
    "Hello NITUME, I need help with an order.\n\nOrder number: \nIssue: ";

  return (
    <div className="page help-page">
      <section className="help-hero">
        <span className="help-eyebrow">NITUME CUSTOMER CARE</span>
        <h1>How can we help?</h1>
        <p>
          Questions about an order, a payment or our delivery service?
          Talk to our support team.
        </p>

        <div className="help-hero-actions">
          <a
            className="help-button help-button-whatsapp"
            href={whatsappSupport(generalMessage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">◉</span>
            Chat on WhatsApp
          </a>

          <a className="help-button help-button-call" href={`tel:${SUPPORT_TEL}`}>
            <span aria-hidden="true">☎</span>
            Call support
          </a>
        </div>
      </section>

      <section className="help-contact-section">
        <div className="help-section-heading">
          <span className="help-eyebrow">WE'RE HERE FOR YOU</span>
          <h2>Contact NITUME</h2>
          <p>Choose the easiest way to reach our team.</p>
        </div>

        <div className="help-contact-grid">
          <a
            className="help-contact-card"
            href={whatsappSupport(generalMessage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="help-contact-icon help-whatsapp-icon">◉</span>
            <span className="help-contact-label">WHATSAPP</span>
            <strong>Start a conversation</strong>
            <span className="help-contact-detail">{SUPPORT_DISPLAY_PHONE}</span>
            <span className="help-contact-link">Message us ↗</span>
          </a>

          <a className="help-contact-card" href={`tel:${SUPPORT_TEL}`}>
            <span className="help-contact-icon help-call-icon">☎</span>
            <span className="help-contact-label">PHONE SUPPORT</span>
            <strong>Speak to our team</strong>
            <span className="help-contact-detail">{SUPPORT_DISPLAY_PHONE}</span>
            <span className="help-contact-link">Call us ↗</span>
          </a>
        </div>
      </section>

      <section className="help-order-section">
        <div>
          <span className="help-eyebrow">ORDER assistance</span>
          <h2>Need help with an order?</h2>
          <p>
            Contact us directly. Include your order number and a short
            description of the issue so we can assist you faster.
          </p>
        </div>

        <a
          className="help-button help-button-dark"
          href={whatsappSupport(orderMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get order help <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="help-faq-section">
        <div className="help-section-heading">
          <span className="help-eyebrow">QUICK ANSWERS</span>
          <h2>Frequently asked questions</h2>
          <p>Find answers to common questions about using NITUME.</p>
        </div>

        <div className="help-faq-list">
          {faqs.map((faq) => (
            <details className="help-faq-item" key={faq.question}>
              <summary>
                <span>{faq.question}</span>
                <span className="help-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="help-footer-card">
        <div>
          <h2>Still need assistance?</h2>
          <p>Our support team is one message or call away.</p>
        </div>
        <a
          href={whatsappSupport(generalMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact support ↗
        </a>
      </section>
    </div>
  );
}
