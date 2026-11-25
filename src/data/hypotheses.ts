import type { Hypothesis } from '../types/evidence.ts'

/** Seed hypotheses are research FRAMES, not conclusions. Confidence starts "unassessed". */
export const SEED_HYPOTHESES: Hypothesis[] = [
  {
    id: 'H-001',
    title: 'Terminus close to the 7th arc, southern Indian Ocean (published reference)',
    description:
      'The aircraft ended flight near the 7th arc after fuel exhaustion, within the region defined by the ATSB/DSTG Bayesian analysis and later refined by drift studies.',
    supportingEvidence: ['Satcom BTO/BFO analysis (DSTG 2016)', 'Confirmed debris recoveries in western Indian Ocean', 'CSIRO drift studies (2016–2017)'],
    contradictingEvidence: ['No wreck found in ~120,000 km² (2014–17), 2018 and 2025–26 searched areas'],
    assumptions: ['Automated flight after final major turn', 'Final 00:19 log-on caused by power restoration after fuel exhaustion'],
    confidence: 'unassessed',
    dataDependencies: ['ds-inmarsat-log', 'ds-atsb-reports', 'ds-ga-bathy', 'ds-csiro-drift'],
    modelOutputs: [],
    status: 'under-evaluation',
    origin: 'published',
  },
  {
    id: 'H-002',
    title: 'Controlled glide beyond the searched width',
    description:
      'The aircraft was piloted at end of flight and glided further from the 7th arc than the searched corridor width.',
    supportingEvidence: ['Possibility discussed in ATSB final report (2017)'],
    contradictingEvidence: ['End-of-flight simulations and debris damage analyses discussed by ATSB/Malaysia SIR'],
    assumptions: ['Human control at fuel exhaustion'],
    confidence: 'unassessed',
    dataDependencies: ['ds-atsb-reports', 'ds-mot-sir', 'ds-ga-bathy'],
    modelOutputs: [],
    status: 'proposed',
    origin: 'published',
  },
]

export const EVIDENCE_AXES = [
  'Satcom BTO consistency',
  'Satcom BFO consistency',
  'Fuel / performance feasibility',
  'Debris drift consistency',
  'Consistent with prior negative search',
] as const
