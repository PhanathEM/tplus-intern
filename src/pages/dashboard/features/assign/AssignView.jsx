import { useTranslation } from "react-i18next";
import {
  FiAlertTriangle as AlertTriangle,
  FiArrowRight as ArrowRight,
  FiBox as Box,
  FiCheckCircle as CheckCircle,
  FiUser as UserIcon,
  FiUserPlus as UserPlus,
} from "react-icons/fi";
import { RadioSelect, RollingText } from "../../components/SharedControls";
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

export function AssignEquipmentView({
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

  onSubmit,
  isSubmitting,
  submitError,
  submitSuccess,

  conflict,
  onResolveConflict,
  isResolvingConflict,
}) {
  const { t, i18n } = useTranslation();
  const canSubmit = Boolean(selectedDevice && selectedEmployee);

  if (isFormDataLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-[13px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          {t("Loading assign form...")}
        </div>
      </div>
    );
  }

  if (formDataError) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle size={18} />
          </div>
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t("Couldn't load the assign form")}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formDataError}</p>
          <button
            type="button"
            onClick={onRetryFormData}
            className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900"
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
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <form onSubmit={onSubmit} className="mx-auto max-w-6xl" autoComplete="off">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-slate-950 dark:text-white">{t("Assign equipment")}</h2>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            {t("Give a device in stock to an employee.")}
          </p>
        </div>

        {submitSuccess && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {conflict && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <p className="font-semibold">{t("This device already belongs to someone.")}</p>
            <p className="mt-0.5">
              {t("Currently assigned to")}{" "}
              <span className="font-semibold">{conflict.current_owner || t("another employee")}</span>.
            </p>
            <button
              type="button"
              onClick={onResolveConflict}
              disabled={isResolvingConflict}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white outline-none transition hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
            >
              {isResolvingConflict ? t("Unassigning...") : t("Unassign it, then retry")}
            </button>
          </div>
        )}

        {submitError && !conflict && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {submitError}
          </div>
        )}

        {/* Pickers left, a summary that stays put on the right — so the choices
            made so far and the submit button remain visible while scrolling
            through a long device or employee list. */}
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
                    <PickerSearch value={deviceQuery} onChange={onDeviceQueryChange} placeholder={t("Search Device")} />
                    <div className="sm:w-52">
                      <RadioSelect
                        id="assign-device-category"
                        options={[
                          { value: "All", label: t("All categories") },
                          ...categories.map((category) => ({
                            value: category.category_name,
                            label: `${category.category_name} (${category.available_count})`,
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
                  <PickerSearch value={employeeQuery} onChange={onEmployeeQueryChange} placeholder={t("Search Employee")} />

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

          {/* top-32 clears the page header (top-14, h-14) plus the sticky tab
              bar stacked under it — at top-20 the panel parked mid-way behind
              the tab bar, which paints over it at z-20. */}
          <div className="lg:sticky lg:top-32 lg:self-start">
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
                  label={t("Employee")}
                  title={selectedEmployee?.full_name}
                  placeholder={t("Pick an employee")}
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="group/roll mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#fddd1c] px-5 text-[13px] font-semibold text-slate-900 outline-none transition hover:bg-[#e5c518] focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#fddd1c] dark:text-slate-900 dark:hover:bg-[#e5c518] dark:focus-visible:ring-offset-slate-900"
              >
                <UserPlus size={15} />
                <RollingText text={isSubmitting ? t("Assigning...") : t("Assign equipment")} />
              </button>

              {/* Says which step is still outstanding rather than leaving a
                  disabled button with no explanation. */}
              {!canSubmit && (
                <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
                  {!selectedDevice && !selectedEmployee
                    ? t("Pick a device and an employee to continue.")
                    : !selectedDevice
                      ? t("Pick a device to continue.")
                      : t("Pick an employee to continue.")}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
