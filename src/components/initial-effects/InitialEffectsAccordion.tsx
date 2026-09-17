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
      {isOpen && <div className="initial_effect_fields">{initialEffectFields.map(({ key, label, min, max, unit, initial }) => <div className="initial_effect_row" key={key}><label htmlFor={`initial_${key}`}>{label}</label><input id={`initial_${key}`} type="number" min={min} max={max} value={values[key]} onChange={(event) => onChange(key, Number(event.target.value))} /><span className="effect_unit">{unit}</span><button type="button" className="reset_effect_button" onClick={() => onChange(key, initial)}>初期値にリセット</button></div>)}</div>}
    </div>
  )
}

export default InitialEffectsAccordion
