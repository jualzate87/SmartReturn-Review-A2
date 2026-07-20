import { useState } from 'react'
import YoYDetailPane from './YoYDetailPane'
import { Close, Plus, ChevronDown, ChevronRight, Document, CircleCheck } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Badge } from '@cgds/badge'
import '@cgds/badge/dist/index.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import sendArrow from '../../assets/send-arrow.svg'
import styles from '../../styles/data-review/AgentReportPane.module.css'

const TOTAL_REVIEW_ITEMS = 8

interface AgentReportPaneProps {
  onClose?: () => void
  onYoyToggle?: (expanded: boolean) => void
  /** Called with the current subview name before navigating away to sources */
  onViewW2?: (fromSubView?: 'overview' | 'yoyDetail') => void
  onReviewSource?: () => void
  onMarkReviewed?: (fieldName: string) => void
  reviewedFields?: Set<string>
  closing?: boolean
  /** If set, the pane will open directly to this subview (used for back-to-exact-state) */
  initialSubView?: 'overview' | 'yoyDetail'
  /** Called when subview changes — e.g. overview ↔ yoyDetail */
  onSubViewChange?: (subView: 'overview' | 'yoyDetail') => void
  /** When true: hides header and suppresses slide-in animation (rendered inside AgentLoadingPane body) */
  embedded?: boolean
}

// Report card icons from Figma — imgReport, imgReport1, imgReport2, imgReport3
const REPORT_CARDS = [
  { label: 'YoY analysis',          badgeCount: 1, badgeColor: 'red'  as const, position: 'first' },
  { label: 'Scan quality & inputs', badgeCount: 1, badgeColor: 'red'  as const, position: 'middle' },
  { label: 'IRS Compliance',        badgeCount: 1, badgeColor: 'red'  as const, position: 'middle' },
  { label: 'Credits & deductions',  badgeCount: 2, badgeColor: 'blue' as const, position: 'last' },
]

// Suggestion chips — content derived from the 1040 form on the left
const CHIPS = [
  'Why did wages increase from last year?',
  'Is Jordan eligible for any credits?',
  'Explain the IRS compliance issue',
]

// Figma asset icons (exact matches from Figma design node 29113:62676)
const imgViewSources = 'https://www.figma.com/api/mcp/asset/8a1a6892-eb92-449b-9b09-404ef1adce23'
const imgAutoFill    = 'https://www.figma.com/api/mcp/asset/bf8c2ff8-a1ed-4b44-b4e6-e9eeaf4a5353'
const imgYoY         = 'https://www.figma.com/api/mcp/asset/3cf68bcc-c790-44c0-90e8-cf559f600dbf'
const imgScanner     = 'https://www.figma.com/api/mcp/asset/428263f5-cebe-4316-a7a7-0115d1b38186'
const imgFedTaxes    = 'https://www.figma.com/api/mcp/asset/f2c52cb3-da41-4090-a976-38f15c4dda86'
const imgTaxCredits  = 'https://www.figma.com/api/mcp/asset/6160fe4d-e0fc-46b4-b151-d4ac7dbf5c9b'

const CARD_ICONS = [
  <img src={imgYoY}        alt="" width={20} height={20} />,
  <img src={imgScanner}    alt="" width={20} height={20} />,
  <img src={imgFedTaxes}   alt="" width={20} height={20} />,
  <img src={imgTaxCredits} alt="" width={20} height={20} />,
]


export default function AgentReportPane({ onClose, onYoyToggle, onViewW2, onReviewSource, onMarkReviewed, reviewedFields = new Set(), closing = false, initialSubView, onSubViewChange, embedded = false }: AgentReportPaneProps) {
  const reviewedCount = reviewedFields.size
  const progressPct = Math.round((reviewedCount / TOTAL_REVIEW_ITEMS) * 100)
  const [inputValue, setInputValue] = useState('')
  const [yoyExpanded, setYoyExpanded] = useState(initialSubView === 'yoyDetail' ? true : false)
  const [importedDocsExpanded, setImportedDocsExpanded] = useState(false)
  const [yoyDetailOpen, setYoyDetailOpen] = useState(initialSubView === 'yoyDetail')
  const [yoyDetailClosing, setYoyDetailClosing] = useState(false)

  const handleOpenYoyDetail = () => {
    setYoyDetailOpen(true)
    onSubViewChange?.('yoyDetail')
  }
  const handleCloseYoyDetail = () => {
    setYoyDetailClosing(true)
    onSubViewChange?.('overview')
    setTimeout(() => { setYoyDetailOpen(false); setYoyDetailClosing(false) }, 200)
  }

  const handleYoyClick = () => {
    const next = !yoyExpanded
    setYoyExpanded(next)
    onYoyToggle?.(next)
  }

  return (
    <div className={`${embedded ? styles.panelEmbedded : styles.panel} ${closing && !embedded ? styles.panelClosing : ''}`}>

      {/* ── Header — hidden when embedded inside AgentLoadingPane ── */}
      {!embedded && (
        <div className={styles.header}>
          <div className={styles.headerLeft} />

          <div className={styles.headerTitle}>
            <img src={intuitAssistIcon} alt="" className={styles.assistIcon} />
            <span className={styles.titleText}>Tax Prep Agent</span>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.iconBtn} aria-label="Close" onClick={onClose}>
              <Close size="small" />
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable pane ── */}
      <div className={styles.pane}>
        <div className={styles.chat}>

          {/* Agent message */}
          <p className={styles.agentMessage}>
            Here's a summary of imported documents and issues found.
          </p>

          {/* Imported Documents card */}
          <div className={styles.importedDocsCard}>
            <button
              className={styles.importedDocsHeader}
              onClick={() => setImportedDocsExpanded(v => !v)}
              aria-expanded={importedDocsExpanded}
            >
              <img src={imgAutoFill} alt="" width={20} height={20} />
              <div className={styles.importedDocsContent}>
                <span className={styles.importedDocsLabel}>Imported documents</span>
                <Badge status="info" shape="rect">4</Badge>
              </div>
              <ChevronDown size="small" className={importedDocsExpanded ? styles.chevronUp : styles.chevron} />
            </button>

            {importedDocsExpanded && (
              <div className={styles.docList}>
                {/* Column headers */}
                <div className={styles.docTableHeader}>
                  <span className={styles.docColDocument}>Document</span>
                  <span className={styles.docColConfidence}>
                    Confidence
                    <span className={styles.docConfidenceInfo} title="OCR scan confidence score">ⓘ</span>
                  </span>
                </div>

                {/* W2-Bing.pdf — 72% low confidence */}
                <button className={styles.docRow} onClick={onViewW2}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}>
                      <Document size="medium" />
                    </div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>W2-Bing.pdf</span>
                      <span className={styles.docSub}>W-2 · 2 pages</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="low">72%</span>
                </button>

                {/* W2-Techcircle — 96% high confidence */}
                <button className={styles.docRow} onClick={onViewW2}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}>
                      <Document size="medium" />
                    </div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>W2-Techcircle</span>
                      <span className={styles.docSub}>W-2 · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">96%</span>
                </button>

                {/* Form1099-DIV — 94% high confidence */}
                <button className={styles.docRow}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}>
                      <Document size="medium" />
                    </div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>Form1099-DIV</span>
                      <span className={styles.docSub}>1099-DIV · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">94%</span>
                </button>

                {/* Form1099-INT — 91% high confidence */}
                <button className={styles.docRow}>
                  <div className={styles.docRowLeft}>
                    <div className={styles.docFileIcon}>
                      <Document size="medium" />
                    </div>
                    <div className={styles.docMeta}>
                      <span className={styles.docName}>Form1099-INT</span>
                      <span className={styles.docSub}>1099-INT · 1 page</span>
                    </div>
                  </div>
                  <span className={styles.confidenceBadge} data-level="high">91%</span>
                </button>
              </div>
            )}
          </div>

          {/* Items to review scorecard */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreTopRow}>
              <span className={styles.scoreTitle}>Items to review</span>
              <span className={styles.scoreRemaining}>
                <strong>{TOTAL_REVIEW_ITEMS - reviewedCount}</strong> of {TOTAL_REVIEW_ITEMS} remaining
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct || 5}%`, background: '#00856d', transition: 'width 400ms ease' }} />
            </div>
          </div>

          {/* Expandable report card bundle */}
          <div className={styles.cardBundle}>
            {REPORT_CARDS.map((card, i) => (
              <div key={card.label}>
                <button
                  className={`${styles.card} ${styles[`card_${card.position}`]} ${card.label === 'YoY analysis' && yoyExpanded ? styles.cardActive : ''}`}
                  onClick={card.label === 'YoY analysis' ? handleYoyClick : undefined}
                >
                  <div className={styles.cardIcon}>{CARD_ICONS[i]}</div>
                  <div className={styles.cardContent}>
                    <span className={styles.cardLabel}>{card.label}</span>
                    <span className={`${styles.badge} ${card.badgeColor === 'red' ? styles.badgeRed : styles.badgeBlue}`}>
                      {card.badgeCount}
                    </span>
                  </div>
                  <ChevronDown size="small" className={`${styles.chevron} ${card.label === 'YoY analysis' && yoyExpanded ? styles.chevronUp : ''}`} />
                </button>

                {/* YoY finding — shown when expanded */}
                {card.label === 'YoY analysis' && yoyExpanded && (() => {
                  const isWagesReviewed = reviewedFields.has('wages')
                  return (
                    <div className={styles.findingCard}>
                      <div className={`${styles.findingInner} ${isWagesReviewed ? styles.findingInnerReviewed : ''}`}>
                        <div className={styles.findingTitleRow}>
                          {isWagesReviewed
                            ? <span className={styles.findingCheckIcon}><CircleCheck size="small" /></span>
                            : <span className={styles.findingDot} />
                          }
                          <span className={styles.findingTitle}>Significant income drop</span>
                          {isWagesReviewed && (
                            <span className={styles.findingReviewedBadge}>Reviewed</span>
                          )}
                        </div>
                        <p className={styles.findingBody}>
                          Wages dropped by $21.5k (-15%) vs Prior Year.
                        </p>
                        <div className={styles.findingActions}>
                          <button className={styles.viewSourcesBtn} onClick={() => onViewW2?.('overview')}>
                            <img src={imgViewSources} alt="" width={16} height={16} />
                            View sources
                          </button>
                          <Button priority="tertiary" size="small" onClick={handleOpenYoyDetail}>More info <ChevronRight size="small" /></Button>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>

          {/* Start guided review */}
          <div className={styles.guidedReviewRow}>
            <Button priority="primary">Start guided review <ChevronRight size="small" /></Button>
          </div>

        </div>
      </div>

      {/* ── Input area ── */}
      <div className={styles.inputArea}>
        <div className={styles.inputFade} />
        <div className={styles.inputBox}>
          <div className={styles.inputTextField}>
            <textarea
              className={styles.textarea}
              placeholder="Ask anything"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) e.preventDefault() }}
              rows={1}
            />
          </div>
          <div className={styles.inputActions}>
            <div className={styles.inputActionsLeft}>
              <button className={styles.attachBtn} aria-label="Attach">
                <Plus size="medium" />
              </button>
            </div>
            <div className={styles.inputActionsRight}>
              <button
                className={`${styles.sendBtn} ${inputValue.trim() ? styles.sendBtnActive : ''}`}
                aria-label="Send"
              >
                <img src={sendArrow} alt="" className={styles.sendIcon} />
              </button>
            </div>
          </div>
        </div>
        <span className={styles.legal}>Important information about how we use generative AI</span>
      </div>

      {/* YoY detail pane — overlays from right */}
      {(yoyDetailOpen || yoyDetailClosing) && (
        <YoYDetailPane
          closing={yoyDetailClosing}
          onClose={() => { handleCloseYoyDetail(); onClose?.() }}
          onBack={handleCloseYoyDetail}
          onViewW2={() => onViewW2?.('yoyDetail')}
          onReviewSource={onReviewSource ? () => { handleCloseYoyDetail(); onReviewSource() } : undefined}
          onMarkReviewed={onMarkReviewed}
          reviewedCount={reviewedCount}
          totalItems={TOTAL_REVIEW_ITEMS}
          reviewedFields={reviewedFields}
        />
      )}

    </div>
  )
}
