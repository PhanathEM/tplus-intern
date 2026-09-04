import { useEffect, useMemo, useState } from "react";
import { fetchAssignFormData, fetchAssignableEquipment, fetchAssignEmployees, submitAssign } from "../../../../services/assignService";
import { unassignEquipment } from "../../../../services/equipmentService";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";
import { filterDevicesByQuery, filterEmployeesByQuery } from "../../dashboard.utils";

export function useAssign({ isActive, user, onAssigned }) {
  const [formData, setFormData] = useState({
    statuses: [],
    categories: [],
    locations: [],
  });
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
  const [status, setStatus] = useState("Working/Using");
  const [assignedDate, setAssignedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchAssignFormData()
      .then((data) => {
        if (ignore) return;
        setFormData({
          statuses: Array.isArray(data?.statuses) ? data.statuses : [],
          categories: Array.isArray(data?.categories) ? data.categories : [],
          locations: Array.isArray(data?.locations) ? data.locations : [],
        });
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
    setIsFormDataLoading(true);
    setFormDataError(null);
  }

  function handleDeviceQueryChange(value) {
    setDeviceQuery(value);
  }

  function handleDeviceCategoryChange(value) {
    setDeviceCategory(value);
  }

  function handleSelectDevice(device) {
    setSelectedDevice(device);
    setConflict(null);
    setSubmitError(null);
  }

  function handleClearDevice() {
    setSelectedDevice(null);
    setConflict(null);
    setSubmitError(null);
  }

  function handleEmployeeQueryChange(value) {
    setEmployeeQuery(value);
  }

  function handleSelectEmployee(employee) {
    setSelectedEmployee(employee);
  }

  function handleClearEmployee() {
    setSelectedEmployee(null);
  }

  function handleStatusChange(value) {
    setStatus(value);
  }

  function handleAssignedDateChange(value) {
    setAssignedDate(value);
  }

  function performSubmit() {
    if (!selectedDevice || !selectedEmployee) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setConflict(null);

    const payload = {
      equipment_id: selectedDevice.equipment_id,
      employee_id: selectedEmployee.employee_id,
      status,
      assigned_date: assignedDate,
    };

    submitAssign(payload)
      .then((data) => {
        logActivity({
          actor: user,
          action: "assign",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: selectedDevice.equipment_id,
          entityLabel: selectedDevice.display_name,
          after: payload,
        });
        setSubmitSuccess(data?.message || `Assigned to ${selectedEmployee.full_name}.`);
        setSelectedDevice(null);
        setDeviceQuery("");
        setSelectedEmployee(null);
        setEmployeeQuery("");
        onAssigned?.();
      })
      .catch((error) => {
        const data = error.response?.data;
        if (error.status === 409) {
          setConflict({ current_owner: data?.current_owner || null });
          setSubmitError(data?.error || "That device already belongs to someone.");
        } else {
          setSubmitError(data?.error || error.message || "Could not assign equipment.");
        }
      })
      .finally(() => setIsSubmitting(false));
  }

  function handleSubmit(event) {
    event.preventDefault();
    performSubmit();
  }

  function handleResolveConflict() {
    if (!selectedDevice) return;

    setIsResolvingConflict(true);

    unassignEquipment(selectedDevice.equipment_id)
      .then(() => {
        setConflict(null);
        setSubmitError(null);
        performSubmit();
      })
      .catch((error) => setSubmitError(error.message || "Could not unassign the device."))
      .finally(() => setIsResolvingConflict(false));
  }

  return {
    formData,
    isFormDataLoading,
    formDataError,
    handleRetryFormData,
    resetForEntry,
    deviceQuery,
    handleDeviceQueryChange,
    deviceCategory,
    handleDeviceCategoryChange,
    deviceOptions: filteredDeviceOptions,
    isDeviceLoading,
    deviceError,
    selectedDevice,
    handleSelectDevice,
    handleClearDevice,
    employeeQuery,
    handleEmployeeQueryChange,
    employeeOptions: filteredEmployeeOptions,
    isEmployeeLoading,
    employeeError,
    selectedEmployee,
    handleSelectEmployee,
    handleClearEmployee,
    status,
    handleStatusChange,
    assignedDate,
    handleAssignedDateChange,
    handleSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
    conflict,
    handleResolveConflict,
    isResolvingConflict,
  };
}
