import { OpenManual } from "../Utils/Types";

function getManualEntries(
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

const Manuals = ({
  covered = false,
  currentManual,
  openManuals,
}: {
  covered: boolean;
  currentManual: string | null;
  openManuals: Map<string, OpenManual>;
}) => {
  const openManualsList = getManualEntries(openManuals);
  return (
    <>
      <div
        className={`absolute h-full w-full bg-transparent ${
          covered ? "" : "hidden"
        }`}
      ></div>
      <div
        className={`h-full min-w-[360px] ${
          currentManual ? "bg-white" : "bg-[url(/images/web-background.jpg)]"
        }`}
      >
        {openManualsList.length > 0 &&
          openManualsList.map(([name, manual]) => (
            <ManualIframe
              key={manual.id}
              name={name}
              manualUrl={manual.manualUrl}
              isCurrentManual={currentManual === name}
            />
          ))}
      </div>
    </>
  );
};

const ManualIframe = ({
  manualUrl,
  isCurrentManual,
}: {
  name: string;
  manualUrl: string;
  isCurrentManual: boolean;
}) => {
  return (
    <iframe
      src={manualUrl}
      className={isCurrentManual ? "w-full h-full" : "hidden"}
    ></iframe>
  );
};

export default Manuals;
