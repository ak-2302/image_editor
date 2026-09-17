import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { initialEffectFields, type InitialEffectKey, type InitialEffectValues } from './effectTypes'

type InitialEffectsAccordionProps = {
  values: InitialEffectValues
  isOpen: boolean
  onToggle: () => void
  onChange: (key: InitialEffectKey, value: number) => void
}

function InitialEffectsAccordion({ values, isOpen, onToggle, onChange }: InitialEffectsAccordionProps) {
  const draggingRef = useRef<{ key: InitialEffectKey; startX: number; startValue: number; min: number; max: number } | null>(null)
  const draggedRef = useRef(false)

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, key: InitialEffectKey, min: number, max: number) => {
    draggingRef.current = { key, startX: event.clientX, startValue: values[key], min, max }
    draggedRef.current = false
    document.body.classList.add('is_dragging_value')
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const drag = draggingRef.current
      if (!drag) return
      if (Math.abs(moveEvent.clientX - drag.startX) > 2) draggedRef.current = true
      const nextValue = Math.min(drag.max, Math.max(drag.min, Math.round(drag.startValue + (moveEvent.clientX - drag.startX) / 2)))
      onChange(drag.key, nextValue)
    }
    const handlePointerUp = () => {
      draggingRef.current = null
      document.body.classList.remove('is_dragging_value')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div className={`effect_accordion${isOpen ? ' is_open' : ''}`}>
      <button type="button" className="effect_accordion_trigger" aria-expanded={isOpen} onClick={onToggle}>
        <b>初期エフェクト</b><span>{isOpen ? '−' : '＋'}</span>
      </button>
      {isOpen && <div className="initial_effect_fields">{initialEffectFields.map(({ key, label, min, max, unit, initial }) => <div className="initial_effect_row" key={key} onPointerDown={(event) => handlePointerDown(event, key, min, max)} onClick={(event) => { if (draggedRef.current) { event.preventDefault(); event.stopPropagation(); draggedRef.current = false } }}><label htmlFor={`initial_${key}`}>{label}</label><input id={`initial_${key}`} type="number" min={min} max={max} value={values[key]} onChange={(event) => onChange(key, Number(event.target.value))} /><span className="effect_unit">{unit}</span><button type="button" className="reset_effect_button" onClick={() => onChange(key, initial)}>初期値にリセット</button></div>)}</div>}
    </div>
  )
}

export default InitialEffectsAccordion
