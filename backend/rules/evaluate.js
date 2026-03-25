function evaluateClaim(sources, claimCreatedAt) {

  let totalScore = 0;
  let ruleBreakdown = [];
  let sourceAnalysis = [];

  /* =========================
     RULE 1: SOURCE TYPE WEIGHT
  ========================= */

  const typeWeights = {
    official: 40,
    document: 30,
    media: 25,
    user: 10
  };

  const uniqueTypes = new Set();

  sources.forEach(src => {

    if (typeWeights[src.sourceType]) {
      totalScore += typeWeights[src.sourceType];
      ruleBreakdown.push(
        `+${typeWeights[src.sourceType]} from ${src.sourceType} source`
      );
      uniqueTypes.add(src.sourceType);
    }

    /* Moderator adjustments */
    if (src.reviewStatus === "relevant") {
      totalScore += 10;
      sourceAnalysis.push("+10 moderator verified relevant");
    }

    if (src.reviewStatus === "irrelevant") {
      totalScore -= 15;
      sourceAnalysis.push("-15 moderator marked irrelevant");
    }

    if (src.reviewStatus === "outdated") {
      totalScore -= 10;
      sourceAnalysis.push("-10 moderator marked outdated");
    }

  });

  /* =========================
     RULE 2: SOURCE DIVERSITY BONUS
  ========================= */

  if (uniqueTypes.size >= 2) {
    totalScore += 10;
    ruleBreakdown.push("+10 diversity bonus");
  }

  if (uniqueTypes.size >= 3) {
    totalScore += 10;
    ruleBreakdown.push("+10 strong diversity bonus");
  }

  /* =========================
     RULE 3: FRESHNESS
  ========================= */

  const ageInDays =
    (Date.now() - new Date(claimCreatedAt)) /
    (1000 * 60 * 60 * 24);

  let freshnessScore = 0;

  if (ageInDays <= 7) {
    freshnessScore = 10;
  } else if (ageInDays <= 30) {
    freshnessScore = 5;
  }

  totalScore += freshnessScore;

  if (freshnessScore > 0)
    ruleBreakdown.push(`+${freshnessScore} freshness bonus`);

  /* =========================
     NORMALIZE SCORE
  ========================= */

  if (totalScore > 100) totalScore = 100;
  if (totalScore < 0) totalScore = 0;

  /* =========================
     CONFIDENCE LEVEL
  ========================= */

  let confidenceLevel = "low";
  let status = "under-analysis";

  if (totalScore >= 70) {
    confidenceLevel = "high";
    status = "analyzed";
  } else if (totalScore >= 40) {
    confidenceLevel = "medium";
    status = "analyzed";
  }

  return {
    totalScore,
    confidenceLevel,
    status,
    freshnessScore,
    ruleBreakdown,
    sourceAnalysis
  };
}

module.exports = evaluateClaim;