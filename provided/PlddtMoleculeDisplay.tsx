// @ts-nocheck
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LoadingIcon } from "../ui/loadingicon";
const MoleculeViewer2 = dynamic(
  () => import("../../components/molstar/MoleculeViewer2"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-32 items-center justify-around">
        <LoadingIcon size="lg" />{" "}
      </div>
    ),
  },
);

export type MoleculePayload = {
  pdbString: string;
  sasaValues?: number[];
  ssValues?: ProteinStructureShorthand[];
  plddt?: number[];
};

export enum ColoringScheme {
  PLDDT = "plddt",
  SASA = "sasa",
  SS = "ss",
}


const PlddtMoleculeDisplay = ({
  moleculePayloads,
  showSequenceComponent,
  inverseFoldOnclick,
  downloadAllOnClick,
}: {
  moleculePayloads: MoleculePayload[];
  showSequenceComponent?: boolean;
  inverseFoldOnclick?: (e: any) => Promise<void>;
  downloadAllOnClick?: () => Promise<void>;
}) => {
  const [moleculeIndexToShow, setMoleculeIndexToShow] = useState<number>(0);

  // memoize the molecular viewer to only rerender when the debounced selection changes
  // otherwise the molecular viewer will flicker

  if (showSequenceComponent === undefined) {
    showSequenceComponent = true;
  }

  const supportedColorSchemes: ColoringScheme[] = [];
  // assuming if the first payload has an attribute, they all do
  const firstPayload = moleculePayloads[0];
  if (firstPayload?.plddt && firstPayload?.plddt.length > 0) {
    supportedColorSchemes.push(ColoringScheme.PLDDT);
  }
  if (firstPayload?.sasaValues && firstPayload?.sasaValues.length > 0) {
    supportedColorSchemes.push(ColoringScheme.SASA);
  }
  if (firstPayload?.ssValues && firstPayload?.ssValues.length > 0) {
    supportedColorSchemes.push(ColoringScheme.SS);
  }

  const memoizedMolecularViewer = useMemo(
    () => (
      <MoleculeViewer2
        moleculePayloads={moleculePayloads}
        className="min-h-[700px]"
        showSequenceComponent={showSequenceComponent}
        inverseFoldOnclick={inverseFoldOnclick}
        downloadAllOnClick={downloadAllOnClick}
        moleculeIndexToShow={moleculeIndexToShow}
        setMoleculeIndexToShow={setMoleculeIndexToShow}
      />
    ),
    [moleculePayloads, moleculeIndexToShow],
  );
  return (
    <section className="pb-2 pt-4 px-4 flex flex-col justify-start bg-white">
      <div className="flex-1 lg:w-[880px] w-[600px]">
        {memoizedMolecularViewer}
      </div>
    </section>
  );
};
export default PlddtMoleculeDisplay;
