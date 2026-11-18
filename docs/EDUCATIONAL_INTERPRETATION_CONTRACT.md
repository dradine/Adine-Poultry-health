# Educational interpretation contract (clinical decision-support UI)

## Purpose
The application is intended for a trained poultry veterinarian. Every model output must teach the reasoning behind the result and support explanation to a farmer or another veterinarian. It is not a substitute for vaccine label, flock-specific veterinary judgment, laboratory quality review, or clinical diagnosis.

## Mandatory output structure for each disease/model

1. **Decision status (not a prescription):** `candidate window / not yet / overdue / indeterminate / do not calculate`; distinguish arithmetic output from recommendation.
2. **Plain-language explanation:** 2–4 sentences understandable to a farmer, with no unsupported guarantee of protection.
3. **Technical reasoning:** show measured inputs, model assumptions, selected statistic/rank, assay and units, breakthrough/target definition, source of each parameter, formula and intermediate steps, uncertainty.
4. **Why this date/window:** explain which biological barrier or target is being estimated and how the selected vaccine/assay/population influences it.
5. **Why not earlier:** explain interference/neutralization or other relevant mechanism only where evidence supports it.
6. **Why not later:** explain exposure/susceptibility/coverage risk, and distinguish this from a proven outbreak forecast.
7. **Confidence and uncertainty:** label evidence quality, data quality, sampling representativeness, assay comparability and model validation. Confidence cannot be a decorative score; define its rubric.
8. **Contradictions and red flags:** conflicting flock history, unexpected titres, poor uniformity, sample age, invalid controls, outbreak signs, vaccine route/label constraints.
9. **Next action:** retest, inspect records, confirm kit/IFU, review vaccine label, assess clinical/epidemiological risk, or consult lab; never automatically advise repeat vaccination.
10. **Two explanation modes:** farmer-facing concise explanation and veterinarian-facing detailed scientific explanation; both generated from same verified facts, not independent AI improvisation.
11. **Traceability:** source title/author/year, DOI/PMID or official IFU URL, revision/access date, exact claim supported, model version and calculation audit trail.

## IBD-specific interpretation requirements

- State that the Deventer-style estimate is applicable to conventional live IBD vaccines only when the assay titre scale and breakthrough titre are compatible and verified. Do not extend it to immune-complex or HVT-VP2 vaccines.
- Show raw titres and distribution, sample size, flock type, sampling age, selected susceptible percentage, order-statistic rank and corresponding titre, BTT, half-life, correction days, estimated day and all scenario outputs.
- Explicitly explain that the selected susceptible fraction is a planning assumption/coverage target, not the percent that will certainly be protected. A 5% tail and a 75% susceptible-at-vaccination objective are not interchangeable.
- If samples are insufficient, controls invalid, assay unverified, scale mismatch, or provenance absent: stop calculation or downgrade to exploratory scenario; never quietly fill with default values.
- Distinguish mathematical date from operationally feasible vaccination date (water/feed/handling, route, vaccine label, flock health, cold chain and administration quality).
- State what the model does NOT infer: clinical protection, neutralizing antibody, cellular immunity, field strain match, bursal integrity, infection status, vaccine take or future outbreak probability.

## General disease model guardrails

- **NDV:** ELISA is a monitoring measure; HI is antigen/subtype-dependent and reports log2 haemagglutination-inhibition endpoint. Do not convert ELISA titres to HI or claim one protective universal number. Consider vaccine program, route, maternal antibody, genotype/field challenge, cellular/local immunity and clinical context.
- **IBV:** serology may support monitoring but cross-reactivity/strain diversity and mucosal/cellular immunity limit inference. Do not treat a single ELISA titre as universal protection or as a direct strain-matching assay.
- **AIV:** distinguish antibodies to nucleoprotein (often group/type A screening) from HA subtype-specific HI/ELISA; DIVA strategy, vaccination policy, regulatory status, surveillance and PCR/virus detection must be considered. No generic vaccine date based on antibody titre alone.
- **MG/MS/other organisms:** ELISA measures humoral response and may not represent protection or infection activity; account for organism-specific biology and validated diagnostic context.
- Do not enable disease-specific calculations until a peer-reviewed/official method, intended population, validated assay, reference cases and limitations are documented.

## Required acceptance test for interpretation
A veterinarian reviewer must be able to answer: “Why this day?”, “What would change the day?”, “What can this result not tell us?”, “What should I explain to a farmer?”, and “What is the evidence?” using the on-screen explanation without guessing or opening source code.
