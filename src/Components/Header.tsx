import { ReactNode, useState } from "react";
import Popups, { HeaderButton } from "./Popups";
import { OpenManual } from "../Utils/Types";
import CustomDialog, {
  CustomDialogButton,
  CustomDialogTitle,
} from "./CustomDialog";

function toSafeEntries(
  openManuals: Map<string, OpenManual> | unknown
): Array<[string, OpenManual]> {
  if (openManuals instanceof Map) {
    return Array.from(openManuals.entries());
  }
  if (Array.isArray(openManuals)) {
    return openManuals.filter(
      (entry): entry is [string, OpenManual] =>
        Array.isArray(entry) && typeof entry[0] === "string" && Boolean(entry[1])
    );
  }
  if (openManuals && typeof openManuals === "object") {
    return Object.entries(openManuals).filter(
      (entry): entry is [string, OpenManual] => Boolean(entry[1])
    );
  }
  return [];
}

const Header = ({
  setIframeCovered,
  openManuals,
  setOpenManuals,
  currentManual,
  setCurrentManual,
}: {
  setIframeCovered: (bool: boolean) => void;
  openManuals: Map<string, OpenManual>;
  setOpenManuals: (next: Map<string, OpenManual>) => void;
  currentManual: string | null;
  setCurrentManual: (name: string | null) => void;
}) => {
  const [edgework, setEdgework] = useState<ReactNode>(null);
  const [editOpen, setEditOpen] = useState(false);

  const entries = toSafeEntries(openManuals);

  return (
    <header className="bg-jet flex items-center p-2 gap-2 flex-wrap">
      <Popups setEdgework={setEdgework} setIframeCovered={setIframeCovered} />
      <HeaderButton onClick={() => setEditOpen(true)}>Edit Manuals</HeaderButton>
      <div className="ml-auto">{edgework}</div>

      <CustomDialog open={editOpen} onClose={() => setEditOpen(false)}>
        <CustomDialogTitle>Edit Manuals</CustomDialogTitle>
        <div className="space-y-2 min-w-[300px] max-h-[60vh] overflow-y-auto mb-4">
          {entries.map(([name, manual], idx, arr) => (
            <div
              key={manual.id}
              className="flex items-center justify-between gap-2 border p-2 rounded"
            >
              <span className="truncate font-bold">{name}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => {
                    const list = toSafeEntries(openManuals);
                    if (idx <= 0 || idx >= list.length) return;
                    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
                    setOpenManuals(new Map(list));
                  }}
                  className="px-2 py-1 border rounded disabled:opacity-30 cursor-pointer"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === arr.length - 1}
                  onClick={() => {
                    const list = toSafeEntries(openManuals);
                    if (idx < 0 || idx >= list.length - 1) return;
                    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
                    setOpenManuals(new Map(list));
                  }}
                  className="px-2 py-1 border rounded disabled:opacity-30 cursor-pointer"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextName = window.prompt("Rename manual tab:", name);
                    if (!nextName || !nextName.trim() || nextName.trim() === name)
                      return;
                    const trimmed = nextName.trim();
                    const nextMap = new Map<string, OpenManual>();
                    for (const [k, v] of toSafeEntries(openManuals)) {
                      nextMap.set(k === name ? trimmed : k, v);
                    }
                    setOpenManuals(nextMap);
                    if (currentManual === name) setCurrentManual(trimmed);
                  }}
                  className="px-2 py-1 border rounded cursor-pointer"
                >
                  Rename
                </button>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-center text-gray-500">No manuals open.</p>
          )}
        </div>
        <div className="text-center">
          <CustomDialogButton
            onClick={() => setEditOpen(false)}
            className="max-w-fit"
          >
            Close
          </CustomDialogButton>
        </div>
      </CustomDialog>
    </header>
  );
};

export default Header;
