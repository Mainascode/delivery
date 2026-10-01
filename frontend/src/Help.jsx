import React from "react";

const faqs = [
  {
    question: "Where do we deliver?",
    answer:
      "Our initial service area is Ruaka and Gathigi Estate.",
  },
  {
    question: "What can I request?",
    answer:
      "Shopping, errands and other simple delivery requests.",
  },
  {
    question: "What does the delivery fee cover?",
    answer:
      "The delivery fee covers the delivery service. Goods purchased for you are separate from the delivery service.",
  },
];

export default function HelpScreen() {
  return (
    <div className="help-page">
      <div className="page-header">
        <h1>Help</h1>
        <p>Find answers to common questions about Nitume.</p>
      </div>

      <div className="help-list">
        {faqs.map((faq) => (
          <div className="help-card" key={faq.question}>
            <h2>{faq.question}</h2>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
