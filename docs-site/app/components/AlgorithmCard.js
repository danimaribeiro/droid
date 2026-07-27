"use client";

export default function AlgorithmCard({ title, description, steps, index }) {
  return (
    <div className="algorithm-card">
      <div className="algorithm-card-header">
        <span className="algorithm-card-number">{index + 1}</span>
        <h3 className="algorithm-card-title">{title}</h3>
      </div>
      {description && (
        <p className="algorithm-card-description">{description}</p>
      )}
      <ol className="algorithm-card-steps">
        {steps.map((step, i) => (
          <li key={i} className="algorithm-card-step">
            <span className="step-number">[{i + 1}]</span>
            <span className="step-text">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
