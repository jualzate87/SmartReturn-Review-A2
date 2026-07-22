import ptgLogo from '../../assets/icons/ptg-logo.svg'
import navWelcome from '../../assets/icons/nav/nav-welcome.svg'
import navTaxReturns from '../../assets/icons/nav/nav-tax-returns.svg'
import navClients from '../../assets/icons/nav/nav-clients.svg'
import navEfile from '../../assets/icons/nav/nav-efile.svg'
import navIntuitLink from '../../assets/icons/nav/nav-intuit-link.svg'
import navTaxAdvisor from '../../assets/icons/nav/nav-tax-advisor.svg'
import navQbAccountant from '../../assets/icons/nav/nav-qb-accountant.svg'
import navAllSolutions from '../../assets/icons/nav/nav-all-solutions.svg'
import navPurchase from '../../assets/icons/nav/nav-purchase.svg'
import navCollapse from '../../assets/icons/nav/nav-collapse.svg'
import styles from '../../styles/data-review/LeftNavPTO.module.css'

interface NavItemProps {
  icon: React.ReactNode
  active?: boolean
  label?: string
}

function NavItem({ icon, active = false, label }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ''}`} title={label}>
      {active && <div className={styles.activeBar} />}
      <span className={styles.navIconWrap}>{icon}</span>
    </div>
  )
}

function Divider() {
  return <div className={styles.divider} />
}

function ImgIcon({ src }: { src: string }) {
  return <img src={src} alt="" className={styles.navIcon} />
}

function LiveChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3.333 4.167A1.667 1.667 0 0 1 5 2.5h10a1.667 1.667 0 0 1 1.667 1.667v8.333A1.667 1.667 0 0 1 15 14.167H8.333L4.167 17.5v-3.333H5A1.667 1.667 0 0 1 3.333 12.5V4.167Z"
        fill="#fff"
      />
    </svg>
  )
}

function FormStatusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5.833 2.5A1.667 1.667 0 0 0 4.167 4.167v11.666A1.667 1.667 0 0 0 5.833 17.5h8.334a1.667 1.667 0 0 0 1.666-1.667V4.167A1.667 1.667 0 0 0 14.167 2.5H5.833Zm1.25 4.167h5.834V8.333H7.083V6.667Zm0 3.333h5.834v1.667H7.083v-1.667Zm0 3.333h3.75v1.667H7.083v-1.667Z"
        fill="#fff"
      />
    </svg>
  )
}

function PracticeMgmtIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M7.5 3.333A1.667 1.667 0 0 0 5.833 5v1.667H3.333A1.667 1.667 0 0 0 1.667 8.333v7.5c0 .92.746 1.667 1.666 1.667h13.334c.92 0 1.666-.747 1.666-1.667v-7.5a1.667 1.667 0 0 0-1.666-1.666h-2.5V5A1.667 1.667 0 0 0 12.5 3.333H7.5Zm1.667 1.667h1.666v1.667H9.167V5ZM3.333 10h13.334v5.833H3.333V10Z"
        fill="#fff"
      />
    </svg>
  )
}

export default function LeftNavPTO() {
  return (
    <div className={styles.nav}>
      <div className={styles.logo}>
        <img src={ptgLogo} alt="Intuit ProConnect" className={styles.logoImg} />
      </div>

      <div className={styles.navLinks}>
        <NavItem label="Welcome" icon={<ImgIcon src={navWelcome} />} />
        <NavItem label="Tax returns" active icon={<ImgIcon src={navTaxReturns} />} />
        <NavItem label="Clients" icon={<ImgIcon src={navClients} />} />
        <NavItem label="E-File Dashboard" icon={<ImgIcon src={navEfile} />} />
        <NavItem label="Intuit Link" icon={<ImgIcon src={navIntuitLink} />} />

        <Divider />

        <NavItem label="Live Chat" icon={<LiveChatIcon />} />
        <NavItem label="Form Status" icon={<FormStatusIcon />} />
        <NavItem label="Tax Advisor" icon={<ImgIcon src={navTaxAdvisor} />} />
        <NavItem label="Practice Management" icon={<PracticeMgmtIcon />} />
        <NavItem label="QB Accountant" icon={<ImgIcon src={navQbAccountant} />} />
        <NavItem label="Integrations" icon={<ImgIcon src={navAllSolutions} />} />
      </div>

      <Divider />

      <NavItem label="Purchase" icon={<ImgIcon src={navPurchase} />} />

      <div className={styles.spacer} />

      <div className={styles.bottomNav}>
        <Divider />
        <NavItem label="Collapse" icon={<ImgIcon src={navCollapse} />} />
      </div>
    </div>
  )
}
