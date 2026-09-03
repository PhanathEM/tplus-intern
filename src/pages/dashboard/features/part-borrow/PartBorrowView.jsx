import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus as Plus,
  FiRotateCcw as RotateCcw,
  FiTrash2 as Trash2,
  FiX as X,
} from "react-icons/fi";
import { partBorrowColumns } from "../../dashboard.config";
import { ConfirmDialog, EmployeeSelectDropdown, FormField, formInputClass, RadioSelect, RollingText, RowActionsMenu } from "../../components/SharedControls";
import { RecordCellValue, RecordsTableView } from "../../components/RecordsTableView";

function getBorrowedItemLabel(record, t) {
  const bits = [
    record.part_value,
    record.model_name,
    record.model_number,
    record.ram_type,
    record.disk_type,
    record.disk_interface,
  ].filter((value) => value && String(value).trim());
  const detail = bits.join(" · ");
  return detail ? `${record.part_name} — ${detail}` : record.part_name || t("Unlabeled");
}

function getStockOptionLabel(item, t) {
  const bits = [item.part_value, item.ram_type, item.model_name, item.model_number, item.disk_type, item.disk_interface].filter(
    (value) => value && String(value).trim()
  );
  const label = bits.length ? bits.join(" · ") : t("Unlabeled");
  return `${label} (${item.quantity} available)`;
}

export function PartBorrowView({
  borrows,
  isLoading,
  error,
  onRetry,
  onAddBorrow,
  onReturn,
  onDelete,
  canManage = true,
  canDelete = false,
}) {
  const { t } = useTranslation();

  return (
    <RecordsTableView
      records={borrows}
      columnsConfig={partBorrowColumns}
      title={t("Borrow a Part")}
      recordLabel="borrow"
      loadingText={t("Loading current part borrows...")}
      errorTitle={t("Couldn't load part borrows")}
      emptyIcon={RotateCcw}
      emptyTitle={t("Nothing borrowed")}
      emptyDescription={t("Parts currently on loan will appear here.")}
      rowKey={(borrow, index) => borrow.borrow_id ?? index}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      hideRefresh
      headerActions={
        canManage && (
          <button
            type="button"
            onClick={onAddBorrow}
            className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
          >
            <Plus size={14} />
            <RollingText text={t("Borrow a Part")} />
          </button>
        )
      }
      renderCell={(record, column) =>
        column.key === "borrowed_item" ? (
          <span className="font-medium text-slate-900 dark:text-slate-100">{getBorrowedItemLabel(record, t)}</span>
        ) : (
          <RecordCellValue value={record[column.key]} />
        )
      }
      renderRowActions={
        canManage &&
        ((borrow) => (
          <RowActionsMenu
            items={[
              { icon: RotateCcw, label: t("Return"), onClick: () => onReturn(borrow) },
              ...(canDelete
                ? [{ divider: true }, { icon: Trash2, label: t("Delete"), destructive: true, onClick: () => onDelete(borrow) }]
                : []),
            ]}
          />
        ))
      }
    />
  );
}

export function BorrowPartDialog({
  isOpen,
  values,
  onChange,
  onSelectPartType,
  onSelectStock,
  onSelectEmployee,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  partTypes,
  employees,
  availableStock,
  isAvailableStockLoading,
  availableStockError,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const partTypeOptions = partTypes.map((partType) => ({ value: String(partType.part_type_id), label: partType.part_name }));
  const stockOptions = availableStock.map((item) => ({ value: String(item.stock_id), label: getStockOptionLabel(item, t) }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Borrow a part")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{t("Pick a stock line and who's borrowing it.")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label={t("Part *")} htmlFor="part-borrow-part_type_id">
                  <RadioSelect
                    id="part-borrow-part_type_id"
                    options={partTypeOptions}
                    value={values.part_type_id}
                    onSelect={onSelectPartType}
                    placeholder={t("Select a part...")}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label={t("Stock line *")} htmlFor="part-borrow-stock_id">
                  {isAvailableStockLoading ? (
                    <p className="text-[13px] text-slate-500 dark:text-slate-400">{t("Loading stock...")}</p>
                  ) : availableStockError ? (
                    <p className="text-[13px] text-rose-600 dark:text-rose-400">{availableStockError}</p>
                  ) : !values.part_type_id ? (
                    <p className="text-[13px] text-slate-400 dark:text-slate-500">{t("Pick a part first.")}</p>
                  ) : stockOptions.length === 0 ? (
                    <p className="text-[13px] text-slate-400 dark:text-slate-500">{t("Nothing left in stock for this part.")}</p>
                  ) : (
                    <RadioSelect
                      id="part-borrow-stock_id"
                      options={stockOptions}
                      value={values.stock_id}
                      onSelect={onSelectStock}
                      placeholder={t("Select a stock line...")}
                      disabled={isSubmitting}
                    />
                  )}
                </FormField>
              </div>

              <FormField label={t("Quantity *")} htmlFor="part-borrow-quantity">
                <input
                  id="part-borrow-quantity"
                  type="number"
                  min="1"
                  required
                  autoComplete="off"
                  value={values.quantity}
                  onChange={(e) => onChange("quantity", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Borrow Date *")} htmlFor="part-borrow-borrow_date">
                <input
                  id="part-borrow-borrow_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.borrow_date}
                  onChange={(e) => onChange("borrow_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label={t("Borrower *")} htmlFor="part-borrow-borrower_id">
                  <EmployeeSelectDropdown
                    employees={employees}
                    selectedId={values.borrower_id}
                    onSelect={onSelectEmployee}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="sm:col-span-2">
                <FormField label={t("Condition at Borrowing")} htmlFor="part-borrow-condition_on_borrow">
                  <input
                    id="part-borrow-condition_on_borrow"
                    type="text"
                    autoComplete="off"
                    value={values.condition_on_borrow}
                    onChange={(e) => onChange("condition_on_borrow", e.target.value)}
                    className={formInputClass}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Borrowing...") : t("Borrow")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReturnPartDialog({ borrow, values, partStatuses = [], onChange, onSubmit, onClose, isSubmitting, error }) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!borrow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-label={t("Close")} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Return part")}</h2>
            <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
              {getBorrowedItemLabel(borrow, t)} · {t("borrowed_by", { name: borrow.borrower_name || `#${borrow.borrower_id}` })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("Close")}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" autoComplete="off">
          <div className="overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <FormField label={t("Return Date *")} htmlFor="part-return-return_date">
                <input
                  id="part-return-return_date"
                  type="date"
                  required
                  autoComplete="off"
                  value={values.return_date}
                  onChange={(e) => onChange("return_date", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Condition on Return")} htmlFor="part-return-condition_on_return">
                <input
                  id="part-return-condition_on_return"
                  type="text"
                  autoComplete="off"
                  value={values.condition_on_return}
                  onChange={(e) => onChange("condition_on_return", e.target.value)}
                  className={formInputClass}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label={t("Return Status")} htmlFor="part-return-status">
                <RadioSelect
                  id="part-return-status"
                  options={[...partStatuses]
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((status) => ({ value: status.status_name, label: t(status.status_name) }))}
                  value={values.return_status}
                  onSelect={(value) => onChange("return_status", value)}
                  disabled={isSubmitting}
                  placeholder={t("Select a status...")}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group/roll inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#fddd1c] px-3.5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
            >
              <RollingText text={isSubmitting ? t("Returning...") : t("Return")} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteBorrowDialog({ borrow, onConfirm, onCancel, isConfirming, error }) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={Boolean(borrow)}
      title={t("Delete this borrow record?")}
      message={borrow ? t("delete_borrow_message", { item: getBorrowedItemLabel(borrow, t) }) : ""}
      confirmLabel={t("Delete")}
      confirmingLabel={t("Deleting...")}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isConfirming={isConfirming}
      error={error}
    />
  );
}
