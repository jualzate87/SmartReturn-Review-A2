import { CircleCheck } from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import intuitAssistIcon from '../../assets/icons/intuit-assist.svg'
import styles from '../../styles/data-review/Phase1Banner.module.css'

interface Phase1BannerProps {
  /** Source documents still needing Mark as verified */
  unreviewedDocCount: number
  /** Soft complete: all packet docs reviewed */
  complete: boolean
  /** Whether the CPA has started opening source docs */
  importsStarted?: boolean
  /** Begin import review — reveals source documents on the right */
  onStartImports?: () => void
}

/**
 * ProtoA2 — Import review without field flags. Progress is document verification only.
 * Remaining-document attention (copy + CTA) also lives on Phase1IssueBanner (documents mode).
 */
export default function Phase1Banner({
  unreviewedDocCount,
  complete,
  importsStarted = false,
  onStartImports,
}: Phase1BannerProps) {
  return (
    <div
      className={[styles.banner, complete ? styles.bannerComplete : ''].filter(Boolean).join(' ')}
    >
      <div className={styles.left}>
        <img src={intuitAssistIcon} alt="" className={styles.icon} />
        <div className={styles.text}>
          {complete ? (
            <>
              <span className={styles.title}>Import review complete</span>
              <span className={styles.subtitle}>
                All source documents have been reviewed. Explore output forms from the Summary panel when ready.
              </span>
            </>
          ) : !importsStarted ? (
            <>
              <span className={styles.title}>Source document review</span>
              <span className={styles.subtitle}>
                Open imported documents and verify each form against the return.
              </span>
            </>
          ) : (
            <>
              <span className={styles.title}>Source document review</span>
              <span className={styles.subtitle}>
                {unreviewedDocCount > 0
                  ? `${unreviewedDocCount} ${unreviewedDocCount === 1 ? 'document' : 'documents'} left to verify against the return.`
                  : 'Finish verifying any remaining documents.'}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {!importsStarted && onStartImports && (
          <Button
            priority="primary"
            size="medium"
            onClick={onStartImports}
          >
            Start reviewing imports
          </Button>
        )}

        {importsStarted && !complete && unreviewedDocCount > 0 && (
          <span className={styles.counter}>
            <strong className={styles.counterNum}>{unreviewedDocCount}</strong>{' '}
            {unreviewedDocCount === 1 ? 'document' : 'documents'} left
          </span>
        )}

        {complete && (
          <span className={styles.completeBadge}>
            <CircleCheck size="small" /> All documents reviewed
          </span>
        )}
      </div>
    </div>
  )
}
