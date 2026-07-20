import styles from '../../styles/data-review/LeftNavPTO.module.css'

// Figma asset URLs — refreshed from design context
const imgLogo         = "https://www.figma.com/api/mcp/asset/99c0671b-9475-4813-9437-7bde160aedfb"
const imgWelcome      = "https://www.figma.com/api/mcp/asset/21b8bfc3-14b9-4d08-87f9-9913f290a42f"
const imgTaxReturns   = "https://www.figma.com/api/mcp/asset/867ab1f7-95df-411c-8211-fc11ff5ec39d"
const imgClients      = "https://www.figma.com/api/mcp/asset/945795fe-e92f-4635-8422-07da273cbcf0"
const imgEFile        = "https://www.figma.com/api/mcp/asset/7b50d59e-7376-4ba8-9313-976ea269bb8b"
const imgIntuitLink   = "https://www.figma.com/api/mcp/asset/04df3e29-7282-4a4e-a561-91409fd41f27"
const imgLiveChat     = "https://www.figma.com/api/mcp/asset/da7ebd2a-72e5-4cae-aa08-f8aa54e47073"
const imgFormStatus   = "https://www.figma.com/api/mcp/asset/efd78068-3ba8-494d-b41c-c79c7f3668c4"
const imgTaxAdvisor   = "https://www.figma.com/api/mcp/asset/a373f7c0-d79c-4893-be7d-e2157cc15ff0"
const imgPracticeMgmt = "https://www.figma.com/api/mcp/asset/10d5929a-fba7-42ec-abc3-c35ba03e6d5a"
const imgQBAccountant = "https://www.figma.com/api/mcp/asset/c87d8d81-5e54-4249-a296-7b92c2b8f823"
const imgIntegrations = "https://www.figma.com/api/mcp/asset/30262933-0bd4-4286-b90e-76c086e0a6ba"
const imgPurchase     = "https://www.figma.com/api/mcp/asset/6ebd8b91-8be1-4ef6-a3b0-5402cc52177a"
const imgCollapse     = "https://www.figma.com/api/mcp/asset/ab6cc1d0-708f-4d41-8349-ac646d697664"

interface NavItemProps {
  icon: string
  active?: boolean
  label?: string
}

function NavItem({ icon, active = false, label }: NavItemProps) {
  return (
    <div className={`${styles.navItem} ${active ? styles.navItemActive : ''}`} title={label}>
      {active && <div className={styles.activeBar} />}
      <img src={icon} alt={label || ''} className={styles.navIcon} />
    </div>
  )
}

function Divider() {
  return <div className={styles.divider} />
}

export default function LeftNavPTO() {
  return (
    <div className={styles.nav}>
      {/* Logo */}
      <div className={styles.logo}>
        <img src={imgLogo} alt="Intuit ProConnect" className={styles.logoImg} />
      </div>

      {/* Nav links */}
      <div className={styles.navLinks}>
        <NavItem icon={imgWelcome}    label="Welcome" />
        <NavItem icon={imgTaxReturns} label="Tax returns" active />
        <NavItem icon={imgClients}    label="Clients" />
        <NavItem icon={imgEFile}      label="E-File Dashboard" />
        <NavItem icon={imgIntuitLink} label="Intuit Link" />

        <Divider />

        <NavItem icon={imgLiveChat}    label="Live Chat" />
        <NavItem icon={imgFormStatus}  label="Form Status" />
        <NavItem icon={imgTaxAdvisor}  label="Tax Advisor" />
        <NavItem icon={imgPracticeMgmt} label="Practice Management" />
        <NavItem icon={imgQBAccountant} label="QB Accountant" />
        <NavItem icon={imgIntegrations} label="Integrations" />
      </div>

      <Divider />

      <NavItem icon={imgPurchase} label="Purchase" />

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* Bottom nav */}
      <div className={styles.bottomNav}>
        <Divider />
        <NavItem icon={imgCollapse} label="Collapse" />
      </div>
    </div>
  )
}
