import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { ClassBadge } from '@/components/ui/badge'

const SECTIONS = [
  ['Observation vs inference', 'An observation is a recorded measurement or physical fact (a satcom log timestamp, a recovered flaperon). An inference is a conclusion derived from observations through a model (the 7th arc, a drift-derived origin region). The platform labels every item with its evidence class so the two are never conflated.'],
  ['Spatial accuracy vs statistical confidence', 'Spatial accuracy describes how precisely a location is known ("locality-level, ~5 km"). Confidence describes how strongly the evidence supports a claim. A debris item can be identified with high confidence while its find location is known only to the nearest town.'],
  ['Treatment of uncertainty', 'Model outputs are shown as distributions or ensembles, never single tracks. Each output records the uncertainty sources it does and does not represent.'],
  ['Data provenance', 'Every record stores source organisation, URL, publication date, acquisition date, processing history and licence. Hand-digitised data must state its digitisation error.'],
  ['Model reproducibility', 'Every run records input dataset versions, parameters, software version, random seed, timestamp, output location and limitations, so any researcher can re-execute it.'],
  ['Independent validation', 'Track A reproduces published results before Track B departs from them. Divergence from a published result is reported with the cause investigated, not assumed.'],
  ['Limitations of historical datasets', 'Released datasets are subsets; some measurements (raw radar, full sonar coverage from private searches) are not public. Absence of data is classified as unknown, never as negative evidence.'],
  ['Risk of confirmation bias', 'Hypotheses are scored against the same evidence axes, assessments cite sources, and the platform does not privilege official or alternative hypotheses.'],
] as const

const RUN_FIELDS = ['input_dataset_versions', 'parameters (jsonb)', 'software_version', 'random_seed', 'executed_at', 'output_uri', 'limitations', 'executed_by']

export default function Methodology() {
  return (
    <div>
      <PageHeader title="Research Methodology" subtitle="Our objective is not to prove where MH370 crashed — it is to test whether modern computational science can improve our understanding of where it may have." />
      <div className="grid grid-cols-[1fr_340px] gap-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          {SECTIONS.map(([t, b]) => <Card key={t}><CardHeader title={t} /><CardBody className="text-xs leading-relaxed text-slate-400">{b}</CardBody></Card>)}
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Evidence classes" />
            <CardBody className="space-y-2">
              {(['verified_observation', 'published_interpretation', 'reconstructed_scenario', 'experimental_model', 'pending'] as const).map((c) => <div key={c}><ClassBadge value={c} /></div>)}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Required model-run record" />
            <CardBody><ul className="space-y-1 mono text-[11px] text-slate-400">{RUN_FIELDS.map((f) => <li key={f}>· {f}</li>)}</ul></CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
