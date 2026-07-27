"use client";

export default function StageObjective({ objective }) {
  return (
    <div className="stage-objective">
      <div className="stage-objective-badge">🎯 Stage Objective</div>
      <p className="stage-objective-text">{objective}</p>
    </div>
  );
}
