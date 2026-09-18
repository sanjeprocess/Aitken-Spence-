import React, { useEffect, useMemo, useRef, useState } from 'react'
import { meta, sections, consentSectionId } from './content.js'

const allIds = [...sections.map((s) => s.id), consentSectionId]

function Block({ block }) {
  switch (block.type) {
    case 'para':
      return <p className="para">{block.text}</p>
    case 'subhead':
      return (
        <h3 className="subhead">
          <span className="subhead-num">{block.num}</span>
          {block.text}
        </h3>
      )
    case 'note':
      return (
        <div className="note">
          <span className="note-tag">Cross-reference</span>
          <p>{block.text}</p>
        </div>
      )
    case 'list':
      return (
        <ul className="plain-list">
          {block.items.map((it, i) => (
            <li key={i}>
              {it.title ? <strong>{it.title}. </strong> : null}
              {it.text}
            </li>
          ))}
        </ul>
      )
    case 'orderedList':
      return (
        <dl className="clause-list">
          {block.items.map((it, i) => (
            <div className="clause" key={i}>
              <dt>{it.num}</dt>
              <dd>
                {it.title ? <strong>{it.title} — </strong> : null}
                {it.text}
              </dd>
            </div>
          ))}
        </dl>
      )
    case 'restricted-head':
      return (
        <h4 className="restricted-head">
          <span className="restricted-num">{block.num}</span>
          {block.text}
        </h4>
      )
    case 'restricted':
      return (
        <ul className="restricted-list">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )
    case 'classTable':
      return (
        <table className="class-table">
          <thead>
            <tr>
              <th>Classification level</th>
              <th>Handling</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}>
                <td className={`level level-${i}`}>{r.level}</td>
                <td>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    default:
      return null
  }
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function makeReference(empNo) {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = (empNo || 'XXX').replace(/\s+/g, '').slice(-4).toUpperCase()
  return `AUP-${suffix}-${stamp}`
}

function SignaturePad({ label, value, onChange, disabled }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const hasInk = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.strokeStyle = '#1c2530'
    ctx.lineWidth = 2.1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const point = e.touches && e.touches.length ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e) {
    if (disabled) return
    e.preventDefault()
    drawingRef.current = true
    lastPos.current = getPos(e)
  }

  function move(e) {
    if (disabled || !drawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    hasInk.current = true
  }

  function end() {
    if (disabled || !drawingRef.current) return
    drawingRef.current = false
    if (hasInk.current) onChange(canvasRef.current.toDataURL('image/png'))
  }

  function clear() {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio)
    hasInk.current = false
    onChange('')
  }

  return (
    <div className={`sig-pad ${disabled ? 'is-disabled' : ''}`}>
      <div className="sig-pad-head">
        <span>{label}</span>
        <button type="button" className="sig-clear" onClick={clear} disabled={disabled || !value}>
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="sig-canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      {!value && <span className="sig-hint">Sign with mouse, stylus, or finger</span>}
    </div>
  )
}

function ConsentSection({ allRead, onSubmit, submitted, record }) {
  const [name, setName] = useState('')
  const [empNo, setEmpNo] = useState('')
  const [supervisorName, setSupervisorName] = useState('')
  const [date, setDate] = useState(todayISO)
  const [agree, setAgree] = useState(false)
  const [employeeSig, setEmployeeSig] = useState('')
  const [supervisorSig, setSupervisorSig] = useState('')

  const missing = []
  if (!name.trim()) missing.push('name')
  if (!empNo.trim()) missing.push('employee number')
  if (!supervisorName.trim()) missing.push("supervisor's name")
  if (!date) missing.push('date')
  if (!employeeSig) missing.push('your signature')
  if (!supervisorSig) missing.push("supervisor's signature")
  if (!agree) missing.push('agreement checkbox')

  const canSubmit = allRead && missing.length === 0

  function handlePrint() {
    window.print()
  }

  return (
    <section id={consentSectionId} className="section consent-section">
      <div className="section-head">
        <span className="section-num">10</span>
        <h2>Acceptable Use Policy Consent Form</h2>
      </div>

      {!allRead && (
        <div className="gate-notice">
          <span className="gate-dot" />
          Review sections 1–9 in the index before the consent form unlocks.
        </div>
      )}

      <p className="para">
        I have read this policy and agree to comply with all its terms and conditions.
      </p>

      {!submitted ? (
        <form
          className={`consent-form ${allRead ? '' : 'is-locked'}`}
          onSubmit={(e) => {
            e.preventDefault()
            if (!canSubmit) return
            onSubmit({
              name: name.trim(),
              empNo: empNo.trim(),
              supervisorName: supervisorName.trim(),
              date,
              employeeSig,
              supervisorSig,
              reference: makeReference(empNo),
              timestamp: new Date().toISOString(),
            })
          }}
        >
          <fieldset disabled={!allRead}>
            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="As per employee record" />
              </label>
              <label className="field">
                <span>Emp. No.</span>
                <input value={empNo} onChange={(e) => setEmpNo(e.target.value)} placeholder="e.g. AS-04213" />
              </label>
            </div>

            <SignaturePad label="Signature" value={employeeSig} onChange={setEmployeeSig} disabled={!allRead} />

            <div className="field-grid">
              <label className="field">
                <span>Supervisor's Name</span>
                <input
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Reporting supervisor"
                />
              </label>
              <label className="field">
                <span>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
            </div>

            <SignaturePad
              label="Supervisor's Signature"
              value={supervisorSig}
              onChange={setSupervisorSig}
              disabled={!allRead}
            />

            <label className="check-field">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>I have read and agree to comply with ISMS U02 — Acceptable Usage Policy, {meta.version}.</span>
            </label>
          </fieldset>

          <div className="submit-row">
            <button className="submit-btn" type="submit" disabled={!canSubmit}>
              Record consent
            </button>
            {allRead && missing.length > 0 && (
              <span className="submit-hint">Still needed: {missing.join(', ')}</span>
            )}
          </div>
        </form>
      ) : (
        <div className="certificate">
          <div className="certificate-head">
            <div>
              <span className="cert-tag">Acknowledged</span>
              <h3>Consent recorded</h3>
            </div>
            <div className="cert-ref">
              <span>Reference</span>
              <strong>{record.reference}</strong>
            </div>
          </div>

          <div className="cert-grid">
            <div className="cert-row">
              <span>Name</span>
              <strong>{record.name}</strong>
            </div>
            <div className="cert-row">
              <span>Emp. No.</span>
              <strong>{record.empNo}</strong>
            </div>
            <div className="cert-row">
              <span>Signature</span>
              {record.employeeSig ? <img src={record.employeeSig} alt="Employee signature" /> : <em>—</em>}
            </div>
            <div className="cert-row">
              <span>Supervisor's Name</span>
              <strong>{record.supervisorName}</strong>
            </div>
            <div className="cert-row">
              <span>Supervisor's Signature</span>
              {record.supervisorSig ? <img src={record.supervisorSig} alt="Supervisor signature" /> : <em>—</em>}
            </div>
            <div className="cert-row">
              <span>Date</span>
              <strong>{formatDisplayDate(record.date)}</strong>
            </div>
          </div>

          <p className="cert-footnote">
            Recorded against {meta.docId} {meta.version} at {new Date(record.timestamp).toLocaleString()}. This is a
            local, in-browser acknowledgement only — no data leaves this page unless printed or exported.
          </p>

          <button type="button" className="print-btn" onClick={handlePrint}>
            Print / Save as PDF
          </button>
        </div>
      )}
    </section>
  )
}

export default function App() {
  const [activeId, setActiveId] = useState(sections[0].id)
  const [visited, setVisited] = useState(() => new Set([sections[0].id]))
  const [submitted, setSubmitted] = useState(false)
  const [record, setRecord] = useState(null)
  const sectionRefs = useRef({})

  const allMainRead = sections.every((s) => visited.has(s.id))

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            setActiveId(id)
            setVisited((prev) => {
              if (prev.has(id)) return prev
              const next = new Set(prev)
              next.add(id)
              return next
            })
          }
        })
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    )
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const progress = useMemo(() => {
    const readCount = sections.filter((s) => visited.has(s.id)).length
    return Math.round((readCount / sections.length) * 100)
  }, [visited])

  function scrollTo(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="shell">
      <aside className="binder">
        <div className="binder-plate">
          <div className="brand-plate">
            <img src="/aitken-logo.jpg" alt={meta.org} />
          </div>
          <span className="plate-id">{meta.docId}</span>
          <h1>{meta.title}</h1>
          <div className="plate-meta">
            <span>{meta.org}</span>
            <span>{meta.version}</span>
          </div>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-label">{progress}% reviewed</div>

        <nav className="tabs">
          {sections.map((s) => (
            <button
              key={s.id}
              className={`tab ${activeId === s.id ? 'is-active' : ''} ${visited.has(s.id) ? 'is-visited' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              <span className="tab-num">{s.num.padStart(2, '0')}</span>
              <span className="tab-title">{s.title}</span>
              {visited.has(s.id) && <span className="tab-check">✓</span>}
            </button>
          ))}
          <button
            className={`tab tab-consent ${activeId === consentSectionId ? 'is-active' : ''}`}
            onClick={() => scrollTo(consentSectionId)}
          >
            <span className="tab-num">10</span>
            <span className="tab-title">Consent Form</span>
            {!allMainRead && <span className="tab-lock">🔒</span>}
          </button>
        </nav>

        <div className="binder-footer">
          Issued under authority of the ISMS Steering Committee. Property of {meta.org}.
        </div>
      </aside>

      <main className="page">
        <header className="page-banner">
          <p>
            This document is issued under the authority of the ISMS steering committee and is a property of
            Aitken Spence PLC. Any unauthorized reproduction or distribution of this document is strictly
            prohibited.
          </p>
        </header>

        {sections.map((s) => (
          <section
            key={s.id}
            id={s.id}
            ref={(el) => (sectionRefs.current[s.id] = el)}
            className="section"
          >
            <div className="section-head">
              <span className="section-num">{s.num}</span>
              <h2>{s.title}</h2>
            </div>
            {s.blocks.map((b, i) => (
              <Block block={b} key={i} />
            ))}
          </section>
        ))}

        <div ref={(el) => (sectionRefs.current[consentSectionId] = el)}>
          <ConsentSection
            allRead={allMainRead}
            submitted={submitted}
            record={record}
            onSubmit={(data) => {
              setRecord(data)
              setSubmitted(true)
            }}
          />
        </div>
      </main>
    </div>
  )
}
