import React from "react";
import { FaCheckCircle } from "react-icons/fa";

const benefits = [
  {
    title: "Support local businesses 🏪",
    text: "Keep your shopping within the neighbourhood and help local shops grow.",
  },
  {
    title: "Built around the community 🚴",
    text: "NITUME is designed around the people, shops and everyday needs of Ruaka and Gathigi Estate.",
  },
  {
    title: "Fast local response ⚡",
    text: "Nearby errands don't need complicated delivery systems. Tell us what you need and we handle the running.",
  },
  {
    title: "Simple and transparent 🤝",
    text: "Know the delivery fee before your request is handled, with clear updates along the way.",
  },
];

export default function Community() {
  return (
    <div className="page community-page">
      {/* Decorative background */}
      <div className="community-decoration community-decoration-top" />
      <div className="community-decoration community-decoration-bottom" />

      <div className="community-container">
        {/* Header */}
        <div className="community-heading">
          <div className="eyebrow">NITUME / COMMUNITY</div>

          <h1>
            Built for your
            <br />
            <span>neighbourhood.</span>
          </h1>

          <p>
            NITUME connects local people with the everyday shopping and
            errands they need handled around Ruaka and Gathigi Estate.
          </p>
        </div>

        {/* Main community cards */}
        <section className="community-grid">
          <div className="community-story-card">
            <div className="community-card-glow" />

            <div className="community-card-content">
              <span className="community-card-label">
                LOCAL · SIMPLE · HUMAN
              </span>

              <h2>
                Your neighbourhood,
                <br />
                <span>on the move.</span>
              </h2>

              <p>
                From picking up groceries to getting an errand handled,
                NITUME makes it easier to get things done without leaving
                your neighbourhood.
              </p>

              <p>
                We believe local delivery should feel personal. You know
                the area. We know the area. Together we keep everyday
                errands moving.
              </p>

              <div className="community-location">
                <span className="community-location-icon">⌖</span>

                <div>
                  <strong>Serving your area</strong>
                  <span>Ruaka · Gathigi Estate</span>
                </div>
              </div>
            </div>
          </div>

          <div className="community-benefits-card">
            <div className="community-card-glow community-card-glow-right" />

            <div className="community-card-content">
              <span className="community-card-label">
                WHY NITUME?
              </span>

              <h2>
                More than
                <br />
                <span>a delivery.</span>
              </h2>

              <div className="community-benefits">
                {benefits.map((benefit) => (
                  <div
                    className="community-benefit"
                    key={benefit.title}
                  >
                    <div className="community-check">
                      <FaCheckCircle />
                    </div>

                    <div>
                      <h3>{benefit.title}</h3>
                      <p>{benefit.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom message */}
        <section className="community-bottom-card">
          <div>
            <span className="eyebrow">THE NITUME IDEA</span>

            <h2>
              When the neighbourhood moves,
              <span> everyone moves.</span>
            </h2>
          </div>

          <p>
            Whether you need something picked up, bought or delivered.
            NITUME is here to make the small things easier.
          </p>
        </section>
      </div>
    </div>
  );
}

