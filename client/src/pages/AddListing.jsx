import React, { useState, useEffect } from 'react'
import { useApp, ACTIONS } from '../context/AppContext.jsx'
import { useSpoilagePrediction } from '../hooks/useAI.js'
import { Card, CardHeader, CardBody, Button, Input, Select, FieldLabel, Spinner, SpoilageBar } from '../components/ui/index.jsx'
import { spoilageColor } from '../utils/helpers'
import { FOOD_TYPES, STORAGE_CONDITIONS, FOOD_EMOJIS } from '../data/mockData'

const BLANK = { name:'',type:'',source:'',quantity:'',unit:'kg',preparedAt:'',pickupDeadline:'',storage:'',allergens:'',notes:'',distance:'' }

export default function AddListing() {
  const { dispatch, showToast } = useApp()
  const { prediction, loading, predict, reset } = useSpoilagePrediction()
  const [form, setForm]     = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [done, setDone]     = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  useEffect(() => {
    if (form.type || form.storage) {
      predict({ foodType: form.type, storage: form.storage, preparedAt: form.preparedAt, quantity: Number(form.quantity) })
    } else {
      reset()
    }
  }, [form.type, form.storage, form.preparedAt, form.quantity, predict, reset])

  const validate = () => {
    const e = {}
    if (!form.name.trim())                           e.name     = 'Required'
    if (!form.type)                                  e.type     = 'Required'
    if (!form.source.trim())                         e.source   = 'Required'
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = 'Enter a valid quantity'
    if (!form.pickupDeadline)                        e.pickupDeadline = 'Required'
    if (!form.storage)                               e.storage  = 'Required'
    if (!form.distance || Number(form.distance) <= 0) e.distance = 'Required'
    return e
  }

  const submit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    dispatch({
      type: ACTIONS.ADD_LISTING,
      payload: {
        ...form,
        quantity: Number(form.quantity),
        distance: Number(form.distance),
        spoilageRisk: prediction?.risk ?? 40,
        emoji: FOOD_EMOJIS[form.type] ?? '🍽️',
        sourceId: `R${Date.now()}`,
        location: { lat: 23.2599 + (Math.random()-0.5)*0.06, lng: 77.4126 + (Math.random()-0.5)*0.06 },
      },
    })
    showToast(`Listed ${form.quantity}${form.unit} of ${form.name} — NGOs notified!`, 'success')
    setDone(true)
    setTimeout(() => { setForm(BLANK); setDone(false); reset() }, 2800)
  }

  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 360px',gap:16,alignItems:'start',animation:'fade-in 0.25s ease' }}>

      {/* ── Form ── */}
      <Card>
        <CardHeader>
          <div>
            <div style={{ fontSize:15,fontWeight:700,color:'#fff' }}>Add surplus food listing</div>
            <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',marginTop:3 }}>Takes ~60 s · Nearby NGOs notified instantly</div>
          </div>
          <span style={{ fontSize:11,padding:'3px 10px',borderRadius:9999,background:'rgba(34,197,94,0.1)',color:'#4ade80',fontWeight:600 }}>🧠 AI scoring active</span>
        </CardHeader>

        {done ? (
          <div style={{ padding:'5rem 2rem',textAlign:'center' }}>
            <div style={{ fontSize:56,marginBottom:16 }}>✅</div>
            <div style={{ fontSize:20,fontWeight:700,color:'#4ade80' }}>Listing posted!</div>
            <div style={{ fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:8 }}>NGOs within 5 km have been notified</div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <CardBody style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>

                <div>
                  <FieldLabel error={errors.name}>Food name *</FieldLabel>
                  <Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Chicken Biryani" error={errors.name} />
                </div>

                <div>
                  <FieldLabel error={errors.type}>Food type *</FieldLabel>
                  <Select value={form.type} onChange={e=>set('type',e.target.value)} error={errors.type}>
                    <option value="">Select type…</option>
                    {FOOD_TYPES.map(t=><option key={t} value={t}>{FOOD_EMOJIS[t]} {t}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel error={errors.source}>Donor / Source name *</FieldLabel>
                  <Input value={form.source} onChange={e=>set('source',e.target.value)} placeholder="e.g. Spice Route Restaurant" error={errors.source} />
                </div>

                <div>
                  <FieldLabel error={errors.distance}>Distance from you (km) *</FieldLabel>
                  <Input type="number" value={form.distance} onChange={e=>set('distance',e.target.value)} placeholder="1.5" error={errors.distance} />
                </div>

                <div style={{ display:'flex',gap:10 }}>
                  <div style={{ flex:2 }}>
                    <FieldLabel error={errors.quantity}>Quantity *</FieldLabel>
                    <Input type="number" value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="80" error={errors.quantity} />
                  </div>
                  <div style={{ flex:1 }}>
                    <FieldLabel>Unit</FieldLabel>
                    <Select value={form.unit} onChange={e=>set('unit',e.target.value)}>
                      <option value="kg">kg</option>
                      <option value="portions">portions</option>
                      <option value="litres">litres</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <FieldLabel error={errors.storage}>Storage condition *</FieldLabel>
                  <Select value={form.storage} onChange={e=>set('storage',e.target.value)} error={errors.storage}>
                    <option value="">Select condition…</option>
                    {STORAGE_CONDITIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>

                <div>
                  <FieldLabel>Prepared at</FieldLabel>
                  <Input type="time" value={form.preparedAt} onChange={e=>set('preparedAt',e.target.value)} />
                </div>

                <div>
                  <FieldLabel error={errors.pickupDeadline}>Pickup deadline *</FieldLabel>
                  <Input type="time" value={form.pickupDeadline} onChange={e=>set('pickupDeadline',e.target.value)} error={errors.pickupDeadline} />
                </div>

                <div style={{ gridColumn:'1/-1' }}>
                  <FieldLabel>Allergens</FieldLabel>
                  <Input value={form.allergens} onChange={e=>set('allergens',e.target.value)} placeholder="e.g. Nuts, Dairy, Gluten" />
                </div>

              </div>

              <div>
                <FieldLabel>Notes (optional)</FieldLabel>
                <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
                  placeholder="Container details, special handling, volunteers needed…" rows={3}
                  style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'#1a1a1a',color:'#fff',fontSize:13,fontFamily:'inherit',outline:'none',resize:'vertical' }}
                />
                <div style={{ display:'flex',gap:8,marginTop:8 }}>
                  <Button type="button" size="sm" onClick={async ()=>{
                    setAiLoading(true)
                    try {
                      const resp = await fetch('/api/ai/describe', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: form.name || 'Listing',
                          food_type: form.type,
                          storage: form.storage,
                          quantity: Number(form.quantity) || 0,
                          unit: form.unit,
                          prepared_at: form.preparedAt || undefined,
                          pickup_deadline: form.pickupDeadline || undefined,
                          pickup_lat: undefined,
                          pickup_lng: undefined,
                          notes: form.notes || undefined,
                        })
                      })
                      const data = await resp.json()
                      if (resp.ok) {
                        set('notes', data.description)
                        setAiResult(data)
                      }
                    } catch (e) {
                      console.error(e)
                    } finally { setAiLoading(false) }
                  }} style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)' }}>
                    {aiLoading ? 'Generating…' : 'Auto-generate description'}
                  </Button>
                  {aiResult && (
                    <div style={{ fontSize:12,color:'rgba(255,255,255,0.44)',alignSelf:'center' }}>Suggested priority: <strong style={{ color:'#fff' }}>{aiResult.tier}</strong></div>
                  )}
                </div>
              </div>

              <Button type="submit" size="lg" style={{ marginTop:4,background:'linear-gradient(135deg,#16a34a,#15803d)',boxShadow:'0 2px 14px rgba(22,163,74,0.3)',width:'100%' }}>
                📢 Post listing — notify nearby NGOs
              </Button>
            </CardBody>
          </form>
        )}
      </Card>

      {/* ── AI Panel ── */}
      <div style={{ display:'flex',flexDirection:'column',gap:12,position:'sticky',top:72 }}>

        <Card>
          <CardHeader>
            <div style={{ display:'flex',gap:8,alignItems:'center' }}>
              <span style={{ fontSize:20 }}>🧠</span>
              <div>
                <div style={{ fontSize:13,fontWeight:700,color:'#fff' }}>AI Spoilage Prediction</div>
                <div style={{ fontSize:11,color:'rgba(255,255,255,0.32)' }}>Updates as you fill the form</div>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {!form.type && !form.storage ? (
              <div style={{ textAlign:'center',padding:'2rem 1rem',color:'rgba(255,255,255,0.22)',fontSize:13 }}>
                Select food type and storage condition to run prediction
              </div>
            ) : loading ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:12,padding:'2rem' }}>
                <Spinner size={32} />
                <span style={{ fontSize:12,color:'rgba(255,255,255,0.32)' }}>Running model…</span>
              </div>
            ) : prediction ? (
              <>
                {/* Risk gauge */}
                <div style={{ textAlign:'center',marginBottom:16 }}>
                  <div style={{ fontSize:54,fontWeight:800,color:spoilageColor(prediction.risk),lineHeight:1 }}>{prediction.risk}%</div>
                  <div style={{ fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:4 }}>spoilage risk</div>
                  <div style={{ marginTop:12 }}><SpoilageBar risk={prediction.risk} showLabel={false} height={7} /></div>
                </div>

                {/* Feature breakdown */}
                <div style={{ background:'#1a1a1a',borderRadius:9,padding:'10px 12px',marginBottom:12 }}>
                  <div style={{ fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Feature breakdown</div>
                  {[
                    ['Base risk (type × storage)', `+${prediction.features.base}%`],
                    ['Time since preparation',      `+${prediction.features.timeDecay}%`],
                    ['Batch size factor',            `+${prediction.features.batchFactor}%`],
                  ].map(([l,v],i)=>(
                    <div key={i} style={{ display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:4 }}>
                      <span>{l}</span><span style={{ color:'#fff',fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)',paddingTop:6,marginTop:4,display:'flex',justifyContent:'space-between',fontSize:12 }}>
                    <span style={{ color:'rgba(255,255,255,0.35)' }}>Model confidence</span>
                    <span style={{ color:'#4ade80',fontWeight:700 }}>{(prediction.confidence*100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Recommendations */}
                <div style={{ fontSize:11,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',color:'rgba(255,255,255,0.28)',marginBottom:8 }}>Recommendations</div>
                {prediction.tips.map((tip,i)=>(
                  <div key={i} style={{ display:'flex',gap:8,marginBottom:7 }}>
                    <span style={{ color:'#4ade80',fontSize:12,marginTop:1,flexShrink:0 }}>→</span>
                    <span style={{ fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.5 }}>{tip}</span>
                  </div>
                ))}
              </>
            ) : null}
          </CardBody>
        </Card>

        {/* Tech callout */}
        <div style={{ background:'rgba(96,165,250,0.07)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:12,padding:'13px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#60a5fa',marginBottom:5 }}>Transaction isolation</div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',lineHeight:1.65 }}>
            Listings use PostgreSQL <code style={{ background:'rgba(255,255,255,0.07)',padding:'1px 5px',borderRadius:4,fontSize:11 }}>SERIALIZABLE</code> isolation to prevent double-booking. Each accepted listing locks atomically.
          </div>
        </div>

        <div style={{ background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.14)',borderRadius:12,padding:'13px 14px' }}>
          <div style={{ fontSize:12,fontWeight:600,color:'#4ade80',marginBottom:5 }}>How AI scoring works</div>
          <div style={{ fontSize:12,color:'rgba(255,255,255,0.38)',lineHeight:1.65 }}>
            The model uses food type, storage condition, elapsed time, and batch size to estimate spoilage probability. High-risk listings auto-prioritise in the NGO feed and trigger immediate alerts.
          </div>
        </div>
      </div>
    </div>
  )
}
