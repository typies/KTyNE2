import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, Pencil, RotateCcw, X } from "lucide-react";
import { OpenManual } from "../Utils/Types";
import CustomDialog, {
  CustomDialogButton,
  CustomDialogTitle,
} from "./CustomDialog";

interface EditManualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openManuals: Map<string, OpenManual>;
  onSaveManuals: (
    nextManuals: Map<string, OpenManual>,
    renameMap: Map<string, string>
  ) => void;
}

interface EditableManualRow {
  keyName: string;
  displayName: string;
  originalName: string;
  manualUrl: string;
  id: string;
}

const EditManualsModal = ({
  isOpen,
  onClose,
  openManuals,
  onSaveManuals,
}: EditManualsModalProps) => {
  const [rows, setRows] = useState<EditableManualRow[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string>("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initialRows: EditableManualRow[] = Array.from(openManuals.entries()).map(
      ([name, manual]) => ({
        keyName: name,
        displayName: name,
        originalName: manual.originalName ?? name,
        manualUrl: manual.manualUrl,
        id: manual.id,
      })
    );
    setRows(initialRows);
    setEditingKey(null);
    setDraftName("");
    setErrorMsg(null);
  }, [isOpen, openManuals]);

  const moveRow = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= rows.length || fromIndex === toIndex) return;
    setErrorMsg(null);
    setRows((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  const startRename = (row: EditableManualRow) => {
    setErrorMsg(null);
    setEditingKey(row.keyName);
    setDraftName(row.displayName);
  };

  const commitRename = (keyName: string) => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setErrorMsg("Manual tab name cannot be empty.");
      return;
    }

    const duplicate = rows.some(
      (r) => r.keyName !== keyName && r.displayName.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setErrorMsg(`A manual tab named "${trimmed}" already exists.`);
      return;
    }

    setErrorMsg(null);
    setRows((prev) =>
      prev.map((r) => (r.keyName === keyName ? { ...r, displayName: trimmed } : r))
    );
    setEditingKey(null);
    setDraftName("");
  };

  const resetSingleName = (keyName: string) => {
    setErrorMsg(null);
    setRows((prev) =>
      prev.map((r) =>
        r.keyName === keyName ? { ...r, displayName: r.originalName } : r
      )
    );
    if (editingKey === keyName) {
      setEditingKey(null);
      setDraftName("");
    }
  };

  const handleSave = () => {
    // If user was actively editing a row and hit Save, commit it first if valid
    let workingRows = [...rows];
    if (editingKey !== null) {
      const trimmed = draftName.trim();
      if (!trimmed) {
        setErrorMsg("Finish or cancel your rename before saving (name cannot be empty).");
        return;
      }
      const duplicate = workingRows.some(
        (r) => r.keyName !== editingKey && r.displayName.toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        setErrorMsg(`A manual tab named "${trimmed}" already exists.`);
        return;
      }
      workingRows = workingRows.map((r) =>
        r.keyName === editingKey ? { ...r, displayName: trimmed } : r
      );
    }

    const nextMap = new Map<string, OpenManual>();
    const renameMap = new Map<string, string>();

    for (const row of workingRows) {
      nextMap.set(row.displayName, {
        id: row.id,
        manualUrl: row.manualUrl,
        originalName: row.originalName,
      });
      if (row.keyName !== row.displayName) {
        renameMap.set(row.keyName, row.displayName);
      }
    }

    onSaveManuals(nextMap, renameMap);
    onClose();
  };

  return (
    <CustomDialog open={isOpen} onClose={onClose}>
      <div className="w-[min(90vw,520px)] max-h-[75vh] flex flex-col">
        <CustomDialogTitle>Edit Manuals</CustomDialogTitle>

        {errorMsg && (
          <div className="mb-3 px-3 py-2 rounded-md border border-red-600 bg-red-100 text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-5">
          {rows.length === 0 ? (
            <div className="text-center text-gray-600 py-8 border-2 border-dashed border-gray-300 rounded-lg">
              No manuals are currently open.
            </div>
          ) : (
            rows.map((row, index) => {
              const isEditing = editingKey === row.keyName;
              const isRenamed = row.displayName !== row.originalName;

              return (
                <div
                  key={row.id}
                  draggable={!isEditing}
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== index) {
                      moveRow(dragIndex, index);
                    }
                    setDragIndex(null);
                  }}
                  className="flex items-center gap-2 p-2 border-2 border-black rounded-lg bg-gray-50"
                >
                  <span
                    className="cursor-grab text-gray-500 hover:text-black"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>

                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveRow(index, index - 1)}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, index + 1)}
                      disabled={index === rows.length - 1}
                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draftName}
                        autoFocus
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitRename(row.keyName);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setEditingKey(null);
                            setDraftName("");
                            setErrorMsg(null);
                          }
                        }}
                        className="w-full px-2 py-1 border-2 border-black rounded bg-white text-sm"
                      />
                    ) : (
                      <div className="truncate">
                        <span className="font-bold text-sm">{row.displayName}</span>
                        {isRenamed && (
                          <span className="ml-2 text-xs text-gray-500">
                            (was: {row.originalName})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => commitRename(row.keyName)}
                        className="p-1.5 rounded border border-black bg-green-100 hover:bg-green-200 cursor-pointer"
                        title="Confirm name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingKey(null);
                          setDraftName("");
                          setErrorMsg(null);
                        }}
                        className="p-1.5 rounded border border-black bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        title="Cancel rename"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startRename(row)}
                        className="p-1.5 rounded border border-black bg-white hover:bg-gray-200 cursor-pointer"
                        title="Rename manual"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isRenamed && (
                        <button
                          type="button"
                          onClick={() => resetSingleName(row.keyName)}
                          className="p-1.5 rounded border border-black bg-white hover:bg-gray-200 cursor-pointer"
                          title="Reset to original name"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <CustomDialogButton onClick={onClose} className="max-w-32">
            Cancel
          </CustomDialogButton>
          <CustomDialogButton onClick={handleSave} className="max-w-32 font-bold">
            Save
          </CustomDialogButton>
        </div>
      </div>
    </CustomDialog>
  );
};

export default EditManualsModal;