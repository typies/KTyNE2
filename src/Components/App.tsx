import Sidebar from "./Sidebar";
import { useCallback, useEffect, useReducer, useState } from "react";
import Manuals from "./Manuals";
import Notepad from "./Notepad";
import Header from "./Header";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { OpenManual } from "../Utils/Types";
import { getManualUrl } from "../Utils/ModSearchUtils";
import { Settings } from "lucide-react";
import CustomDialog, { CustomDialogTitle } from "./CustomDialog";
import SettingsPopup from "./SettingsPopup";

type ManualsAction =
  | { type: "set"; value: Map<string, OpenManual> }
  | { type: "close"; modName: string }
  | { type: "clear" }
  | { type: "resetIds" }
  | { type: "open"; modName: string; manualUrl: string; currentManual: string | null; onClearCurrent?: () => void };

function toCleanMap(input: unknown): Map<string, OpenManual> {
  const clean = new Map<string, OpenManual>();
  if (!(input instanceof Map)) return clean;
  input.forEach((val, key) => {
    if (
      typeof key === "string" &&
      val &&
      typeof val === "object" &&
      typeof (val as OpenManual).manualUrl === "string"
    ) {
      clean.set(key, {
        id:
          typeof (val as OpenManual).id === "string" && (val as OpenManual).id
            ? (val as OpenManual).id
            : String(crypto.randomUUID()),
        manualUrl: (val as OpenManual).manualUrl,
      });
    }
  });
  return clean;
}

function manualsReducer(
  state: Map<string, OpenManual>,
  action: ManualsAction
): Map<string, OpenManual> {
  const current = toCleanMap(state);

  switch (action.type) {
    case "set":
      return toCleanMap(action.value);

    case "close": {
      const next = new Map<string, OpenManual>();
      current.forEach((v, k) => {
        if (k !== action.modName) next.set(k, v);
      });
      return next;
    }

    case "clear":
      return new Map<string, OpenManual>();

    case "resetIds": {
      const next = new Map<string, OpenManual>();
      current.forEach((v, k) => {
        next.set(k, {
          id: String(crypto.randomUUID()),
          manualUrl: v.manualUrl,
        });
      });
      return next;
    }

    case "open": {
      const next = new Map<string, OpenManual>();
      current.forEach((v, k) => next.set(k, v));

      const modLimit = 250;
      if (next.size >= modLimit) {
        const oldestKey = next.keys().next().value;
        if (typeof oldestKey === "string") {
          if (action.currentManual === oldestKey && action.onClearCurrent) {
            action.onClearCurrent();
          }
          next.delete(oldestKey);
        }
      }

      next.set(action.modName, {
        id: String(crypto.randomUUID()),
        manualUrl: action.manualUrl,
      });
      return next;
    }

    default:
      return current;
  }
}

function App() {
  const [currentManual, setCurrentManual] = useState<string | null>(null);
  const [openManuals, dispatchManuals] = useReducer(
    manualsReducer,
    undefined,
    () => new Map<string, OpenManual>()
  );
  const [iframeCovered, setIframeCovered] = useState<boolean>(false);
  const [settingsDialog, setSettingsDialog] = useState<boolean>(false);

  const safeManuals = toCleanMap(openManuals);

  const setOpenManuals = useCallback((next: Map<string, OpenManual>) => {
    dispatchManuals({ type: "set", value: next });
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("KTyNE:openManuals");
      if (!raw || raw === "true" || raw === "false") {
        window.localStorage.removeItem("KTyNE:openManuals");
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const restored = new Map<string, OpenManual>();
        for (const [k, v] of Object.entries(parsed)) {
          if (v && typeof v === "object" && typeof (v as OpenManual).manualUrl === "string") {
            restored.set(k, {
              id:
                typeof (v as OpenManual).id === "string" && (v as OpenManual).id
                  ? (v as OpenManual).id
                  : String(crypto.randomUUID()),
              manualUrl: (v as OpenManual).manualUrl,
            });
          }
        }
        if (restored.size > 0) {
          dispatchManuals({ type: "set", value: restored });
        }
      }
    } catch {
      // Ignore bad storage entries
    }
  }, []);

  useEffect(() => {
    try {
      const obj: Record<string, OpenManual> = {};
      safeManuals.forEach((value, key) => {
        obj[key] = value;
      });
      window.localStorage.setItem("KTyNE:openManuals", JSON.stringify(obj));
    } catch {
      // Ignore storage write errors
    }
  }, [safeManuals]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        window.localStorage.getItem("KTyNE:setting-pageCloseConfirmation") ===
        "true"
      ) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const memoizedHandleModClose = useCallback(
    (modToClose: string, isCurrent: boolean) => {
      if (isCurrent) {
        setCurrentManual(null);
      }
      dispatchManuals({ type: "close", modName: modToClose });
    },
    []
  );

  const closeAllManuals = useCallback(() => {
    setCurrentManual(null);
    dispatchManuals({ type: "clear" });
  }, []);

  const resetAllManuals = useCallback(() => {
    setCurrentManual(null);
    dispatchManuals({ type: "resetIds" });
  }, []);

  const memoizedHandleModChange = useCallback(
    (modName: string, isCurrent: boolean): void => {
      if (isCurrent) setCurrentManual(null);
      else setCurrentManual(modName);
    },
    []
  );

  const handleOpenMod = useCallback(
    (modName: string, manualUrl: string, preventChange: boolean = false) => {
      const resolvedUrl = manualUrl || getManualUrl(modName);
      dispatchManuals({
        type: "open",
        modName,
        manualUrl: resolvedUrl,
        currentManual,
        onClearCurrent: () => setCurrentManual(null),
      });
      if (!preventChange) setCurrentManual(modName);
    },
    [currentManual]
  );

  const sidebarManuals: string[] = [];
  safeManuals.forEach((_v, k) => sidebarManuals.push(k));

  return (
    <div className="h-screen flex flex-col font-[special-elite] relative overflow-hidden no-scrollbar">
      <Header
        setIframeCovered={setIframeCovered}
        openManuals={safeManuals}
        setOpenManuals={setOpenManuals}
        currentManual={currentManual}
        setCurrentManual={setCurrentManual}
      />
      <Settings
        className="absolute fill-white top-1 right-1 opacity-15 hover:opacity-100 hover:cursor-pointer"
        onClick={() => setSettingsDialog(true)}
      />
      <CustomDialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
      >
        <div>
          <CustomDialogTitle>Settings</CustomDialogTitle>
          <SettingsPopup />
        </div>
      </CustomDialog>
      <main className="flex-1 flex bg-(--color-bg) overflow-hidden">
        <Sidebar
          handleOpenMod={handleOpenMod}
          setIframeCovered={setIframeCovered}
          openManuals={sidebarManuals}
          currentManual={currentManual}
          handleModChange={memoizedHandleModChange}
          handleModClose={memoizedHandleModClose}
          closeAllManuals={closeAllManuals}
          resetAllManuals={resetAllManuals}
        />
        <PanelGroup direction="horizontal">
          <Panel
            defaultSize={55}
            className="border-l-2 border-r-2 border-black"
            id="manual-window"
          >
            <Manuals
              currentManual={currentManual}
              openManuals={safeManuals}
              covered={iframeCovered}
            />
          </Panel>
          <PanelResizeHandle />
          <Panel collapsible minSize={5} maxSize={95} id="notepad-window">
            <Notepad />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}

export default App;
