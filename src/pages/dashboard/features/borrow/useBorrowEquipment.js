import { useEffect, useMemo, useState } from "react";
import { fetchAssignFormData, fetchAssignableEquipment, fetchAssignEmployees } from "../../../../services/assignService";
import { createBorrow } from "../../../../services/borrowService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { filterDevicesByQuery, filterEmployeesByQuery, getEquipmentDisplayName } from "../../dashboard.utils";

// Borrowing draws from the same pool as assigning: only "Working - IT Stock"
// is flagged is_borrowable, which is exactly what /api/assign/available
// returns (unowned + assignable status), so that endpoint is reused rather
// than adding a near-identical one.
export function useBorrowEquipment({ isActive, user, onBorrowed }) {
  const [categories, setCategories] = useState([]);
  const [isFormDataLoading, setIsFormDataLoading] = useState(true);
  const [formDataError, setFormDataError] = useState(null);
  const [formDataFetchToken, setFormDataFetchToken] = useState(0);

  const [deviceQuery, setDeviceQuery] = useState("");
  const [deviceCategory, setDeviceCategory] = useState("All");
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [deviceError, setDeviceError] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [employeeQuery, setEmployeeQuery] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);
  const [employeeError, setEmployeeError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [conditionOnBorrow, setConditionOnBorrow] = useState("");
  const [remark, setRemark] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchAssignFormData()
      .then((data) => {
        if (ignore) return;
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setFormDataError(null);
      })
      .catch((error) => {
        if (!ignore) setFormDataError(error.message || "Something went wrong.");
      })
      .finally(() => {
        if (!ignore) setIsFormDataLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, formDataFetchToken]);

  useEffect(() => {
    if (!isActive || selectedDevice) return;

    let ignore = false;
    const timer = setTimeout(() => {
      setIsDeviceLoading(true);
      fetchAssignableEquipment({ category: deviceCategory })
        .then((data) => {
          if (ignore) return;
          setDeviceOptions(Array.isArray(data?.equipment) ? data.equipment : []);
          setDeviceError(null);
        })
        .catch((error) => {
          if (!ignore) setDeviceError(error.message || "Something went wrong.");
        })
        .finally(() => {
          if (!ignore) setIsDeviceLoading(false);
        });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [isActive, selectedDevice, deviceCategory]);

  // Refetching is per category only; the typed query narrows what came back.
  const filteredDeviceOptions = useMemo(
    () => filterDevicesByQuery(deviceOptions, deviceQuery),
    [deviceOptions, deviceQuery]
  );


  useEffect(() => {
    if (!isActive || selectedEmployee) return;

    let ignore = false;
    const timer = setTimeout(() => {
      setIsEmployeeLoading(true);
      fetchAssignEmployees()
        .then((data) => {
          if (ignore) return;
          setEmployeeOptions(Array.isArray(data?.employees) ? data.employees : []);
          setEmployeeError(null);
        })
        .catch((error) => {
          if (!ignore) setEmployeeError(error.message || "Something went wrong.");
        })
        .finally(() => {
          if (!ignore) setIsEmployeeLoading(false);
        });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [isActive, selectedEmployee]);

  // Fetched once; the typed query narrows what came back.
  const filteredEmployeeOptions = useMemo(
    () => filterEmployeesByQuery(employeeOptions, employeeQuery),
    [employeeOptions, employeeQuery]
  );


  function handleRetryFormData() {
    setIsFormDataLoading(true);
    setFormDataError(null);
    setFormDataFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleSelectDevice(device) {
    setSelectedDevice(device);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleClearDevice() {
    setSelectedDevice(null);
  }

  function handleSelectEmployee(employee) {
    setSelectedEmployee(employee);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleClearEmployee() {
    setSelectedEmployee(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!selectedDevice || !selectedEmployee) return;
    if (!expectedReturnDate) {
      setSubmitError("Please set an expected return date.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const payload = {
      equipment_id: selectedDevice.equipment_id,
      borrower_id: Number(selectedEmployee.employee_id),
      expected_return_date: expectedReturnDate,
    };
    if (purpose.trim()) payload.purpose = purpose.trim();
    if (conditionOnBorrow.trim()) payload.condition_on_borrow = conditionOnBorrow.trim();
    if (remark.trim()) payload.remark = remark.trim();

    createBorrow(payload)
      .then(() => {
        logActivity({
          actor: user,
          action: "borrow",
          module: ACTIVITY_MODULES.BORROW,
          entityId: selectedDevice.equipment_id,
          entityLabel: getEquipmentDisplayName(selectedDevice),
          after: payload,
        });

        setSubmitSuccess(
          `${selectedDevice.display_name || getEquipmentDisplayName(selectedDevice)} is now borrowed by ${selectedEmployee.full_name}.`
        );
        // Clear the form so the next borrow starts fresh — the device just
        // borrowed is no longer in the available pool anyway.
        setSelectedDevice(null);
        setSelectedEmployee(null);
        setExpectedReturnDate("");
        setPurpose("");
        setConditionOnBorrow("");
        setRemark("");
        onBorrowed?.();
      })
      .catch((error) => setSubmitError(error.message || "Something went wrong."))
      .finally(() => setIsSubmitting(false));
  }

  return {
    categories,
    isFormDataLoading,
    formDataError,
    handleRetryFormData,
    resetForEntry,

    deviceQuery,
    handleDeviceQueryChange: setDeviceQuery,
    deviceCategory,
    handleDeviceCategoryChange: setDeviceCategory,
    deviceOptions: filteredDeviceOptions,
    isDeviceLoading,
    deviceError,
    selectedDevice,
    handleSelectDevice,
    handleClearDevice,

    employeeQuery,
    handleEmployeeQueryChange: setEmployeeQuery,
    employeeOptions: filteredEmployeeOptions,
    isEmployeeLoading,
    employeeError,
    selectedEmployee,
    handleSelectEmployee,
    handleClearEmployee,

    expectedReturnDate,
    handleExpectedReturnDateChange: setExpectedReturnDate,
    purpose,
    handlePurposeChange: setPurpose,
    conditionOnBorrow,
    handleConditionOnBorrowChange: setConditionOnBorrow,
    remark,
    handleRemarkChange: setRemark,

    handleSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
  };
}
