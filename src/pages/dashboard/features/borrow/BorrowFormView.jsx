import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiArrowRight as ArrowRight,
  FiBox as Box,
  FiCheckCircle as CheckCircle,
  FiRepeat as Repeat,
  FiUser as UserIcon,
} from "react-icons/fi";
import { FormField, formInputClass, RadioSelect, RollingText } from "../../components/SharedControls";
import { DatePicker } from "../../components/DatePickers";
import {
  DeviceResultRow,
  EmployeeResultRow,
  PickerList,
  PickerSearch,
  SectionCard,
  SelectedCard,
  StepBadge,
  SummarySlot,
} from "../../components/PickerForm";
import { translateLabel } from "../../../../lib/i18nLabel";

// Same shape as the Assign page — pick a device, pick a person, confirm in a
// panel that stays put — because it's the same job with a return date instead
// of an owner change.
export function BorrowFormView({
  isFormDataLoading,
  formDataError,
  onRetryFormData,
  categories = [],

  deviceQuery,
  onDeviceQueryChange,
  deviceCategory,
  onDeviceCategoryChange,
  deviceOptions = [],
  isDeviceLoading,
  deviceError,
  selectedDevice,
  onSelectDevice,
  onClearDevice,

  employeeQuery,
  onEmployeeQueryChange,
  employeeOptions = [],
  isEmployeeLoading,
  employeeError,
  selectedEmployee,
  onSelectEmployee,
  onClearEmployee,

  expectedReturnDate,
  onExpectedReturnDateChange,
  conditionOnBorrow,
  onConditionOnBorrowChange,
  remark,
  onRemarkChange,

  onSubmit,
  isSubmitting,
  submitError,
  submitSuccess,
}) {
  const { t, i18n } = useTranslation();
  const canSubmit = Boolean(selectedDevice && selectedEmployee && expectedReturnDate);

  if (isFormDataLoading) {
    return (
      <div className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {t("Loading...")}
        </div>
      </div>
    );
  }

  if (formDataError) {
    return (
      <div className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formDataError}</p>
          <button
            type="button"
            onClick={onRetryFormData}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
          >
            {t("Retry")}
          </button>
        </div>
      </div>
    );
  }

  const deviceDetail = selectedDevice
    ? [
      selectedDevice.category_name,
      selectedDevice.asset_code,
      selectedDevice.status && translateLabel(t, i18n, selectedDevice.status),
    ]
      .filter(Boolean)
      .join(" · ")
    : "";

  const employeeDetail = selectedEmployee
    ? [
      selectedEmployee.staff_code,
      selectedEmployee.department_name || selectedEmployee.department_code,
      selectedEmployee.location,
    ]
      .filter(Boolean)
      .join(" · ")
    : "";

  return (
    <div className="px-4 pb-6 sm:px-6 lg:px-8">
      <form onSubmit={onSubmit} className="mx-auto max-w-6xl" autoComplete="off">
        {submitSuccess && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {submitError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <SectionCard step={1} title={t("Pick a device")} isComplete={Boolean(selectedDevice)}>
              {selectedDevice ? (
                <SelectedCard
                  icon={Box}
                  title={selectedDevice.display_name}
                  detail={deviceDetail}
                  onClear={onClearDevice}
                  t={t}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <PickerSearch value={deviceQuery} onChange={onDeviceQueryChange} placeholder={t("Device / Asset Code / Device Model / Serial Number")} />
                    <div className="sm:w-52">
                      <RadioSelect
                        id="borrow-device-category"
                        options={[
                          { value: "All", label: t("All categories") },
                          ...categories.map((category) => ({
                            value: category.category_name,
                            label: category.category_name,
                          })),
                        ]}
                        value={deviceCategory}
                        onSelect={onDeviceCategoryChange}
                        placeholder={t("All categories")}
                      />
                    </div>
                  </div>

                  <PickerList
                    isLoading={isDeviceLoading}
                    error={deviceError}
                    isEmpty={deviceOptions.length === 0}
                    emptyText={t("No assignable devices found. Try a different search or category.")}
                    t={t}
                  >
                    {deviceOptions.map((device, index) => (
                      <DeviceResultRow key={device.equipment_id ?? index} device={device} onSelect={onSelectDevice} />
                    ))}
                  </PickerList>
                </>
              )}
            </SectionCard>

            <SectionCard step={2} title={t("Pick an employee")} isComplete={Boolean(selectedEmployee)}>
              {selectedEmployee ? (
                <SelectedCard
                  icon={UserIcon}
                  title={selectedEmployee.full_name}
                  detail={employeeDetail}
                  onClear={onClearEmployee}
                  t={t}
                />
              ) : (
                <>
                  <PickerSearch value={employeeQuery} onChange={onEmployeeQueryChange} placeholder={t("Employee / Staff Code / Phone")} />

                  <PickerList
                    isLoading={isEmployeeLoading}
                    error={employeeError}
                    isEmpty={employeeOptions.length === 0}
                    emptyText={t("No employees found.")}
                    t={t}
                  >
                    {employeeOptions.map((employee) => (
                      <EmployeeResultRow
                        key={employee.employee_id}
                        employee={employee}
                        isSelected={selectedEmployee?.employee_id === employee.employee_id}
                        onSelect={onSelectEmployee}
                      />
                    ))}
                  </PickerList>
                </>
              )}
            </SectionCard>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl bg-white py-5 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <StepBadge step={3} isComplete={canSubmit} />
                <h3 className="text-[14px] font-semibold text-slate-950 dark:text-white">{t("Summary")}</h3>
              </div>

              <div className="mt-4 space-y-2">
                <SummarySlot
                  icon={Box}
                  label={t("Device")}
                  title={selectedDevice?.display_name}
                  placeholder={t("Pick a device")}
                />
                <div className="flex justify-center text-slate-300 dark:text-slate-600">
                  <ArrowRight size={14} className="block rotate-90" />
                </div>
                <SummarySlot
                  icon={UserIcon}
                  label={t("Borrower")}
                  title={selectedEmployee?.full_name}
                  placeholder={t("Pick an employee")}
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4">
                <FormField label={t("Condition On Borrow")} htmlFor="borrow-page-condition">
                  <input
                    id="borrow-page-condition"
                    type="text"
                    autoComplete="off"
                    value={conditionOnBorrow}
                    onChange={(e) => onConditionOnBorrowChange(e.target.value)}
                    placeholder={t("e.g. Good, no scratches")}
                    className={formInputClass}
                  />
                </FormField>
                <FormField label={t("Remark")} htmlFor="borrow-page-remark">
                  <textarea
                    id="borrow-page-remark"
                    rows={2}
                    autoComplete="off"
                    value={remark}
                    onChange={(e) => onRemarkChange(e.target.value)}
                    placeholder={t("e.g. Charger and bag included")}
                    className={`${formInputClass} h-auto resize-none py-2`}
                  />
                </FormField>
                <FormField label={t("Expected Return Date *")} htmlFor="borrow-page-return-date">
                  <DatePicker
                    id="borrow-page-return-date"
                    value={expectedReturnDate}
                    onChange={onExpectedReturnDateChange}
                  />
                </FormField>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="group/roll mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#fddd1c] px-5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
              >
                <Repeat size={15} />
                <RollingText text={isSubmitting ? t("Borrowing...") : t("Borrow equipment")} />
              </button>

              {/* Names the outstanding step rather than leaving a disabled
                  button with no explanation. */}
              {!canSubmit && (
                <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                  {!selectedDevice
                    ? t("Pick a device to continue.")
                    : !selectedEmployee
                      ? t("Pick an employee to continue.")
                      : t("Set an expected return date to continue.")}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
