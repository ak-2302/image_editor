import { initialEffectFields, type InitialEffectKey, type InitialEffectValues } from './effectTypes'

type InitialEffectsAccordionProps = {
  values: InitialEffectValues
  isOpen: boolean
  onToggle: () => void
  onChange: (key: InitialEffectKey, value: number) => void
}

function InitialEffectsAccordion({ values, isOpen, onToggle, onChange }: InitialEffectsAccordionProps) {
  return (
    <div className={`effect_accordion${isOpen ? ' is_open' : ''}`}>
      <button type="button" className="effect_accordion_trigger" aria-expanded={isOpen} onClick={onToggle}>
        <b>初期エフェクト</b><span>{isOpen ? '−' : '＋'}</span>
      </button>
      {isOpen && <div className="initial_effect_fields">{initialEffectFields.map(({ key, label, min, max, unit }) => <label className="range_control" key={key}><span><span>{label}</span><output>{unit}</output></span><input type="number" min={min} max={max} value={values[key]} onChange={(event) => onChange(key, Number(event.target.value))} /></label>)}</div>}
    </div>
  )
}

export default InitialEffectsAccordion
