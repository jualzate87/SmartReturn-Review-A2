import { useState, useCallback, useRef, useEffect } from 'react'
import { DotsSix, Panel, ChevronLeft, ChevronRight, Comment, Close } from '@design-systems/icons'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import NotesPane from './data-review/NotesPane'
import type { Note } from './data-review/NotesPane'
import LeftPanel1040 from './data-review/LeftPanel1040'
import ReviewTab from './data-review/ReviewTab'
import DocumentPreview from './data-review/DocumentPreview'
import Int1099FormPreview from './data-review/Int1099FormPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS, intVerifiedDocKey } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS, divVerifiedDocKey } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import {
  buildTabVerifiedKeys,
  buildTypeReviewed,
  getNextUnreviewedSourceDoc,
  getUnreviewedSourceDocs,
  isDocReviewed,
} from './data-review/docReviewStatus'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import QuestionnaireResponsesPanel from './data-review/QuestionnaireResponsesPanel'
import Phase1Banner from './data-review/Phase1Banner'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import type { OutputFormId } from './data-review/outputForms'
import CoachTip, { markCoachTipShown, readCoachTipShown, type CoachTipId } from './data-review/CoachTip'
import {
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForW2Payer,
  field1040ToDetail,
  get1040HighlightField,
  getTabFlagCounts,
  getTabInitialFlagCounts,
  getInitialW2PayerFlagCount,
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import { computeLiveReturn } from '../data/liveReturn'
import { navigationForSourceDoc } from '../data/sourceDocuments'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import styles from '../styles/data-review/DataReviewPage.module.css'
import dragStyles from '../styles/data-review/DragHandle.module.css'

function VerticalGripIcon() {
  return (
    <svg width="4" height="20" viewBox="0 0 4 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2" cy="4"  r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="10" r="1.5" fill="#93A3AB"/>
      <circle cx="2" cy="16" r="1.5" fill="#93A3AB"/>
    </svg>
  )
}

/** Source-doc panel slide timing — matches --duration-appear/disappear-emphasize-fast */
const SOURCE_PANEL_ENTER_MS = 500
const SOURCE_PANEL_EXIT_MS = 500
/** Summary show/hide — matches --duration-transform-emphasize-fast */
const SUMMARY_TOGGLE_MS = 500
/** Collapsed "Show Summary" edge tab width */
const SHOW_SUMMARY_HANDLE_WIDTH = 44
/** Hard floor for Summary so Return Breakdown labels aren’t truncated. */
const LEFT_PANEL_MIN_WIDTH = 795.7
/** Absolute min Sources width when both panels are open */
const RIGHT_PANEL_MIN_WIDTH = 360
/** Matches DragHandle.module.css .handleVertical width */
const PANEL_DRAG_HANDLE_WIDTH = 16

const OUTPUT_FORMS_NUDGE_KEY = 'protoa2-output-forms-nudge'

export default function DataReviewPage() {
  // Source-doc review state — flags, reviewed fields, active tab, editable field
  // values — is shared live with the pop-out window via BroadcastChannel so the
  // two views never drift apart. See useSyncedReviewState for the sync mechanism.
  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    amounts, updateAmounts,
    fieldValues, updateFieldValue,
    reviewedFields,
    editedFields,
    markEdited,
    fieldOverrides,
    setFieldOverride,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    verifiedDocsMeta,
    toggleVerifiedDoc,
    summaryCheckedFields,
    summaryCheckedMeta,
    toggleSummaryChecked,
    summaryFlaggedFields,
    summaryFlaggedMeta,
    toggleSummaryFlagged,
    summaryFlagNotes,
    summaryFlagActivity,
    setSummaryFlagNote,
    editedFieldsMeta,
  } = useSyncedReviewState()
  const liveTotals = computeLiveReturn(amounts)
  const total1a = liveTotals.wages
  const totalWithholding = liveTotals.totalWithholding
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)
  // Right panel width in px (default ~65% viewport once imports start)
  const [rightPanelWidth, setRightPanelWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.65) : 920,
  )
  // Body width for Sources-panel share of the row (drives auto side-by-side).
  const [bodyWidth, setBodyWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1400,
  )
  // Suppress panel width CSS transitions while the user is dragging a resize handle
  const [panelResizing, setPanelResizing] = useState(false)
  // Top/bottom section height ratio in right panel (0-100, where value = preview percentage)
  const [previewHeight, setPreviewHeight] = useState(40)
  // Whether the right document panel is visible — hidden until "Start reviewing imports"
  const [rightPanelVisible, setRightPanelVisible] = useState(false)
  // Whether the right panel is animating out (slide-out before display:none)
  const [rightPanelExiting, setRightPanelExiting] = useState(false)
  // Right panel animating-in so enter CSS fires after show
  const [rightPanelAnimating, setRightPanelAnimating] = useState(false)
  // Notes / comments
  const [notes, setNotes] = useState<Note[]>([])
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesClosing, setNotesClosing] = useState(false)

  // ProtoA2: import review only (no Phase 2 / welcome / AI diagnostics)
  const phase = 'import' as const
  // Summary visible by default; sources hidden until Start reviewing imports
  const [show1040, setShow1040] = useState(true)
  const [outputFormId, setOutputFormId] = useState<OutputFormId>('summary')
  const [importsStarted, setImportsStarted] = useState(false)
  const [outputFormsNudgeOpen, setOutputFormsNudgeOpen] = useState(false)
  /** First-run coach tip: hide summary */
  const [coachTip, setCoachTip] = useState<CoachTipId | null>(null)
  /** Explicit left-panel px width during Summary collapse/expand (null = natural flex). */
  const [leftAnimWidth, setLeftAnimWidth] = useState<number | null>(null)
  /** Keep doc|Details side-by-side during Summary toggle so flexDirection doesn't flip mid-motion. */
  const [freezePreviewSideBySide, setFreezePreviewSideBySide] = useState(false)

  // ProtoA2: no import field flags — tab badges stay at zero; docs drive progress.
  const tabFlagCounts = getTabFlagCounts(reviewedFields)
  const tabInitialFlagCounts = getTabInitialFlagCounts()
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, reviewedFields)])
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, reviewedFields)])
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, reviewedFields)])
  ) as Record<W2Employer, number>
  const tabVerifiedKeys = buildTabVerifiedKeys()
  const typeReviewed = buildTypeReviewed({
    verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  const unreviewedSourceDocs = getUnreviewedSourceDocs({
    verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })
  const unreviewedDocCount = unreviewedSourceDocs.length
  const phase1FullyComplete = unreviewedDocCount === 0
  // ---------------------------------------------------------------------------

  const bodyRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  /** Split container for document preview ↔ Details (not the whole right panel). */
  const splitPaneRef = useRef<HTMLDivElement>(null)
  /** Right-panel width to restore when Show Summary expands again. */
  const preCollapseRightWidthRef = useRef<number | null>(null)
  const summaryToggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)
  }, [])

  const ensureSourcePanelVisible = useCallback(() => {
    if (!rightPanelVisible) {
      setRightPanelVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setRightPanelAnimating(true)
        setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
      }))
    }
  }, [rightPanelVisible])

  /** Hide the imported-documents panel with the same slide-out used by the toolbar toggle */
  const handleCloseSourcePanel = useCallback(() => {
    if (!rightPanelVisible || rightPanelExiting) return
    setRightPanelExiting(true)
    setTimeout(() => {
      setRightPanelExiting(false)
      setRightPanelVisible(false)
    }, SOURCE_PANEL_EXIT_MS)
  }, [rightPanelVisible, rightPanelExiting])

  const startReviewingImports = useCallback(() => {
    setImportsStarted(true)
    // Keep Summary visible so the Hide Summary coach tip can teach the control
    setShow1040(true)
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    setBodyWidth(bodyW)
    // ~65% of body for Sources; Details stays full-width of Sources while
    // Summary is open (stacked). Clamp so Summary stays ≥ LEFT_PANEL_MIN_WIDTH.
    const preferred = Math.round(bodyW * 0.65)
    const maxRight = Math.max(0, bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH)
    const floor = Math.min(RIGHT_PANEL_MIN_WIDTH, maxRight)
    setRightPanelWidth(Math.max(floor, Math.min(preferred, maxRight)))
    setRightPanelVisible(true)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setRightPanelAnimating(true)
      setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
    }))
  }, [])

  const dismissCoachTip = useCallback((id: CoachTipId) => {
    markCoachTipShown(id)
    setCoachTip(null)
  }, [])

  // Sequence hide-summary coach tip once sources are open
  useEffect(() => {
    if (phase !== 'import' || !importsStarted || !rightPanelVisible) return
    if (!readCoachTipShown('hideSummary') && show1040) {
      setCoachTip('hideSummary')
    }
  }, [phase, importsStarted, rightPanelVisible, show1040])

  // One-shot nudge to review output forms after import review is fully complete
  useEffect(() => {
    if (!phase1FullyComplete) return
    if (sessionStorage.getItem(OUTPUT_FORMS_NUDGE_KEY)) return
    setOutputFormsNudgeOpen(true)
  }, [phase1FullyComplete])

  const dismissOutputFormsNudge = useCallback(() => {
    sessionStorage.setItem(OUTPUT_FORMS_NUDGE_KEY, '1')
    setOutputFormsNudgeOpen(false)
  }, [])

  // If Hide Summary collapses while its tip is open, advance the sequence
  useEffect(() => {
    if (!show1040 && coachTip === 'hideSummary') {
      dismissCoachTip('hideSummary')
    }
  }, [show1040, coachTip, dismissCoachTip])

  const issueField = null
  const highlightMode: 'orange' | 'blue' = 'blue'

  const applyVerifyNavigation = useCallback((field: string) => {
    const nav = navigationForDetailField(field)
    if (nav) {
      setActiveTopTab(nav.tab)
      if (nav.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav.intPayer) setActiveIntPayer(nav.intPayer)
    }
    setSelectedField(field)
    if (!importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
  }, [
    setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField,
    importsStarted, startReviewingImports, ensureSourcePanelVisible,
  ])

  const handleReviewNextDocument = useCallback(() => {
    if (!importsStarted) startReviewingImports()
    else ensureSourcePanelVisible()
    const next = getNextUnreviewedSourceDoc(unreviewedSourceDocs, {
      tab: activeTopTab,
      w2SubTab: activeSubTab,
      divPayer: activeDivPayer,
      intPayer: activeIntPayer,
    })
    if (!next) return
    setActiveTopTab(next.tab)
    if (next.w2SubTab) setActiveSubTab(next.w2SubTab)
    if (next.divPayer) setActiveDivPayer(next.divPayer)
    if (next.intPayer) setActiveIntPayer(next.intPayer)
    setSelectedField(null)
  }, [
    importsStarted, startReviewingImports, ensureSourcePanelVisible,
    unreviewedSourceDocs, activeTopTab, activeSubTab, activeDivPayer, activeIntPayer,
    setActiveTopTab, setActiveSubTab, setActiveDivPayer, setActiveIntPayer, setSelectedField,
  ])

  const handleFieldSelect = useCallback((field: string | null) => {
    setSelectedField(field)
    if (phase === 'import' && field) {
      if (!importsStarted) startReviewingImports()
      else ensureSourcePanelVisible()
    }
  }, [phase, setSelectedField, importsStarted, startReviewingImports, ensureSourcePanelVisible])

  const handleNavigateToSourceDoc = useCallback((docId: string) => {
    const nav = navigationForSourceDoc(docId)
    if (!nav) return
    setActiveTopTab(nav.tab)
    if (nav.subTab) setActiveSubTab(nav.subTab)
    if (nav.divPayer) setActiveDivPayer(nav.divPayer)
    if (nav.intPayer) setActiveIntPayer(nav.intPayer)

    if (!importsStarted) {
      startReviewingImports()
    } else {
      ensureSourcePanelVisible()
    }
  }, [
    importsStarted,
    startReviewingImports,
    ensureSourcePanelVisible,
    setActiveTopTab,
    setActiveSubTab,
    setActiveDivPayer,
    setActiveIntPayer,
  ])

  /** From FieldPopover source row — jump to doc + highlight the matching detail field. */
  const handleNavigateSource = useCallback((source: {
    docId: string
    detailFieldId: string
    label: string
  }) => {
    handleNavigateToSourceDoc(source.docId)
    setSelectedField(source.detailFieldId)
  }, [handleNavigateToSourceDoc, setSelectedField])

  const handle1040FieldClick = useCallback((field1040: string | null) => {
    if (!field1040) {
      setSelectedField(null)
      return
    }
    const mapped = field1040ToDetail(field1040)
    if (mapped) {
      applyVerifyNavigation(mapped.field)
    } else {
      setSelectedField(field1040)
    }
  }, [applyVerifyNavigation, setSelectedField])

  const highlightField1040 = get1040HighlightField(selectedField)

  const sourceDocPreview = getSourceDocPreview({
    activeTopTab,
    activeSubTab,
    activeIntPayer,
    activeDivPayer,
    prior1040Images: [img1040PriorPage1, img1040PriorPage2],
  })

  // Reset field selection on mount
  useEffect(() => {
    setSelectedField(null)
  }, [])


  const PREPARER_NAME = 'Sara Chen'

  const handleOpenNotes = () => setNotesOpen(true)
  const handleCloseNotes = () => {
    setNotesClosing(true)
    setTimeout(() => { setNotesOpen(false); setNotesClosing(false) }, 200)
  }
  const formatNoteAt = () =>
    new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  const handleAddNote = (text: string, context?: string) => {
    setNotes(prev => [...prev, { id: `note-${Date.now()}`, text, author: PREPARER_NAME, at: formatNoteAt(), context }])
    setNotesOpen(true)
  }

  const handleEditNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text, at: formatNoteAt() } : n))
  }

  /**
   * Shared drag bootstrap: pointer events + document-level move/up while dragging.
   * Falls back cleanly if the gesture was not a primary button press.
   */
  const beginPanelDrag = useCallback((
    e: React.PointerEvent,
    cursor: string,
    onMove: (clientX: number, clientY: number) => void,
  ) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    setPanelResizing(true)
    document.body.style.cursor = cursor
    document.body.style.userSelect = 'none'

    const onPointerMove = (moveEvent: PointerEvent) => {
      onMove(moveEvent.clientX, moveEvent.clientY)
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture?.(upEvent.pointerId) } catch { /* already released */ }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setPanelResizing(false)
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [])


  // Horizontal drag between left panel and right panel (resizes rightPanelWidth).
  // Keep Summary ≥ LEFT_PANEL_MIN_WIDTH (795.7px) so breakdown labels aren’t truncated.
  const handleRightPanelDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current
    if (!body) return
    const startX = e.clientX
    const startPanelWidth = rightPanelWidth
    beginPanelDrag(e, 'col-resize', (clientX) => {
      const delta = startX - clientX // dragging left = wider right panel
      const bodyW = body.getBoundingClientRect().width
      const preferredMax = bodyW - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH
      const upper = Math.min(bodyW * 0.75, Math.max(0, preferredMax))
      const floor = Math.min(RIGHT_PANEL_MIN_WIDTH, upper)
      const next = startPanelWidth + delta
      setRightPanelWidth(Math.max(floor, Math.min(upper, next)))
    })
  }, [rightPanelWidth, beginPanelDrag])

  // Keep bodyWidth in sync (Sources share of row uses rightPanelWidth / bodyWidth).
  // Prefer clientWidth (scrollport) so overflowed content min-sizes don't inflate the ratio.
  useEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === 'undefined') return
    const update = () => setBodyWidth(body.clientWidth || body.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(body)
    return () => ro.disconnect()
  }, [])

  // Clamp Sources width when the viewport shrinks so Summary stays ≥ LEFT_PANEL_MIN_WIDTH.
  useEffect(() => {
    if (bodyWidth <= 0 || !rightPanelVisible) return
    const maxRight = Math.max(0, bodyWidth - LEFT_PANEL_MIN_WIDTH - PANEL_DRAG_HANDLE_WIDTH)
    setRightPanelWidth((w) => Math.min(w, maxRight))
  }, [bodyWidth, rightPanelVisible])

  // Side-by-side (doc LEFT / Details RIGHT) when:
  //   1. Hide Summary (!show1040), OR
  //   2. Sources (right) panel is >60% of review body width
  // Stacked (preview TOP / Details BOTTOM) when Summary is visible AND
  // Sources panel is ≤60% of body.
  // freezePreviewSideBySide holds orientation steady during Hide/Show Summary.
  const sourcesPanelWide =
    rightPanelVisible &&
    !rightPanelExiting &&
    bodyWidth > 0 &&
    rightPanelWidth / bodyWidth > 0.6
  const previewSideBySide = freezePreviewSideBySide || !show1040 || sourcesPanelWide

  // Resize drag between the document preview and detail fields. Axis is frozen
  // for the gesture (matches flexDirection at pointer-down). previewHeight
  // only controls the split ratio — never orientation.
  const handlePreviewDrag = useCallback((e: React.PointerEvent) => {
    const split = splitPaneRef.current ?? rightRef.current
    if (!split) return

    // Freeze axis to the layout at pointer-down (matches flexDirection).
    const stacked = !previewSideBySide
    const startPos = stacked ? e.clientY : e.clientX
    const startSize = previewHeight
    beginPanelDrag(e, stacked ? 'row-resize' : 'col-resize', (clientX, clientY) => {
      const pos = stacked ? clientY : clientX
      const delta = pos - startPos
      const rect = split.getBoundingClientRect()
      const splitSize = stacked ? rect.height : rect.width
      if (splitSize <= 0) return
      setPreviewHeight(Math.max(20, Math.min(75, startSize + (delta / splitSize) * 100)))
    })
  }, [previewHeight, previewSideBySide, beginPanelDrag])

  const inImportPhase = true

  // While Summary is animating or collapsed, right panel flex-fills so it grows/shrinks
  // as the left width transitions — avoids a px→flex mode flip mid-collapse.
  const rightPanelFills = inImportPhase && (!show1040 || leftAnimWidth !== null)

  const handleHideSummary = useCallback(() => {
    const body = bodyRef.current
    const left = leftPanelRef.current
    if (!body) {
      setShow1040(false)
      return
    }
    const bodyW = body.clientWidth || body.getBoundingClientRect().width
    const leftW = left?.getBoundingClientRect().width
      ?? Math.max(0, bodyW - rightPanelWidth - PANEL_DRAG_HANDLE_WIDTH)
    preCollapseRightWidthRef.current = rightPanelWidth
    // If doc|Details is already side-by-side, keep that axis for the whole motion.
    if (previewSideBySide) setFreezePreviewSideBySide(true)

    // Frame 1: lock left at its current pixel width (right switches to flex-fill
    // via leftAnimWidth !== null) — visually identical, no reflow jump.
    setLeftAnimWidth(leftW)
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShow1040(false)
        setLeftAnimWidth(0)
      })
    })

    summaryToggleTimerRef.current = setTimeout(() => {
      setLeftAnimWidth(null)
      setFreezePreviewSideBySide(false)
      summaryToggleTimerRef.current = null
    }, SUMMARY_TOGGLE_MS)
  }, [previewSideBySide, rightPanelWidth])

  const handleShowSummary = useCallback(() => {
    const body = bodyRef.current
    const bodyW = body
      ? (body.clientWidth || body.getBoundingClientRect().width)
      : window.innerWidth
    const restoreWidth = preCollapseRightWidthRef.current
      ?? Math.max(480, Math.round(bodyW * 0.65))
    const targetLeft = Math.max(0, bodyW - restoreWidth - PANEL_DRAG_HANDLE_WIDTH)
    // Keep side-by-side frozen when restoring into a wide Sources layout.
    if (restoreWidth / bodyW > 0.6) setFreezePreviewSideBySide(true)

    setLeftAnimWidth(0)
    setShow1040(true)
    if (summaryToggleTimerRef.current) clearTimeout(summaryToggleTimerRef.current)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLeftAnimWidth(targetLeft)
        setRightPanelWidth(restoreWidth)
      })
    })

    summaryToggleTimerRef.current = setTimeout(() => {
      setLeftAnimWidth(null)
      setFreezePreviewSideBySide(false)
      preCollapseRightWidthRef.current = null
      summaryToggleTimerRef.current = null
    }, SUMMARY_TOGGLE_MS)
  }, [])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>Data Review - Form 1040</span>
        </div>
        <div className={styles.headerRight}>

          <button
            className={`${styles.intuitIntelBtn} ${notesOpen ? styles.intuitIntelBtnActive : ''}`}
            aria-label="Comments"
            style={{ position: 'relative' }}
            onClick={notesOpen ? handleCloseNotes : handleOpenNotes}
          >
            <Comment size="medium" />
            <span className={styles.intuitIntelLabel}>Comments</span>
            {notes.length > 0 && (
              <span className={styles.notesBadge}>{notes.length}</span>
            )}
          </button>
          <button
            className={`${styles.intuitIntelBtn} ${rightPanelVisible ? styles.intuitIntelBtnActive : ''}`}
            aria-label="Toggle panel"
            onClick={() => {
              if (rightPanelVisible) {
                handleCloseSourcePanel()
              } else if (importsStarted) {
                setRightPanelVisible(true)
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  setRightPanelAnimating(true)
                  setTimeout(() => setRightPanelAnimating(false), SOURCE_PANEL_ENTER_MS)
                }))
              } else {
                startReviewingImports()
              }
            }}
          >
            <Panel size="medium" />
            <span className={styles.intuitIntelLabel}>Source Documents</span>
          </button>
        </div>
      </div>

      {/* ProtoA2 — source document review banner */}
      <Phase1Banner
        unreviewedDocCount={unreviewedDocCount}
        complete={phase1FullyComplete}
        importsStarted={importsStarted}
        onStartImports={startReviewingImports}
      />

      {/* Body — left panel + drag handle + right panel + agent panel */}
      <div className={styles.body} ref={bodyRef}>
        {/* ProtoC Phase 1: 1040 is minimized by default — collapsed to a compact button
            pinned near the top of the column. Expanding grows the panel horizontally, so
            the chevron points right (expand) / left (collapse) rather than up/down. Left
            panel stays mounted and animates width/opacity (same pattern as .rightPanel)
            so the transition is smooth. */}
        {inImportPhase && (
          <div
            className={styles.form1040HandleWrap}
            style={{
              width: show1040 ? 0 : SHOW_SUMMARY_HANDLE_WIDTH,
              opacity: show1040 ? 0 : 1,
              pointerEvents: show1040 ? 'none' : 'auto',
              transition: panelResizing ? 'none' : undefined,
            }}
          >
            <button
              className={styles.form1040Handle}
              onClick={handleShowSummary}
              aria-label="Show 1040"
            >
              <ChevronRight size="small" className={styles.form1040HandleIcon} />
              <span className={styles.form1040HandleLabel}>Show Summary</span>
            </button>
          </div>
        )}
        <div
          ref={leftPanelRef}
          className={styles.leftPanel}
          style={{
            /* During toggle, drive an explicit px width so min-width→0 and collapse
               interpolate together; otherwise flex:1 grows into remaining space. */
            flex: leftAnimWidth !== null
              ? `0 0 ${leftAnimWidth}px`
              : (inImportPhase && !show1040) ? '0 0 0px' : 1,
            width: leftAnimWidth !== null
              ? leftAnimWidth
              : (inImportPhase && !show1040) ? 0 : undefined,
            opacity: (inImportPhase && !show1040) ? 0 : 1,
            /* Keep Summary ≥ 795.7px so Return Breakdown labels aren’t truncated.
               Collapse animation / Hide Summary still use minWidth 0. */
            minWidth: leftAnimWidth !== null || (inImportPhase && !show1040)
              ? 0
              : LEFT_PANEL_MIN_WIDTH,
            transition: panelResizing ? 'none' : undefined,
          }}
        >
          {inImportPhase && show1040 && (rightPanelVisible || notesOpen) && (
            <CoachTip
              open={coachTip === 'hideSummary'}
              title="Hide the Summary"
              message="Need more room for source documents? Use Hide Summary to collapse this panel. You can bring it back anytime with Show Summary."
              onClose={() => dismissCoachTip('hideSummary')}
              position="bottom"
              alignment="left"
            >
              <Button
                priority="secondary"
                size="small"
                className={styles.form1040HideBtn}
                onClick={() => {
                  if (coachTip === 'hideSummary') dismissCoachTip('hideSummary')
                  handleHideSummary()
                }}
                aria-label="Hide Summary"
              >
                <ChevronLeft size="small" /> Hide Summary
              </Button>
            </CoachTip>
          )}
          <LeftPanel1040
            selectedField={selectedField}
            highlightField={highlightField1040}
            onFieldClick={inImportPhase ? handle1040FieldClick : setSelectedField}
            total1a={total1a}
            wages={wages}
            yoyExpanded={activeTopTab === 'prior-1040'}
            reviewedFields={reviewedFields}
            checkedFields={summaryCheckedFields}
            checkedMeta={summaryCheckedMeta}
            onToggleChecked={toggleSummaryChecked}
            flaggedFields={summaryFlaggedFields}
            flaggedMeta={summaryFlaggedMeta}
            onToggleFlagged={toggleSummaryFlagged}
            flagNotes={summaryFlagNotes}
            flagActivity={summaryFlagActivity}
            onSetFlagNote={setSummaryFlagNote}
            issueField={issueField}
            liveTotals={liveTotals}
            liveAmounts={amounts}
            editedFields={editedFields}
            outputFormId={outputFormId}
            onOutputFormChange={setOutputFormId}
            outputFormsNudgeOpen={outputFormsNudgeOpen}
            onDismissOutputFormsNudge={dismissOutputFormsNudge}
            onAddFieldNote={(text, context) => handleAddNote(text, context)}
            onNavigateToSourceDoc={handleNavigateToSourceDoc}
            onNavigateSource={handleNavigateSource}
            onViewSource={(fieldName, sourceLabel) => {
              // Map field → document tab
              const tabMap: Record<string, typeof activeTopTab> = {
                wages:           'w2s',
                w2Withholding:   'w2s',
                withholding:     '1099-divs',
                taxableInterest: '1099-ints',
                qualifiedDivs:   '1099-divs',
                ordinaryDivs:    '1099-divs',
                withholding1099: '1099-rs',
                iraDistrib:      '1099-rs',
                otherIncome:     '1099-necs',
                capitalGain:     'w2s',
                stdDeduction:    'w2s',
                agi:             'prior-1040',
                totalTax:        'prior-1040',
                amountOwed:      'prior-1040',
                totalPayments:   'prior-1040',
              }
              const tab = tabMap[fieldName] ?? 'w2s'
              setActiveTopTab(tab)

              // Navigate to the correct W-2 sub-tab based on source label
              if (tab === 'w2s' && sourceLabel) {
                const lc = sourceLabel.toLowerCase()
                if (lc.includes('tech circle')) setActiveSubTab('techCircle')
              }

              if (!importsStarted) {
                startReviewingImports()
              } else {
                ensureSourcePanelVisible()
              }
            }}
          />
        </div>

        <>
            {/* Left/right drag handle — stays mounted and collapses width with Summary
                so the gutter doesn't pop out of the row mid-animation. */}
            {rightPanelVisible && !rightPanelExiting && (
              <div
                className={`${dragStyles.handleVertical} ${styles.summarySplitter}`}
                onPointerDown={show1040 ? handleRightPanelDrag : undefined}
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize Summary and Source Documents"
                aria-hidden={inImportPhase && !show1040}
                style={{
                  width: (inImportPhase && !show1040) ? 0 : PANEL_DRAG_HANDLE_WIDTH,
                  opacity: (inImportPhase && !show1040) ? 0 : 1,
                  pointerEvents: (inImportPhase && !show1040) ? 'none' : 'auto',
                  transition: panelResizing ? 'none' : undefined,
                }}
              >
                <VerticalGripIcon />
              </div>
            )}

            {/* Right panel — always in DOM, width animates to 0 when hidden. During Summary
                toggle/collapse it flex-fills so it grows as the left width eases to 0
                (no hard px→flex flip after the row is already side-by-side). */}
            <div
              className={`${styles.rightPanel} ${rightPanelAnimating ? styles.rightPanelEntering : ''} ${rightPanelExiting ? styles.rightPanelExiting : ''} ${rightPanelFills ? styles.rightPanelFills : ''}`}
              ref={rightRef}
              style={{
                width: (!rightPanelVisible && !rightPanelExiting)
                  ? 0
                  : rightPanelFills ? undefined : rightPanelWidth,
                flex: (rightPanelFills && rightPanelVisible)
                  ? '1 1 0%'
                  : '0 0 auto',
                minWidth: 0,
                overflow: 'hidden',
                opacity: (!rightPanelVisible && !rightPanelExiting) ? 0 : 1,
                transition: panelResizing ? 'none' : undefined,
              }}
            >
              {/* Source panel header — title left; Close on right */}
              <div className={styles.sourcePanelHeader}>
                <span className={styles.sourcePanelTitle}>Imported documents</span>
                <div className={styles.sourcePanelActions}>
                  <IconControl
                    size="small"
                    aria-label="Close"
                    onClick={handleCloseSourcePanel}
                  >
                    <Close size="small" />
                  </IconControl>
                </div>
              </div>
              {inImportPhase && unreviewedDocCount > 0 && !phase1FullyComplete && (
                <Phase1IssueBanner
                  mode="documents"
                  unreviewedDocCount={unreviewedDocCount}
                  onReviewNextDocument={handleReviewNextDocument}
                />
              )}
              <ReviewTab
                activeTopTab={activeTopTab}
                flagCounts={inImportPhase ? tabFlagCounts : undefined}
                initialFlagCounts={inImportPhase ? tabInitialFlagCounts : undefined}
                verifiedDocs={verifiedDocs}
                tabVerifiedKeys={tabVerifiedKeys}
                typeReviewed={inImportPhase ? typeReviewed : undefined}
                onTopTabChange={(tab) => {
                  setActiveTopTab(tab)
                  setSelectedField(null)
                }}
              />

              {/* Peel tabs — payer switcher for multi-payer doc types */}
              {activeTopTab === '1099-divs' && (
                <PeelTab
                  tabs={DIV_PAYER_TABS.map(t => ({
                    ...t,
                    badge: divPayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      divVerifiedDocKey(t.key),
                      divPayerFieldCounts[t.key],
                      getInitialDivPayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeDivPayer}
                  onChange={key => setActiveDivPayer(key as DivPayer)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <PeelTab
                  tabs={INT_PAYER_TABS.map(t => ({
                    ...t,
                    badge: intPayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      intVerifiedDocKey(t.key),
                      intPayerFieldCounts[t.key],
                      getInitialIntPayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeIntPayer}
                  onChange={key => setActiveIntPayer(key as IntPayer)}
                />
              )}
              {activeTopTab === 'w2s' && (
                <PeelTab
                  tabs={W2_PAYER_TABS.map(t => ({
                    ...t,
                    badge: w2PayerFieldCounts[t.key],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      t.key,
                      w2PayerFieldCounts[t.key],
                      getInitialW2PayerFlagCount(t.key),
                    ),
                  }))}
                  activeKey={activeSubTab}
                  onChange={key => setActiveSubTab(key as W2Employer)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <PeelTab
                  tabs={R_PAYER_TABS.map(t => ({
                    ...t,
                    badge: tabFlagCounts['1099-rs'],
                    showClearedCheck: isDocReviewed(
                      verifiedDocs,
                      '1099-r',
                      tabFlagCounts['1099-rs'],
                      getInitialRPayerFlagCount(),
                    ),
                  }))}
                  activeKey="meridian"
                  onChange={() => {}}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <PeelTab
                  tabs={NEC_PAYER_TABS.map(t => ({
                    ...t,
                    badge: 0,
                    showClearedCheck: verifiedDocs.has('1099-nec'),
                  }))}
                  activeKey="summit"
                  onChange={() => {}}
                />
              )}

              {/* Document preview + detail fields. flex-basis % (not width/height alone)
                  so the six-dot handle can shrink the preview even when the document
                  image has a large intrinsic min-size. */}
              <div
                ref={splitPaneRef}
                style={{
                  display: 'flex',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                  flexDirection: previewSideBySide ? 'row' : 'column',
                }}
              >
              {activeTopTab !== 'questionnaire' && (
              <>
              <div style={previewSideBySide
                ? {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderRight: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
                : {
                    flex: `0 0 ${previewHeight}%`,
                    overflow: 'hidden',
                    borderBottom: '1px solid #D5DEE3',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    minWidth: 0,
                  }
              }>
                <DocumentPreview
                  imageSrc={sourceDocPreview.imageSrc}
                  alt={sourceDocPreview.alt}
                  customContent={
                    sourceDocPreview.useInt1099UnwaveringHtml
                      ? <Int1099FormPreview />
                      : undefined
                  }
                />
              </div>

              {/* Drag handle — vertical (col-resize) side by side, horizontal (row-resize) stacked */}
              <div
                className={previewSideBySide ? dragStyles.handleVertical : dragStyles.handleHorizontal}
                onPointerDown={handlePreviewDrag}
                role="separator"
                aria-orientation={previewSideBySide ? 'vertical' : 'horizontal'}
                aria-label="Resize document preview and Details"
              >
                <DotsSix size="small" className={`${dragStyles.handleIcon} ${previewSideBySide ? '' : dragStyles.rotated90}`} />
              </div>
              </>
              )}

              {/* Detail fields — switches based on active tab */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTopTab === 'w2s' && (
                <DetailFields
                  formTitle="Details: Wages, Salaries, Tips (W-2)"
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  activeSubTab={activeSubTab}
                  onSubTabChange={(tab) => setActiveSubTab(tab as W2Employer)}
                  wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
                  onWageChange={(employer, value) => {
                    setWages({ ...wages, [employer]: value })
                    markEdited(`wages-${employer}`)
                  }}
                  fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                  onFieldValueChange={(key, value) => {
                    if (key === 'withholding' && typeof value === 'number') {
                      updateField('withholding', { techCircle: value })
                      markEdited('withholding')
                    } else {
                      updateField(key as keyof typeof fieldValues, value as number)
                      markEdited(String(key))
                    }
                  }}
                  box12Rows={amounts.box12Rows}
                  onBox12RowChange={(sub, patch) => {
                    updateAmounts({
                      box12Rows: {
                        ...amounts.box12Rows,
                        [sub]: { ...amounts.box12Rows[sub], ...patch },
                      },
                    })
                    markEdited(`box12${sub}-${activeSubTab}`)
                  }}
                  onIdentityChange={(kind, value) => {
                    if (kind === 'ssn') updateAmounts({ employeeSsn: value })
                    else updateAmounts({ employerEin: value })
                    markEdited(kind === 'ssn' ? 'ssn-techCircle' : 'ein-techCircle')
                  }}
                  identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
                  box13={{
                    retirementPlan: amounts.box13RetirementPlan,
                    statutoryEmployee: amounts.box13StatutoryEmployee,
                    thirdPartySickPay: amounts.box13ThirdPartySickPay,
                  }}
                  onBox13Change={patch => {
                    updateAmounts({
                      ...(patch.retirementPlan !== undefined
                        ? { box13RetirementPlan: patch.retirementPlan }
                        : {}),
                      ...(patch.statutoryEmployee !== undefined
                        ? { box13StatutoryEmployee: patch.statutoryEmployee }
                        : {}),
                      ...(patch.thirdPartySickPay !== undefined
                        ? { box13ThirdPartySickPay: patch.thirdPartySickPay }
                        : {}),
                    })
                    markEdited('box13')
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                />
              )}
              {activeTopTab === '1099-divs' && (
                <DetailFieldsDiv
                  activePayer={activeDivPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-ints' && (
                <DetailFields1099
                  activePayer={activeIntPayer}
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                  onFieldValueChange={(key, value) => {
                    updateField(key as keyof typeof fieldValues, value)
                    markEdited(String(key))
                  }}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  amounts={amounts}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  editedFieldsMeta={editedFieldsMeta}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  verifiedDocsMeta={verifiedDocsMeta}
                  onVerifyDoc={toggleVerifiedDoc}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-rs' && (
                <DetailFields1099R
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === '1099-necs' && (
                <DetailFieldsNec
                  selectedField={selectedField}
                  highlightMode={highlightMode}
                  onFieldSelect={handleFieldSelect}
                  amounts={amounts}
                  onAmountChange={(patch, editedKey) => {
                    updateAmounts(patch)
                    if (editedKey) markEdited(editedKey)
                  }}
                  onMarkReviewed={handleMarkReviewed}
                  onMarkReviewedBulk={handleMarkReviewedBulk}
                  reviewedFields={reviewedFields}
                  editedFields={editedFields}
                  fieldOverrides={fieldOverrides}
                  onFieldOverride={setFieldOverride}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                />
              )}
              {activeTopTab === 'prior-1040' && (
                <PriorYear1040Fields
                  onMarkReviewed={handleMarkReviewed}
                  reviewedFields={reviewedFields}
                  onAddFieldNote={(text, context) => handleAddNote(text, context)}
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                />
              )}
              {activeTopTab === 'questionnaire' && (
                <QuestionnaireResponsesPanel
                  verifiedDocs={verifiedDocs}
                  onVerifyDoc={toggleVerifiedDoc}
                />
              )}
              </div>
              </div>
            </div>

        </>
      </div>

      {/* Notes / Comments pane — page-level overlay */}
      {(notesOpen || notesClosing) && (
        <NotesPane
          notes={notes}
          onAdd={(text) => handleAddNote(text)}
          onEdit={handleEditNote}
          onClose={handleCloseNotes}
          closing={notesClosing}
        />
      )}
    </div>
  )
}
