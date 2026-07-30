import {
  FiActivity as Activity,
  FiCloud as Cloud,
  FiDollarSign as DollarSign,
  FiHardDrive as HardDrive,
  FiKey as Key,
  FiRefreshCw as RefreshCw,
  FiShield as Shield,
  FiShoppingCart as ShoppingCart,
} from "react-icons/fi";
import {
  antivirusColumns,
  cloudRateColumns,
  cloudUsageColumns,
  licenseColumns,
  replacementColumns,
  serverUsageColumns,
  ssdProcurementColumns,
  ssdUpgradeColumns,
} from "../../dashboard.config";
import { RecordsTableView } from "../../components/RecordsTableView";

export function ReplacementsView({ replacements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={replacements}
      columnsConfig={replacementColumns}
      title="Device replacements"
      recordLabel="replacement"
      loadingText="Loading replacements..."
      errorTitle="Couldn't load replacements"
      emptyIcon={RefreshCw}
      emptyTitle="No replacements found"
      emptyDescription="Replacement records will appear here."
      rowKey={(replacement, index) => replacement.replacement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function SsdUpgradesView({ upgrades, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={upgrades}
      columnsConfig={ssdUpgradeColumns}
      title="SSD upgrades"
      recordLabel="SSD upgrade"
      loadingText="Loading SSD upgrades..."
      errorTitle="Couldn't load SSD upgrades"
      emptyIcon={HardDrive}
      emptyTitle="No SSD upgrades found"
      emptyDescription="SSD upgrade records will appear here."
      rowKey={(upgrade, index) => upgrade.upgrade_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function SsdProcurementView({ procurements, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={procurements}
      columnsConfig={ssdProcurementColumns}
      title="SSD procurement"
      recordLabel="procurement"
      loadingText="Loading SSD procurement..."
      errorTitle="Couldn't load SSD procurement"
      emptyIcon={ShoppingCart}
      emptyTitle="No SSD procurement found"
      emptyDescription="SSD procurement records will appear here."
      rowKey={(procurement, index) => procurement.procurement_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function AntivirusView({ installs, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={installs}
      columnsConfig={antivirusColumns}
      title="Antivirus installs"
      recordLabel="install"
      loadingText="Loading antivirus installs..."
      errorTitle="Couldn't load antivirus installs"
      emptyIcon={Shield}
      emptyTitle="No antivirus installs found"
      emptyDescription="Antivirus install records will appear here."
      rowKey={(install, index) => install.install_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function LicensesView({ licenses, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={licenses}
      columnsConfig={licenseColumns}
      title="Licenses"
      recordLabel="license"
      loadingText="Loading licenses..."
      errorTitle="Couldn't load licenses"
      emptyIcon={Key}
      emptyTitle="No licenses found"
      emptyDescription="License records will appear here."
      rowKey={(license, index) => license.license_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function CloudRatesView({ rates, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={rates}
      columnsConfig={cloudRateColumns}
      title="Cloud rates"
      recordLabel="rate"
      loadingText="Loading cloud rates..."
      errorTitle="Couldn't load cloud rates"
      emptyIcon={DollarSign}
      emptyTitle="No cloud rates found"
      emptyDescription="Cloud rate records will appear here."
      rowKey={(rate, index) => rate.rate_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function ServerUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={serverUsageColumns}
      title="Service usage"
      recordLabel="usage"
      loadingText="Loading service usage..."
      errorTitle="Couldn't load service usage"
      emptyIcon={Activity}
      emptyTitle="No service usage found"
      emptyDescription="Service usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}

export function CloudUsageView({ usage, isLoading, error, onRetry }) {
  return (
    <RecordsTableView
      records={usage}
      columnsConfig={cloudUsageColumns}
      title="Cloud usage"
      recordLabel="usage record"
      loadingText="Loading cloud usage..."
      errorTitle="Couldn't load cloud usage"
      emptyIcon={Cloud}
      emptyTitle="No cloud usage found"
      emptyDescription="Cloud usage records will appear here."
      rowKey={(record, index) => record.usage_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    />
  );
}
