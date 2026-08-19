import { useEffect, useMemo, useState } from "react";
import {
  fetchEquipmentStatuses,
  fetchEquipmentViews,
  fetchEquipmentByView,
  createEquipmentByView,
  updateEquipmentByView,
  deleteEquipmentItem,
  fetchViewColumnsSummary,
  fetchAvailableViewFields,
  fetchViewColumns,
  saveViewColumns,
  fetchCustomFields,
  fetchCustomFieldTypes,
  createCustomField,
  removeCustomFieldFromCategory,
  unassignEquipment,
} from "../../../../services/equipmentService";
import { createCategory, updateCategory, deleteCategory } from "../../../../services/categoryService";
import {
  assignEquipmentLicenses,
  fetchEquipmentLicenseOptions,
  unassignEquipmentLicense,
} from "../../../../services/equipmentLicenseService";
import { EQUIPMENT_VIEWS, EQUIPMENT_FORM_FALLBACK_FIELDS } from "../../dashboard.config";
import {
  extractEquipmentItems,
  normalizeEquipmentViews,
  normalizeViewColumnsSummary,
  normalizeAvailableFields,
  normalizeViewColumns,
  normalizeEquipmentTableColumns,
  normalizeEquipmentLicenseOptions,
  normalizeCustomFields,
  normalizeCustomFieldTypes,
  getEquipmentFormFields,
  getEquipmentFormFieldsFromColumns,
  buildEquipmentFormValues,
  slugifyEquipmentView,
  getEquipmentDisplayName,
} from "../../dashboard.utils";
import { ACTIVITY_MODULES, logActivity } from "../../../../lib/activityLog";

function excludeBrokenStatuses(data) {
  const list = Array.isArray(data) ? data : [];
  return list.filter((status) => !/broken/i.test(status?.status_name || ""));
}

export function useEquipment({ isActive, user, loadDepartments, onEquipmentMutated, onEquipmentUnassigned }) {
  const [categories, setCategories] = useState([]);
  // No more "All categories" tab — defaults to the first real category once
  // categories load, same pattern as the Device Replacement category bar.
  const [categoryOverride, setCategoryOverride] = useState("");
  const category = categoryOverride || categories[0]?.slug || "";
  const [tableColumns, setTableColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchToken, setFetchToken] = useState(0);
  const [items, setItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formTarget, setFormTarget] = useState(null);
  const [formFields, setFormFields] = useState(EQUIPMENT_FORM_FALLBACK_FIELDS);
  const [formValues, setFormValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [equipmentToUnassign, setEquipmentToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  const [unassignError, setUnassignError] = useState(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isSoftwareLicensePickerOpen, setIsSoftwareLicensePickerOpen] = useState(false);
  const [softwareLicenseOptions, setSoftwareLicenseOptions] = useState([]);
  const [isSoftwareLicenseOptionsLoading, setIsSoftwareLicenseOptionsLoading] = useState(false);
  const [softwareLicenseOptionsError, setSoftwareLicenseOptionsError] = useState(null);
  const [licenseSelectedIds, setLicenseSelectedIds] = useState([]);
  const [licenseInitialIds, setLicenseInitialIds] = useState([]);

  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState("add");
  const [categoryFormTarget, setCategoryFormTarget] = useState(null);
  const [categoryFormValues, setCategoryFormValues] = useState({ category_name: "", description: "" });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState(null);

  const [isColumnsPickerOpen, setIsColumnsPickerOpen] = useState(false);
  const [columnsPickerCategoryId, setColumnsPickerCategoryId] = useState(null);
  const [columnsPickerCategoryLabel, setColumnsPickerCategoryLabel] = useState("");
  const [availableViewFields, setAvailableViewFields] = useState([]);
  const [customFieldTypes, setCustomFieldTypes] = useState([]);
  const [isColumnsPickerLoading, setIsColumnsPickerLoading] = useState(false);
  const [columnsPickerSelectedKeys, setColumnsPickerSelectedKeys] = useState([]);
  const [columnsPickerCustomFields, setColumnsPickerCustomFields] = useState([]);
  const [reusableCustomFields, setReusableCustomFields] = useState([]);
  const [isSavingColumns, setIsSavingColumns] = useState(false);
  const [columnsPickerError, setColumnsPickerError] = useState(null);
  const [columnsPickerReopenEquipmentForm, setColumnsPickerReopenEquipmentForm] = useState(false);

  const formCategoryOptions = useMemo(() => {
    const names = new Set(EQUIPMENT_VIEWS.map((view) => view.label));
    categories.forEach((item) => names.add(item.label));
    if (formTarget?.category_name) names.add(formTarget.category_name);
    if (formTarget?.category) names.add(formTarget.category);
    return [...names].sort();
  }, [categories, formTarget]);

  const categoryByLabel = useMemo(() => {
    const map = new Map();
    EQUIPMENT_VIEWS.forEach((view) => map.set(view.label, { slug: view.slug, categoryId: null }));
    categories.forEach((item) => map.set(item.label, { slug: item.slug, categoryId: item.categoryId }));
    return map;
  }, [categories]);

  const categoryBySlug = useMemo(() => {
    const map = new Map();
    categories.forEach((item) => map.set(item.slug, item));
    return map;
  }, [categories]);

  function resolveView(label) {
    return categoryByLabel.get(label)?.slug || slugifyEquipmentView(label);
  }

  function resolveCategoryId(label) {
    return categoryByLabel.get(label)?.categoryId ?? null;
  }

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchViewColumnsSummary()
      .then((data) => {
        if (ignore) return;
        const normalized = normalizeViewColumnsSummary(data);
        if (normalized.length > 0) {
          setCategories(normalized);
          setError(null);
          return;
        }
        return fetchEquipmentViews().then((legacyData) => {
          if (ignore) return;
          const legacyNormalized = normalizeEquipmentViews(legacyData);
          setCategories(legacyNormalized.length > 0 ? legacyNormalized : EQUIPMENT_VIEWS);
          setError(null);
        });
      })
      .catch((error) => {
        if (!ignore) {
          setCategories(EQUIPMENT_VIEWS);
          setError(error.message || "Something went wrong.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isActive, fetchToken]);

  useEffect(() => {
    if (!isActive || !category) return;
    fetchItemsForCategory(category);
  }, [isActive, fetchToken, category]);

  // Split out from the category-select handler below so a plain category
  // switch doesn't double-fetch (the effect above triggers it).
  function fetchItemsForCategory(targetCategory) {
    setIsItemsLoading(true);
    setItemsError(null);

    const views = categories.length > 0 ? categories : EQUIPMENT_VIEWS;
    const view = views.find((item) => item.slug === targetCategory);

    fetchEquipmentByView(targetCategory)
      .then((data) => {
        setTableColumns(normalizeEquipmentTableColumns(data));
        return extractEquipmentItems(data).map((item) => ({
          ...item,
          category: item.category || view?.label || targetCategory,
          __equipment_view: targetCategory,
          __category_id: view?.categoryId ?? null,
        }));
      })
      .then((rows) => setItems(rows))
      .catch((error) => setItemsError(error.message || "Something went wrong."))
      .finally(() => setIsItemsLoading(false));
  }

  useEffect(() => {
    if (!isActive) return;

    let ignore = false;

    fetchEquipmentStatuses()
      .then((data) => {
        if (!ignore) setStatuses(excludeBrokenStatuses(data));
      })
      .catch(() => {
        if (!ignore) setStatuses([]);
      });

    return () => {
      ignore = true;
    };
  }, [isActive]);

  function handleRetry() {
    setIsLoading(true);
    setError(null);
    setFetchToken((value) => value + 1);
  }

  function resetForEntry() {
    setIsLoading(true);
    setError(null);
  }

  // Updates the selected category AND fetches its items in one call. Used by
  // call sites that need an immediate refetch of a category that may not
  // have actually changed (e.g. after creating/deleting/unassigning an item),
  // where the category-change effect above won't retrigger on its own.
  function handleViewCategory(targetCategory) {
    setCategoryOverride(targetCategory);
    fetchItemsForCategory(targetCategory);
  }

  function handleSelectCategory(targetCategory) {
    // Only update state here — the effect watching `category` is solely
    // responsible for fetching on a real category change, so this doesn't
    // double-fetch.
    setCategoryOverride(targetCategory);
  }

  function handleOpenAddItem() {
    const activeEntry = categoryBySlug.get(category);
    if (activeEntry && activeEntry.columnCount === 0) {
      handleOpenColumnsPicker(activeEntry.categoryId, activeEntry.label);
      return;
    }

    setFormMode("add");
    setFormTarget(null);
    const activeCategoryLabel = categories.find((item) => item.slug === category)?.label || "";
    const fields =
      getEquipmentFormFieldsFromColumns(tableColumns) ||
      getEquipmentFormFields(items[0] || null) ||
      EQUIPMENT_FORM_FALLBACK_FIELDS;
    setFormFields(fields);
    setFormValues({ ...buildEquipmentFormValues(fields, {}), category: activeCategoryLabel });
    setFormError(null);
    setLicenseSelectedIds([]);
    setLicenseInitialIds([]);
    setIsFormOpen(true);

    loadDepartments();

    fetchEquipmentStatuses()
      .then((data) => setStatuses(excludeBrokenStatuses(data)))
      .catch(() => setStatuses([]));

    const activeCategoryId = categoryBySlug.get(category)?.categoryId;
    if (activeCategoryId != null) {
      fetchCustomFields(activeCategoryId)
        .then((data) => {
          const custom = normalizeCustomFields(data);
          const extraFields = custom.filter((field) => !fields.some((f) => f.key === field.key));
          if (extraFields.length === 0) return;
          const merged = [...fields, ...extraFields];
          setFormFields(merged);
          setFormValues((current) => ({
            ...buildEquipmentFormValues(merged, {}),
            ...current,
          }));
        })
        .catch(() => {});
    }
  }

  function handleOpenEditItem(item) {
    setFormMode("edit");
    setFormTarget(item);
    const fields =
      getEquipmentFormFieldsFromColumns(tableColumns) || getEquipmentFormFields(item) || EQUIPMENT_FORM_FALLBACK_FIELDS;
    setFormFields(fields);
    setFormValues(buildEquipmentFormValues(fields, item));
    setFormError(null);
    // Equipment list rows already carry their assigned licenses (software_licenses),
    // so the picker's initial selection can be read straight off item — no extra fetch.
    const currentLicenseIds = Array.isArray(item.software_licenses)
      ? item.software_licenses.map((license) => license.license_id).filter((id) => id != null)
      : [];
    setLicenseSelectedIds(currentLicenseIds);
    setLicenseInitialIds(currentLicenseIds);
    setIsFormOpen(true);

    loadDepartments();

    fetchEquipmentStatuses()
      .then((data) => setStatuses(excludeBrokenStatuses(data)))
      .catch(() => setStatuses([]));

    if (item.__category_id != null) {
      fetchCustomFields(item.__category_id)
        .then((data) => {
          const custom = normalizeCustomFields(data);
          const extraFields = custom.filter((field) => !fields.some((f) => f.key === field.key));
          if (extraFields.length === 0) return;
          const merged = [...fields, ...extraFields];
          setFormFields(merged);
          setFormValues(buildEquipmentFormValues(merged, item));
        })
        .catch(() => {});
    }
  }

  function handleCloseForm() {
    setIsFormOpen(false);
  }

  function handleFormFieldChange(key, value) {
    setFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleOpenSoftwareLicensePicker() {
    setIsSoftwareLicensePickerOpen(true);
    setIsSoftwareLicenseOptionsLoading(true);
    setSoftwareLicenseOptionsError(null);

    fetchEquipmentLicenseOptions()
      .then((data) => setSoftwareLicenseOptions(normalizeEquipmentLicenseOptions(data)))
      .catch((error) => setSoftwareLicenseOptionsError(error.message || "Could not load licenses."))
      .finally(() => setIsSoftwareLicenseOptionsLoading(false));
  }

  function handleCloseSoftwareLicensePicker() {
    setIsSoftwareLicensePickerOpen(false);
  }

  function handleToggleSoftwareLicenseSelection(licenseId) {
    setLicenseSelectedIds((current) =>
      current.some((id) => String(id) === String(licenseId))
        ? current.filter((id) => String(id) !== String(licenseId))
        : [...current, licenseId]
    );
  }

  function handleOpenColumnsPickerFromForm() {
    const categoryId =
      formMode === "edit"
        ? formTarget?.__category_id ?? resolveCategoryId(formTarget?.category || formTarget?.category_name)
        : resolveCategoryId(formValues.category);

    if (categoryId == null) return;

    setColumnsPickerReopenEquipmentForm(true);
    setIsFormOpen(false);
    handleOpenColumnsPicker(categoryId, formValues.category);
  }

  function removeCustomFieldWithConfirm(categoryId, field) {
    return removeCustomFieldFromCategory(categoryId, field.id).catch((error) => {
      if (error.status === 409) {
        const confirmed = window.confirm(
          `"${field.label}" already has data saved on some items. Remove it and that data anyway?`
        );
        if (confirmed) return removeCustomFieldFromCategory(categoryId, field.id, true);
      }
      throw error;
    });
  }

  function handleRemoveCustomField(field) {
    const categoryId =
      formMode === "edit"
        ? formTarget?.__category_id ?? resolveCategoryId(formTarget?.category || formTarget?.category_name)
        : resolveCategoryId(formValues.category);

    if (categoryId == null) return Promise.reject(new Error("Choose a category first."));

    return removeCustomFieldWithConfirm(categoryId, field).then(() => {
      setFormFields((current) => current.filter((item) => item.key !== field.key));
      setFormValues((current) => {
        const next = { ...current };
        delete next[field.key];
        return next;
      });
    });
  }

  function handleAddCustomFieldFromPicker(label, type) {
    if (!columnsPickerCategoryId) return Promise.reject(new Error("Choose a category first."));

    return createCustomField(columnsPickerCategoryId, { field_label: label, field_type: type }).then((data) => {
      const [normalized] = normalizeCustomFields([data?.field || data]);
      const field = normalized || {
        id: null,
        key: slugifyEquipmentView(label).replace(/-/g, "_"),
        label,
        type,
      };
      setColumnsPickerCustomFields((current) => [...current, field]);
      setReusableCustomFields((current) => current.filter((item) => item.key !== field.key));
      handleRetry();
      refreshOpenFormFields(columnsPickerCategoryId);
    });
  }

  function handleReuseCustomFieldFromPicker(field) {
    return handleAddCustomFieldFromPicker(field.label, field.rawType);
  }

  function handleRemoveCustomFieldFromPicker(field) {
    return removeCustomFieldWithConfirm(columnsPickerCategoryId, field).then(() => {
      setColumnsPickerCustomFields((current) => current.filter((item) => item.key !== field.key));
      setReusableCustomFields((current) =>
        current.some((item) => item.key === field.key) ? current : [...current, field]
      );
      handleRetry();
      refreshOpenFormFields(columnsPickerCategoryId);
    });
  }

  function handleRemoveStandardField(field) {
    const categoryId =
      formMode === "edit"
        ? formTarget?.__category_id ?? resolveCategoryId(formTarget?.category || formTarget?.category_name)
        : resolveCategoryId(formValues.category);

    if (categoryId == null) return Promise.reject(new Error("Choose a category first."));

    const remainingFields = formFields.filter((item) => item.key !== field.key);
    const payload = remainingFields
      .filter((item) => item.id == null)
      .map((item, index) => ({ field: item.key, header: item.label, sort_order: index + 1 }));

    return saveViewColumns(categoryId, payload).then(() => {
      setFormFields(remainingFields);
      setFormValues((current) => {
        const next = { ...current };
        delete next[field.key];
        return next;
      });
      handleRetry();
    });
  }

  function handleRemoveField(field) {
    return field.id != null ? handleRemoveCustomField(field) : handleRemoveStandardField(field);
  }

  function handleSubmitForm(event) {
    event.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = Object.fromEntries(Object.entries(formValues).filter(([, value]) => value.trim() !== ""));

    const isEdit = formMode === "edit";
    const view = isEdit
      ? formTarget.__equipment_view || resolveView(formTarget.category || formTarget.category_name)
      : resolveView(payload.category);

    // "category" is implied by the view/URL, not a real per-item field — the
    // backend rejects it as an unknown column if it's included in the body.
    const requestPayload = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "category"));

    const request = isEdit
      ? updateEquipmentByView(view, formTarget.equipment_id, requestPayload)
      : createEquipmentByView(view, requestPayload);

    request
      .then((data) => {
        const savedEquipmentId = isEdit ? formTarget.equipment_id : data?.equipment_id;

        const licenseIdsToAdd = licenseSelectedIds.filter(
          (id) => !licenseInitialIds.some((initialId) => String(initialId) === String(id))
        );
        const licenseIdsToRemove = licenseInitialIds.filter(
          (id) => !licenseSelectedIds.some((selectedId) => String(selectedId) === String(id))
        );

        const licenseSync =
          savedEquipmentId != null
            ? Promise.all([
                licenseIdsToAdd.length > 0 ? assignEquipmentLicenses(savedEquipmentId, licenseIdsToAdd) : Promise.resolve(),
                ...licenseIdsToRemove.map((license_id) => unassignEquipmentLicense(savedEquipmentId, license_id)),
              ])
            : Promise.resolve();

        return licenseSync
          .catch((licenseError) => {
            console.error("Could not update software license assignments:", licenseError);
          })
          .then(() => {
            logActivity({
              actor: user,
              action: isEdit ? "update" : "create",
              module: ACTIVITY_MODULES.EQUIPMENT,
              entityId: isEdit ? formTarget.equipment_id : data?.equipment_id,
              entityLabel: getEquipmentDisplayName(isEdit ? formTarget : payload),
              before: isEdit ? formTarget : null,
              after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
            });
            setIsFormOpen(false);
            handleRetry();
            onEquipmentMutated?.();
            handleViewCategory(category);
          });
      })
      .catch((error) => setFormError(error.message || "Something went wrong."))
      .finally(() => setIsSaving(false));
  }

  function handleOpenUnassign(item) {
    setEquipmentToUnassign(item);
    setUnassignError(null);
  }

  function handleCloseUnassign() {
    setEquipmentToUnassign(null);
    setUnassignError(null);
  }

  function handleConfirmUnassign() {
    if (!equipmentToUnassign?.equipment_id) return;

    setIsUnassigning(true);
    setUnassignError(null);

    unassignEquipment(equipmentToUnassign.equipment_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "unassign",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: equipmentToUnassign.equipment_id,
          entityLabel: getEquipmentDisplayName(equipmentToUnassign),
          before: equipmentToUnassign,
        });
        setEquipmentToUnassign(null);
        handleRetry();
        onEquipmentMutated?.();
        handleViewCategory(category);
        onEquipmentUnassigned?.();
      })
      .catch((error) => setUnassignError(error.message || "Something went wrong."))
      .finally(() => setIsUnassigning(false));
  }

  function handleOpenDelete(item) {
    setEquipmentToDelete(item);
    setDeleteError(null);
  }

  function handleCloseDelete() {
    setEquipmentToDelete(null);
    setDeleteError(null);
  }

  function handleConfirmDelete() {
    if (!equipmentToDelete?.equipment_id) return;

    setIsDeleting(true);
    setDeleteError(null);

    deleteEquipmentItem(equipmentToDelete.equipment_id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.EQUIPMENT,
          entityId: equipmentToDelete.equipment_id,
          entityLabel: getEquipmentDisplayName(equipmentToDelete),
          before: equipmentToDelete,
        });
        setEquipmentToDelete(null);
        handleRetry();
        onEquipmentMutated?.();
        handleViewCategory(category);
      })
      .catch((error) => setDeleteError(error.message || "Something went wrong."))
      .finally(() => setIsDeleting(false));
  }

  function handleOpenAddCategory() {
    setCategoryFormMode("add");
    setCategoryFormTarget(null);
    setCategoryFormValues({ category_name: "", description: "" });
    setCategoryFormError(null);
    setIsCategoryFormOpen(true);
  }

  function handleOpenEditCategory(categoryRecord) {
    setCategoryFormMode("edit");
    setCategoryFormTarget(categoryRecord);
    setCategoryFormValues({
      category_name: categoryRecord.category_name || categoryRecord.category || categoryRecord.label || "",
      description: categoryRecord.description || "",
    });
    setCategoryFormError(null);
    setIsCategoryFormOpen(true);
  }

  function handleCloseCategoryForm() {
    setIsCategoryFormOpen(false);
  }

  function handleCategoryFormFieldChange(key, value) {
    setCategoryFormValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmitCategoryForm(event) {
    event.preventDefault();

    if (!categoryFormValues.category_name.trim()) {
      setCategoryFormError("Please enter a category name.");
      return;
    }

    setIsSavingCategory(true);
    setCategoryFormError(null);

    const payload = {
      category_name: categoryFormValues.category_name.trim(),
      description: categoryFormValues.description?.trim() || "",
    };

    const id = categoryFormTarget?.id ?? categoryFormTarget?.category_id ?? categoryFormTarget?.categoryId ?? null;
    const isEdit = categoryFormMode === "edit" && id;

    const req = isEdit ? updateCategory(id, payload) : createCategory(payload);

    req
      .then((data) => {
        const newId = id ?? data?.category_id ?? data?.id ?? data?.categoryId;
        logActivity({
          actor: user,
          action: isEdit ? "update" : "create",
          module: ACTIVITY_MODULES.CATEGORY,
          entityId: newId,
          entityLabel: payload.category_name,
          before: isEdit ? categoryFormTarget : null,
          after: { ...payload, ...(data && typeof data === "object" ? data : {}) },
        });
        setIsCategoryFormOpen(false);
        handleRetry();
      })
      .catch((error) => setCategoryFormError(error.message || "Something went wrong."))
      .finally(() => setIsSavingCategory(false));
  }

  function handleOpenDeleteCategory(categoryRecord) {
    setCategoryToDelete(categoryRecord);
    setDeleteCategoryError(null);
  }

  function handleCloseDeleteCategory() {
    setCategoryToDelete(null);
  }

  function handleConfirmDeleteCategory() {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    setDeleteCategoryError(null);

    const id = categoryToDelete?.id ?? categoryToDelete?.category_id ?? categoryToDelete?.categoryId ?? null;

    deleteCategory(id)
      .then(() => {
        logActivity({
          actor: user,
          action: "delete",
          module: ACTIVITY_MODULES.CATEGORY,
          entityId: id,
          entityLabel:
            categoryToDelete?.category_name || categoryToDelete?.category || categoryToDelete?.label || `Category ${id}`,
          before: categoryToDelete,
        });
        setCategoryToDelete(null);
        handleRetry();
      })
      .catch((error) => setDeleteCategoryError(error.message || "Something went wrong."))
      .finally(() => setIsDeletingCategory(false));
  }

  function handleOpenColumnsPicker(categoryId, categoryLabel) {
    if (!categoryId) return;

    setColumnsPickerCategoryId(categoryId);
    setColumnsPickerCategoryLabel(categoryLabel || "");
    setColumnsPickerError(null);
    setIsColumnsPickerOpen(true);
    setIsColumnsPickerLoading(true);

    const fieldsRequest =
      availableViewFields.length > 0 ? Promise.resolve(availableViewFields) : fetchAvailableViewFields().then(normalizeAvailableFields);

    const typesRequest =
      customFieldTypes.length > 0
        ? Promise.resolve(customFieldTypes)
        : fetchCustomFieldTypes().then(normalizeCustomFieldTypes).catch(() => []);

    Promise.all([
      fieldsRequest,
      fetchViewColumns(categoryId).then(normalizeViewColumns).catch(() => []),
      fetchCustomFields(categoryId).catch(() => null),
      typesRequest,
    ])
      .then(([fields, currentColumns, customFieldsData, types]) => {
        setAvailableViewFields(fields);
        let selectedKeys = currentColumns.map((column) => column.key);
        // The backend requires at least one standard column per category —
        // custom fields alone don't satisfy it. Pre-tick a sensible default
        // for a brand-new category so the picker is savable right away
        // instead of blocking on a rule the user has no reason to expect.
        if (selectedKeys.length === 0) {
          const fallback = fields.find((f) => f.key === "status") || fields.find((f) => f.key === "remark") || fields[0];
          if (fallback) selectedKeys = [fallback.key];
        }
        setColumnsPickerSelectedKeys(selectedKeys);
        setColumnsPickerCustomFields(normalizeCustomFields(customFieldsData));
        setReusableCustomFields(normalizeCustomFields(customFieldsData?.available_to_add));
        if (types.length > 0) setCustomFieldTypes(types);
      })
      .catch((error) => setColumnsPickerError(error.message || "Could not load fields."))
      .finally(() => setIsColumnsPickerLoading(false));
  }

  function handleToggleColumnField(key) {
    setColumnsPickerSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function handleReopenFormIfNeeded() {
    if (!columnsPickerReopenEquipmentForm) return;
    setColumnsPickerReopenEquipmentForm(false);
    setIsFormOpen(true);
  }

  function handleCloseColumnsPicker() {
    setIsColumnsPickerOpen(false);
    setColumnsPickerCategoryId(null);
    setColumnsPickerError(null);
    handleReopenFormIfNeeded();
  }

  function handleSaveColumnsPicker() {
    if (!columnsPickerCategoryId) return;

    setIsSavingColumns(true);
    setColumnsPickerError(null);

    const payload = columnsPickerSelectedKeys.map((key, index) => {
      const field = availableViewFields.find((item) => item.key === key);
      return { field: key, header: field?.label || key, sort_order: index + 1 };
    });

    saveViewColumns(columnsPickerCategoryId, payload)
      .then(() => {
        setIsColumnsPickerOpen(false);
        handleRetry();
        refreshOpenFormFields(columnsPickerCategoryId);
        handleReopenFormIfNeeded();
      })
      .catch((error) => setColumnsPickerError(error.message || "Could not save columns."))
      .finally(() => setIsSavingColumns(false));
  }

  function refreshOpenFormFields(categoryId) {
    if (!isFormOpen && !columnsPickerReopenEquipmentForm) return;

    const openCategoryId =
      formMode === "edit"
        ? formTarget?.__category_id ?? resolveCategoryId(formTarget?.category || formTarget?.category_name)
        : resolveCategoryId(formValues.category);

    if (openCategoryId == null || openCategoryId !== categoryId) return;

    Promise.all([
      fetchViewColumns(categoryId).then(normalizeViewColumns).catch(() => []),
      fetchCustomFields(categoryId).then(normalizeCustomFields).catch(() => []),
    ]).then(([standardColumns, customFields]) => {
      const standardFields = getEquipmentFormFieldsFromColumns(standardColumns) || [];
      const extraCustomFields = customFields.filter((field) => !standardFields.some((item) => item.key === field.key));
      const mergedFields = [...standardFields, ...extraCustomFields];

      setFormFields(mergedFields);
      setFormValues((current) => {
        const next = buildEquipmentFormValues(mergedFields, {});
        mergedFields.forEach(({ key }) => {
          if (current[key] !== undefined) next[key] = current[key];
        });
        next.category = current.category;
        next.status = current.status;
        next.remark = current.remark;
        return next;
      });
    });
  }

  return {
    categories,
    category,
    tableColumns,
    isLoading,
    error,
    handleRetry,
    resetForEntry,
    items,
    isItemsLoading,
    itemsError,
    statuses,
    handleViewCategory,
    handleSelectCategory,
    formCategoryOptions,
    isFormOpen,
    formMode,
    formTarget,
    formFields,
    formValues,
    isSaving,
    formError,
    handleOpenAddItem,
    handleOpenEditItem,
    handleCloseForm,
    handleFormFieldChange,
    handleRemoveField,
    handleSubmitForm,
    equipmentToUnassign,
    isUnassigning,
    unassignError,
    handleOpenUnassign,
    handleCloseUnassign,
    handleConfirmUnassign,
    equipmentToDelete,
    isDeleting,
    deleteError,
    handleOpenDelete,
    handleCloseDelete,
    handleConfirmDelete,
    isSoftwareLicensePickerOpen,
    softwareLicenseOptions,
    isSoftwareLicenseOptionsLoading,
    softwareLicenseOptionsError,
    licenseSelectedIds,
    handleOpenSoftwareLicensePicker,
    handleCloseSoftwareLicensePicker,
    handleToggleSoftwareLicenseSelection,
    handleOpenColumnsPickerFromForm,
    isCategoryFormOpen,
    categoryFormMode,
    categoryFormValues,
    isSavingCategory,
    categoryFormError,
    handleOpenAddCategory,
    handleOpenEditCategory,
    handleCloseCategoryForm,
    handleCategoryFormFieldChange,
    handleSubmitCategoryForm,
    categoryToDelete,
    isDeletingCategory,
    deleteCategoryError,
    handleOpenDeleteCategory,
    handleCloseDeleteCategory,
    handleConfirmDeleteCategory,
    isColumnsPickerOpen,
    columnsPickerCategoryLabel,
    availableViewFields,
    customFieldTypes,
    isColumnsPickerLoading,
    columnsPickerSelectedKeys,
    columnsPickerCustomFields,
    reusableCustomFields,
    isSavingColumns,
    columnsPickerError,
    setColumnsPickerError,
    handleToggleColumnField,
    handleAddCustomFieldFromPicker,
    handleRemoveCustomFieldFromPicker,
    handleReuseCustomFieldFromPicker,
    handleSaveColumnsPicker,
    handleCloseColumnsPicker,
    resolveCategoryId,
    resolveView,
  };
}
