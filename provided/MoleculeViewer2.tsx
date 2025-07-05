// @ts-nocheck
// TODO(cmishra): One day i will reorganize this file...

import { Text } from "@radix-ui/themes";
import { mmCIF_Database } from "molstar/lib/mol-io/reader/cif/schema/mmcif";
import { MmcifFormat } from "molstar/lib/mol-model-formats/structure/mmcif";
import { CustomElementProperty } from "molstar/lib/mol-model-props/common/custom-element-property";
import { CustomModelProperty } from "molstar/lib/mol-model-props/common/custom-model-property";
import { CustomPropertyDescriptor } from "molstar/lib/mol-model/custom-property";
import { ElementIndex, Model } from "molstar/lib/mol-model/structure";
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";

import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { DefaultPluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { Color } from "molstar/lib/mol-util/color";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BehaviorSubject, Subscription } from "rxjs";
import {
  ColoringScheme,
  PLDDT_COLOR_BUCKETS,
  ProteinStructureShorthand3,
  SS3_COLOR_HEX_MAP,
  SS3_SHORTHAND_TO_STRUCTURE,
  SS8_SHORTHAND_TO_STRUCTURE,
} from "~/consts";
import { MoleculePayload, ProteinStructureShorthand } from "~/types";
import { range } from "~/utils/misc";
import { cn } from "../ui/utils";
import {
  ActiveColorSchemeStateKey,
  COLOR_BY_SASA_CONFIG,
  COLOR_BY_SS_CONFIG,
  DOWNLOAD_ALL_ONCLICK,
  INVERSE_FOLD_TOOL_ONCLICK,
  MoleculeIndexToShowStateKey,
  SequenceViewCustom,
  SET_MOLECULE_INDEX_TO_SHOW,
  SHOW_SEQUENCE_COMPONENT,
} from "./SequenceViewCustom";
import { ViewportOverall } from "./ViewportOverall";

export const PlddtColoring = CustomElementProperty.create<number>({
  label: "pLDDT",
  name: ColoringScheme.PLDDT,
  getData(model: Model) {
    const map = new Map<ElementIndex, number>();
    if (!model || !MmcifFormat.is(model.sourceData)) return { value: map };
    const { db } = model.sourceData.data as { db: mmCIF_Database };
    const perAtomPlddt = range(db.atom_site._rowCount).map((i) =>
      db.atom_site.B_iso_or_equiv.value(i),
    );

    perAtomPlddt.forEach((plddt, i) => {
      map.set(i as ElementIndex, plddt);
    });

    return { value: map };
  },
  coloring: {
    getColor(e: number) {
      const { color } = PLDDT_COLOR_BUCKETS.find(
        (bucket) => e >= bucket.lowerBound,
      )!;
      return Color.fromHexStyle(color);
    },
    // blank-ish color for residues with no pLDDT
    defaultColor: Color.fromHexStyle("#b9bbc6"),
  },
  getLabel(e: number) {
    return `<br/>pLDDT: ${e}`;
  },
});

const SASA_COLOR_SCALE = [
  // Adjusted blue scale
  { lowerBound: 125, color: "#0284C7", label: ">125" }, // Dark Sky Blue
  { lowerBound: 80, color: "#0EA5E9", label: ">80" }, // Deeper Sky Blue
  { lowerBound: 50, color: "#38BDF8", label: ">50" }, // Bright Sky Blue
  { lowerBound: 25, color: "#7DD3FC", label: ">25" }, // Sky Blue
  { lowerBound: 10, color: "#BAE6FD", label: ">10" }, // Lighter Sky Blue
  { lowerBound: 0, color: "#E0F2FE", label: "0" }, // Light Sky Blue
];

type SASAPropertyValue = (number | undefined)[];
type SASAPropertyParams = { value: PD.Value<SASAPropertyValue> };
const SASA_PROPERTY_NAME = "esm_sasa_prediction" as const;

export const SASAPropertyProvider = CustomModelProperty.createProvider<
  SASAPropertyParams,
  SASAPropertyValue
>({
  label: "SASA",
  descriptor: CustomPropertyDescriptor({
    name: SASA_PROPERTY_NAME,
  }),
  type: "static",
  defaultParams: {
    value: PD.Value<SASAPropertyValue>([]),
  },
  getParams: () => ({
    value: PD.Value<SASAPropertyValue>([]),
  }),
  isApplicable: (model) => {
    return true;
  },
  obtain: async (_, model, params) => {
    const sasaValues = params.value;
    return { value: sasaValues };
  },
});

export const SASAColoring = CustomElementProperty.create<number>({
  label: "SASA",
  name: ColoringScheme.SASA,
  getData(model: Model) {
    const map = new Map<ElementIndex, number>();

    // Get the custom SASA data from model
    const sasaValues = SASAPropertyProvider.get(model)?.value as
      | number[]
      | undefined;
    if (!sasaValues) return { value: map };

    // Assign SASA values to each atom based on its residue
    const { residueAtomSegments } = model.atomicHierarchy;
    const atomCount = model.atomicHierarchy.atoms._rowCount;

    for (let atomI = 0 as ElementIndex; atomI < atomCount; atomI++) {
      const residueI = residueAtomSegments.index[atomI];
      const sasaValue = sasaValues[residueI as number];

      if (sasaValue !== undefined) {
        map.set(atomI, sasaValue);
      }
    }

    return { value: map };
  },
  coloring: {
    getColor(sasa: number) {
      // Find appropriate color based on SASA value
      const relevantBucket = SASA_COLOR_SCALE.find(
        (bucket) => sasa >= bucket.lowerBound,
      );
      if (!relevantBucket) {
        return Color.fromHexStyle("#CCCCCC");
      }
      const { color } = relevantBucket;

      return Color.fromHexStyle(color);
    },
    defaultColor: Color.fromHexStyle("#CCCCCC"), // Gray for residues with no SASA value
  },
  getLabel(sasa: number) {
    return `<br/>SASA: ${sasa.toFixed(2)}`;
  },
});

type SSPropertyValue = ProteinStructureShorthand[];
type SSPropertyParams = { value: PD.Value<SSPropertyValue> };
const SS_PROPERTY_NAME = "esm_ss_prediction" as const;

export const SSPropertyProvider = CustomModelProperty.createProvider<
  SSPropertyParams,
  SSPropertyValue
>({
  label: "SS3",
  descriptor: CustomPropertyDescriptor({
    name: SS_PROPERTY_NAME,
  }),
  type: "static",
  defaultParams: {
    value: PD.Value<SSPropertyValue>([]),
  },
  getParams: () => ({
    value: PD.Value<SSPropertyValue>([]),
  }),
  isApplicable: (_) => {
    return true;
  },
  obtain: async (_, __, params) => {
    const ssValues = params.value;
    return { value: ssValues };
  },
});

export const SSColoring =
  CustomElementProperty.create<ProteinStructureShorthand3>({
    label: "SS",
    name: ColoringScheme.SS,
    getData(model: Model) {
      const map = new Map<ElementIndex, ProteinStructureShorthand3>();

      // Get the custom SASA data from model
      const ssValues = SSPropertyProvider.get(model)?.value as
        | ProteinStructureShorthand3[]
        | undefined;
      if (!ssValues) return { value: map };

      // Assign SASA values to each atom based on its residue
      const { residueAtomSegments } = model.atomicHierarchy;
      const atomCount = model.atomicHierarchy.atoms._rowCount;

      for (let atomI = 0 as ElementIndex; atomI < atomCount; atomI++) {
        const residueI = residueAtomSegments.index[atomI];
        const ssValue = ssValues[residueI as number];

        if (ssValue !== undefined) {
          map.set(atomI, ssValue);
        }
      }
      return { value: map };
    },
    coloring: {
      getColor(ss3: ProteinStructureShorthand3) {
        const color = Color.fromHexStyle(
          SS3_COLOR_HEX_MAP[SS3_SHORTHAND_TO_STRUCTURE[ss3]],
        );
        return color;
      },
      defaultColor: Color.fromHexStyle("#CCCCCC"), // Gray for residues with no ss3 value
    },
    getLabel(ss: ProteinStructureShorthand3) {
      return `<br/>${SS8_SHORTHAND_TO_STRUCTURE[ss as ProteinStructureShorthand3]
        }`;
    },
  });

export function Legend({
  activeColorScheme,
}: {
  activeColorScheme: ColoringScheme;
}) {
  const arrToDisplay =
    activeColorScheme === ColoringScheme.PLDDT
      ? PLDDT_COLOR_BUCKETS
      : activeColorScheme === ColoringScheme.SASA
        ? SASA_COLOR_SCALE
        : Object.entries(SS3_COLOR_HEX_MAP).map(([key, value]) => ({
          label: key,
          color: value,
        }));
  return (
    <div className="flex gap-2 bg-gradient-to-t from-white via-80% via-white p-2">
      {arrToDisplay.map((item) => (
        <div key={item.label} className="flex gap-2 items-center">
          <div
            className={cn("h-5 w-5 rounded-md")}
            style={{ backgroundColor: item.color }}
          />
          <Text size="2">{item.label}</Text>
        </div>
      ))}
    </div>
  );
}

export class ViewportControlsCustom extends PluginUIComponent {
  private colorSchemeSub?: Subscription;

  componentDidMount() {
    const customState = this.plugin.customState as any;

    this.colorSchemeSub = customState[ActiveColorSchemeStateKey]?.subscribe(
      () => {
        this.setState({});
      },
    );
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.colorSchemeSub?.unsubscribe();
  }

  render() {
    const activeColorScheme =
      (this.plugin.customState as any)[ActiveColorSchemeStateKey]?.value ??
      ColoringScheme.PLDDT;

    const supportedColorSchemes = [ColoringScheme.PLDDT];

    const isSasaColoringEnabled = this.plugin.config.get(COLOR_BY_SASA_CONFIG);
    const isSsColoringEnabled = this.plugin.config.get(COLOR_BY_SS_CONFIG);
    if (isSasaColoringEnabled) {
      supportedColorSchemes.push(ColoringScheme.SASA);
    }
    if (isSsColoringEnabled) {
      supportedColorSchemes.push(ColoringScheme.SS);
    }

    return (
      <div className="text-black bottom-0 absolute w-full flex justify-center">
        <Legend activeColorScheme={activeColorScheme} />
      </div>
    );
  }
}

async function createViewer(
  root: HTMLDivElement,
  doesAnyPayloadHaveSasa: boolean,
  doesAnyPayloadHaveSs: boolean,
  showSequenceComponent?: boolean,
  inverseFoldOnclick?: (e: any) => Promise<void>,
  downloadAllOnClick?: () => Promise<void>,
  setMoleculeIndexToShow?: (index: number) => void,
) {
  const spec = DefaultPluginUISpec();
  const plugin = await createPluginUI({
    target: root,
    render: renderReact18,
    onBeforeUIRender: (ctx) => {
      (ctx.customState as any)[ActiveColorSchemeStateKey] = new BehaviorSubject(
        ColoringScheme.PLDDT,
      );
      (ctx.customState as any)[MoleculeIndexToShowStateKey] =
        new BehaviorSubject(0);
    },
    spec: {
      ...spec,
      layout: {
        initial: {
          isExpanded: false,
          regionState: {
            top: "full",
            left: "hidden",
            right: "hidden",
            bottom: "hidden",
          },
          controlsDisplay: "reactive",
        },
      },
      config: [
        [PluginConfig.Viewport.ShowExpand, false],
        [PluginConfig.Viewport.ShowControls, false],
        [PluginConfig.Viewport.ShowSettings, false],
        [PluginConfig.Viewport.ShowSelectionMode, false],
        [PluginConfig.Viewport.ShowAnimation, false],
        [PluginConfig.Viewport.ShowTrajectoryControls, false],
        [PluginConfig.Viewport.ShowScreenshotControls, false],
        [COLOR_BY_SASA_CONFIG, doesAnyPayloadHaveSasa],
        [COLOR_BY_SS_CONFIG, doesAnyPayloadHaveSs],
        [SHOW_SEQUENCE_COMPONENT, showSequenceComponent],
        [INVERSE_FOLD_TOOL_ONCLICK, inverseFoldOnclick],
        [DOWNLOAD_ALL_ONCLICK, downloadAllOnClick],
        [SET_MOLECULE_INDEX_TO_SHOW, setMoleculeIndexToShow],
      ],

      components: {
        remoteState: "none",
        viewport: {
          controls: ViewportControlsCustom,
          view: ViewportOverall,
        },
        sequenceViewer: {
          view: SequenceViewCustom,
        },
      },
      canvas3d: {
        renderer: {
          backgroundColor: Color.fromHexStyle("#ffffff"),
        },
      },
    },
  });

  plugin.customModelProperties.register(SASAPropertyProvider, true);
  plugin.customModelProperties.register(SSPropertyProvider, true);
  plugin.representation.structure.themes.colorThemeRegistry.add(
    PlddtColoring.colorThemeProvider!,
  );
  plugin.representation.structure.themes.colorThemeRegistry.add(
    SASAColoring.colorThemeProvider!,
  );
  plugin.managers.lociLabels.addProvider(PlddtColoring.labelProvider!);
  plugin.managers.lociLabels.addProvider(SASAColoring.labelProvider!);
  plugin.managers.lociLabels.addProvider(SSColoring.labelProvider!);
  plugin.representation.structure.themes.colorThemeRegistry.add(
    SSColoring.colorThemeProvider!,
  );
  return plugin;
}

export default function MoleculeViewer2({
  className,
  moleculePayloads,
  showSequenceComponent,
  inverseFoldOnclick,
  downloadAllOnClick,
  moleculeIndexToShow,
  setMoleculeIndexToShow,
}: {
  className?: string;
  moleculePayloads: MoleculePayload[];
  showSequenceComponent?: boolean;
  inverseFoldOnclick?: (e: any) => Promise<void>;
  downloadAllOnClick?: () => Promise<void>;
  moleculeIndexToShow: number;
  setMoleculeIndexToShow: (index: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
  const [trajectories, setTrajectories] = useState<any[]>([]);

  useEffect(() => {
    // Loads the plugin
    (async () => {
      if (!plugin && parentRef.current) {
        const newPlugin = await createViewer(
          parentRef.current,
          moleculePayloads.some(
            (payload) => !!payload.sasaValues && payload.sasaValues?.length > 0,
          ),
          moleculePayloads.some(
            (payload) => !!payload.ssValues && payload.ssValues?.length > 0,
          ),
          showSequenceComponent,
          inverseFoldOnclick,
          downloadAllOnClick,
          setMoleculeIndexToShow,
        );
        setPlugin(newPlugin);
      }
    })();
    return () => {
      setPlugin(null);
    };
  }, []);

  useEffect(() => {
    // Parses the molecule payloads into trajectories in the payload
    const _loadMoleculePayloads = async () => {
      if (!plugin) return;

      const typedData = await Promise.all(
        moleculePayloads.map((moleculePayload, i) =>
          plugin.builders.data.rawData({
            data: moleculePayload.pdbString,
            label: `Protein ${i + 1}`,
          }),
        ),
      );

      const trajectories = await Promise.all(
        typedData.map((data) =>
          plugin.builders.structure.parseTrajectory(data, "pdb"),
        ),
      );
      setTrajectories(trajectories);
    };
    _loadMoleculePayloads();
  }, [!!plugin]);

  useEffect(() => {
    // Creates nodes / models for the trajectory currently selected
    const _showMolecule = async () => {
      if (!plugin) return;
      const trajectory = trajectories[moleculeIndexToShow];
      if (!trajectory) return;

      const moleculePayload = moleculePayloads[moleculeIndexToShow];
      if (!moleculePayload) return;

      (plugin.customState as any)[MoleculeIndexToShowStateKey].next(
        moleculeIndexToShow,
      );

      for (const s of plugin.managers.structure.hierarchy.current.structures) {
        await plugin.managers.structure.hierarchy.remove([s]);
      }

      await plugin.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default",
        {
          modelProperties: {
            autoAttach: [SASA_PROPERTY_NAME, SS_PROPERTY_NAME],
            properties: {
              [SASA_PROPERTY_NAME]: {
                value: moleculePayload.sasaValues,
              },
              [SS_PROPERTY_NAME]: {
                value: moleculePayload.ssValues,
              },
            },
          },
          structure: {
            name: "model",
            params: {},
          },
          showUnitcell: false,
          representationPreset: "auto",
        },
      );

      await plugin.dataTransaction(async () => {
        for (const s of plugin.managers.structure.hierarchy.current
          .structures) {
          await plugin.managers.structure.component.updateRepresentationsTheme(
            s.components,
            { color: ColoringScheme.PLDDT as any },
          );
        }
      });
    };
    _showMolecule();
  }, [trajectories?.length, moleculeIndexToShow]);

  return (
    <ErrorBoundary
      FallbackComponent={() => <>Something went wrong</>}
      onError={(error) => {
        console.error(error);
      }}
    >
      <div
        ref={parentRef}
        className={className}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
        }}
      ></div>
    </ErrorBoundary>
  );
}
