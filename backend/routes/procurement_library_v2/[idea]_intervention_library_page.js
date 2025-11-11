// GROUP BY ATTRIBUTE ID DIRECTLY FROM ENDPOINT
[
  {
    id: "attribute_id (only from sourcing strategy cycle category)",
    label: "attribute_label (only from sourcing strategy cycle category)",
    practices: [
      {
        id: "practice_id (only practice from the related strategy cycle attribute)",
        label: "practice_name",
        is_environmental: "boolean (same logic as list practices route)",
        is_income: "boolean (same logic as list practices route)",
        tags: [
          "list of related practice intervention tags of this particular practice",
        ],
      },
    ],
  },
];

// "OR"

// GET THE PRACTICE BY ATTRIBUTE ID
// BUT WE NEED TO CALL SEPARATE ENDPOINT BY SOURCING STRATEGY CYCLE FROM FE
[
  {
    id: "practice_id (only practice from the related strategy cycle attribute)",
    label: "practice_name",
    is_environmental: "boolean (same logic as list practices route)",
    is_income: "boolean (same logic as list practices route)",
    tags: [
      "list of related practice intervention tags of this particular practice",
    ],
  },
];
