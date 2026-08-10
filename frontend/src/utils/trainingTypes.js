export const TRAINING_TYPES = {
  "Easy Run": "E",
  "Marathon Pace": "M",
  "Tempo Run": "T",
  "Interval Run": "I",
  "Repetition Run": "R",
  "Hard Run": "H",
  "Long Run": "L",
  "Quality Session": "Q",
  "Shakeout Run": "E",
  "RACE DAY": "Q",
};

export const getTrainingType = (activity) => TRAINING_TYPES[activity] || "";
